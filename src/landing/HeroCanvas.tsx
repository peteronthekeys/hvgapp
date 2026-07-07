import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Clone, useGLTF, useProgress } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type Lenis from 'lenis';
import { DEFAULT_GLB_OBJECT_MODEL_PATH } from '../types';

interface HeroCanvasProps {
  lenis: Lenis | null;
  /** Same {current} object shape the studio's R3F layer reads — one scroll model. */
  progress: { current: number };
}

interface OrbKeyframe {
  t: number;
  /** x/y as fractions of half-viewport so the track survives any aspect ratio. */
  xf: number;
  yf: number;
  z: number;
  scale: number;
  opacity: number;
}

// The orb is the page's continuity device: hero right → drifts left through
// how-it-works → fades back during the live demo → faint parallax through
// features/pricing → returns center, bloom-hot, behind the final CTA.
// scale is in world units of the normalized model's bounding box; a rotated
// cube reads ~1.7x wider than its edge, so these look bigger than they sound.
const ORB_TRACK: OrbKeyframe[] = [
  { t: 0.0, xf: 0.62, yf: -0.05, z: 0, scale: 1.9, opacity: 1 },
  { t: 0.08, xf: 0.58, yf: 0.05, z: 0, scale: 1.75, opacity: 1 },
  { t: 0.2, xf: -0.95, yf: 0.15, z: -1, scale: 1.0, opacity: 0.5 },
  { t: 0.34, xf: -1.15, yf: 0.3, z: -2, scale: 0.5, opacity: 0.15 },
  { t: 0.52, xf: 0.62, yf: -0.18, z: -2, scale: 0.7, opacity: 0.2 },
  { t: 0.7, xf: -0.58, yf: 0.12, z: -1.5, scale: 0.8, opacity: 0.25 },
  { t: 0.86, xf: 0, yf: -0.2, z: -0.5, scale: 1.2, opacity: 0.8 },
  { t: 1.0, xf: 0, yf: -0.42, z: 0, scale: 1.5, opacity: 0.95 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const sampleTrack = (p: number): OrbKeyframe => {
  const clamped = Math.max(0, Math.min(1, p));
  let i = 0;
  while (i < ORB_TRACK.length - 2 && ORB_TRACK[i + 1].t < clamped) i++;
  const a = ORB_TRACK[i];
  const b = ORB_TRACK[i + 1];
  const span = Math.max(b.t - a.t, 1e-6);
  const t = Math.max(0, Math.min(1, (clamped - a.t) / span));
  // ease each segment slightly so keyframe joins don't feel mechanical
  const e = t * t * (3 - 2 * t);
  return {
    t: clamped,
    xf: lerp(a.xf, b.xf, e),
    yf: lerp(a.yf, b.yf, e),
    z: lerp(a.z, b.z, e),
    scale: lerp(a.scale, b.scale, e),
    opacity: lerp(a.opacity, b.opacity, e),
  };
};

function Orb({ progress }: { progress: { current: number } }) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(DEFAULT_GLB_OBJECT_MODEL_PATH);
  const invalidate = useThree(state => state.invalidate);

  // Normalize the GLB to exactly 1 world unit and center it on its bounding
  // box, so a keyframe `scale` value IS the object's world size (viewport is
  // ~8 units wide at z=0 with this camera).
  const { normScale, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
    return {
      normScale: 1 / maxDim,
      centerOffset: center.multiplyScalar(-1),
    };
  }, [gltf.scene]);

  // First paint: the GLTF resolves after the canvas's initial demand frame.
  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame(({ viewport }) => {
    if (!groupRef.current) return;
    const p = progress.current;
    const k = sampleTrack(p);

    groupRef.current.position.set(
      k.xf * (viewport.width / 2),
      k.yf * (viewport.height / 2),
      k.z,
    );
    // Cap the orb to ~42% of the viewport's world width so it doesn't swallow
    // narrow screens (track values are tuned for desktop aspect).
    const cappedScale = Math.min(k.scale, viewport.width * 0.42);
    groupRef.current.scale.setScalar(cappedScale * normScale);
    groupRef.current.rotation.y = p * Math.PI * 3;
    groupRef.current.rotation.x = 0.3 + p * Math.PI * 0.5;

    groupRef.current.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        material.transparent = true;
        material.opacity = k.opacity;
      });
    });
  });

  return (
    <group ref={groupRef}>
      <group position={centerOffset}>
        <Clone object={gltf.scene} />
      </group>
    </group>
  );
}

useGLTF.preload(DEFAULT_GLB_OBJECT_MODEL_PATH);

/**
 * Reflections without a network fetch: three's built-in RoomEnvironment
 * (drei's <Environment> presets fetch HDRs from a CDN, which can hang the
 * Suspense boundary — see git history).
 */
function LocalEnvironment() {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    return () => {
      scene.environment = null;
      envMap.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

/**
 * Re-render the demand-frameloop canvas when the page scrolls, and once more
 * whenever asset loading (GLB, HDR) finishes — otherwise the first visible
 * frame would wait for the first scroll.
 */
function InvalidateOnScroll({ lenis }: { lenis: Lenis | null }) {
  const invalidate = useThree(state => state.invalidate);
  const { active } = useProgress();

  useEffect(() => {
    if (!active) invalidate();
  }, [active, invalidate]);

  useEffect(() => {
    invalidate();
    if (!lenis) return;
    const onScroll = () => invalidate();
    lenis.on('scroll', onScroll);
    return () => lenis.off('scroll', onScroll);
  }, [lenis, invalidate]);

  return null;
}

export function HeroCanvas({ lenis, progress }: HeroCanvasProps) {
  // If the page loads while the tab is hidden/unsized, R3F's ResizeObserver can
  // miss the first measurement and the canvas never initializes. One nudge fixes it.
  useEffect(() => {
    const id = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas frameloop="demand" camera={{ position: [0, 0, 5], fov: 50 }}>
        {/* No drei <Environment> here: its CDN HDR fetch can hang the whole
            Suspense boundary and take the orb with it. Deterministic lights. */}
        <LocalEnvironment />
        <ambientLight intensity={0.35} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <directionalLight position={[-6, -4, 8]} intensity={0.4} color="#2dd4bf" />
        <Suspense fallback={null}>
          <Orb progress={progress} />
        </Suspense>
        <InvalidateOnScroll lenis={lenis} />
        <EffectComposer multisampling={0} resolutionScale={0.75}>
          <Bloom intensity={0.5} luminanceThreshold={0.25} luminanceSmoothing={0.45} mipmapBlur />
          <Vignette offset={0.22} darkness={0.28} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

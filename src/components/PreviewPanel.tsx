import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { ProjectSchema, SceneElement } from '../types';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';

interface PreviewPanelProps {
  schema: ProjectSchema;
}

// Normalized scroll progress shared by the R3F (cube) layer. Fed by the same
// Lenis instance that drives the shared scroll container, so both engines
// read from one scroll model instead of the cube layer polling raw scrollTop.
const ScrollProgressContext = React.createContext<{ current: number }>({ current: 0 });

function TextElementView({
  element,
  gsapInstance,
  scrollTrigger,
  container,
  sceneStartPx,
  sceneHeightPx,
}: {
  element: SceneElement;
  gsapInstance: typeof gsapType;
  scrollTrigger: typeof ScrollTriggerType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
}) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (element.type !== 'text' || !elRef.current) return;

    const elStartPx = sceneStartPx + element.start * sceneHeightPx;
    const elEndPx = sceneStartPx + element.end * sceneHeightPx;
    const distance = Math.max(elEndPx - elStartPx, 1);

    const target = elRef.current;
    gsapInstance.set(target, { y: element.startY, opacity: element.startOpacity });

    const tween = gsapInstance.to(target, {
      y: element.endY,
      opacity: element.endOpacity,
      ease: 'none',
      scrollTrigger: {
        scroller: container,
        trigger: container,
        start: `top+=${elStartPx} top`,
        end: `top+=${elStartPx + distance} top`,
        scrub: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [element, gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx]);

  if (element.type !== 'text') return null;

  return (
    <div
      ref={elRef}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-bold tracking-tighter text-slate-100 whitespace-nowrap"
    >
      {element.content}
    </div>
  );
}

function CubeElementView({
  element,
  sceneStartVh,
  sceneHeightVh,
}: {
  element: SceneElement;
  sceneStartVh: number;
  sceneHeightVh: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const progressRef = React.useContext(ScrollProgressContext);

  useFrame(({ size }) => {
    if (!meshRef.current || !materialRef.current) return;

    const vh = size.height;
    const scrollTop = progressRef.current * vh; // normalized offset -> px, same units as before

    const sceneStartPx = (sceneStartVh / 100) * vh;
    const sceneHeightPx = (sceneHeightVh / 100) * vh;

    const elStartPx = sceneStartPx + element.start * sceneHeightPx;
    const elEndPx = sceneStartPx + element.end * sceneHeightPx;

    let progress = 0;
    if (elEndPx > elStartPx) {
      progress = (scrollTop - elStartPx) / (elEndPx - elStartPx);
    }
    progress = Math.max(0, Math.min(1, progress));

    meshRef.current.rotation.x = progress * Math.PI * 2;
    meshRef.current.rotation.y = progress * Math.PI * 2;

    const currentY = element.startY + (element.endY - element.startY) * progress;
    meshRef.current.position.y = currentY / -50;

    const currentOpacity = element.startOpacity + (element.endOpacity - element.startOpacity) * progress;
    materialRef.current.opacity = currentOpacity;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#10b981"
        transparent
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

export function PreviewPanel({ schema }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef({ current: 0 });

  const [engines, setEngines] = useState<{
    gsapInstance: typeof gsapType;
    scrollTrigger: typeof ScrollTriggerType;
  } | null>(null);

  // Dynamic-import GSAP + ScrollTrigger per repo perf rules; register once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ default: gsapInstance }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsapInstance.registerPlugin(ScrollTrigger);
      setEngines({ gsapInstance, scrollTrigger: ScrollTrigger });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lenis drives the shared scroll container. ScrollTrigger uses the same
  // container as its scroller and stays in sync via Lenis's scroll event +
  // gsap's ticker (the standard Lenis/ScrollTrigger integration).
  useEffect(() => {
    if (!engines || !containerRef.current) return;

    const { gsapInstance, scrollTrigger } = engines;
    const container = containerRef.current;
    let lenis: Lenis;
    let rafCallback: (time: number) => void;

    (async () => {
      const { default: LenisConstructor } = await import('lenis');
      lenis = new LenisConstructor({
        wrapper: container,
        content: contentRef.current ?? undefined,
      });

      lenis.on('scroll', () => {
        scrollTrigger.update();
        scrollProgressRef.current.current = lenis.progress;
      });

      scrollTrigger.scrollerProxy(container, {
        scrollTop(value?: number) {
          if (arguments.length && typeof value === 'number') {
            lenis.scrollTo(value, { immediate: true });
          }
          return lenis.animatedScroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: container.clientWidth,
            height: container.clientHeight,
          };
        },
      });

      rafCallback = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsapInstance.ticker.add(rafCallback);
      gsapInstance.ticker.lagSmoothing(0);

      scrollTrigger.addEventListener('refresh', () => lenis.resize());
      scrollTrigger.refresh();
    })();

    return () => {
      if (rafCallback) gsapInstance.ticker.remove(rafCallback);
      lenis?.destroy();
    };
  }, [engines]);

  // Calculate cumulative heights to know where each scene starts
  const sceneLayouts = useMemo(() => {
    let currentVh = 0;
    return schema.scenes.map(scene => {
      const startVh = currentVh;
      currentVh += scene.height;
      return { ...scene, startVh };
    });
  }, [schema]);

  return (
    <div className="relative h-full w-full bg-slate-900 overflow-hidden">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Environment preset="city" />

          <ScrollProgressContext.Provider value={scrollProgressRef.current}>
            {sceneLayouts.map(scene =>
              scene.elements
                .filter(el => el.type === 'cube')
                .map(el => (
                  <CubeElementView
                    key={el.id}
                    element={el}
                    sceneStartVh={scene.startVh}
                    sceneHeightVh={scene.height}
                  />
                ))
            )}
          </ScrollProgressContext.Provider>
        </Canvas>
      </div>

      {/* Scrollable Content Layer */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden z-20"
      >
        <div ref={contentRef} className="relative flex flex-col">
          {sceneLayouts.map(scene => (
            <div
              key={scene.id}
              className="relative w-full border-b border-slate-800/30"
              style={{ height: `${scene.height}vh` }}
            >
              {/* Sticky container that stays on screen for the duration of the scene's height */}
              <div className="sticky top-0 w-full h-[100vh] overflow-hidden pointer-events-none">
                <div className="absolute top-4 left-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
                  Scene {scene.id.slice(0, 6)} ({scene.height}vh)
                </div>

                {engines && (
                  <SceneDOMObserver
                    scene={scene}
                    gsapInstance={engines.gsapInstance}
                    scrollTrigger={engines.scrollTrigger}
                    container={containerRef.current}
                    startVh={scene.startVh}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneDOMObserver({
  scene,
  gsapInstance,
  scrollTrigger,
  container,
  startVh,
}: {
  scene: { id: string; height: number; elements: SceneElement[] };
  gsapInstance: typeof gsapType;
  scrollTrigger: typeof ScrollTriggerType;
  container: HTMLDivElement | null;
  startVh: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ startPx: 0, heightPx: 0 });

  const updateLayout = useCallback(() => {
    const scrollContainer = ref.current?.closest('.overflow-y-auto');
    const vhPx = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;

    setLayout({
      startPx: (startVh / 100) * vhPx,
      heightPx: (scene.height / 100) * vhPx,
    });
  }, [scene.height, startVh]);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  if (!container) return null;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      {layout.heightPx > 0 && scene.elements.map(el => (
        <TextElementView
          key={el.id}
          element={el}
          gsapInstance={gsapInstance}
          scrollTrigger={scrollTrigger}
          container={container}
          sceneStartPx={layout.startPx}
          sceneHeightPx={layout.heightPx}
        />
      ))}
    </div>
  );
}

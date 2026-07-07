import React, { useRef, useMemo } from 'react';
import { ProjectSchema, SceneElement } from '../types';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

interface PreviewPanelProps {
  schema: ProjectSchema;
}

function TextElementView({ 
  element, 
  scrollY, 
  sceneStartPx, 
  sceneHeightPx 
}: { 
  element: SceneElement; 
  scrollY: MotionValue<number>; 
  sceneStartPx: number; 
  sceneHeightPx: number; 
}) {
  if (element.type !== 'text') return null;

  const elStartPx = sceneStartPx + (element.start * sceneHeightPx);
  const elEndPx = sceneStartPx + (element.end * sceneHeightPx);

  const y = useTransform(
    scrollY, 
    [elStartPx, elEndPx], 
    [element.startY, element.endY]
  );
  
  const opacity = useTransform(
    scrollY, 
    [elStartPx, elEndPx], 
    [element.startOpacity, element.endOpacity]
  );

  return (
    <motion.div
      style={{ y, opacity }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-bold tracking-tighter text-slate-100 whitespace-nowrap"
    >
      {element.content}
    </motion.div>
  );
}

function CubeElementView({ 
  element, 
  scrollRef, 
  sceneStartVh, 
  sceneHeightVh 
}: { 
  element: SceneElement; 
  scrollRef: React.RefObject<HTMLDivElement | null>;
  sceneStartVh: number;
  sceneHeightVh: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!meshRef.current || !materialRef.current || !scrollRef.current) return;

    const container = scrollRef.current;
    const vh = container.clientHeight;
    const scrollTop = container.scrollTop;

    // Calculate pixel positions
    const sceneStartPx = (sceneStartVh / 100) * vh;
    const sceneHeightPx = (sceneHeightVh / 100) * vh;
    
    const elStartPx = sceneStartPx + (element.start * sceneHeightPx);
    const elEndPx = sceneStartPx + (element.end * sceneHeightPx);

    // Map scroll to 0-1 progress for this element
    let progress = 0;
    if (elEndPx > elStartPx) {
      progress = (scrollTop - elStartPx) / (elEndPx - elStartPx);
    }
    progress = Math.max(0, Math.min(1, progress));

    // Rotate
    meshRef.current.rotation.x = progress * Math.PI * 2;
    meshRef.current.rotation.y = progress * Math.PI * 2;

    // Translate Y (scale the pixel values to 3D units, divide by ~50)
    const currentY = element.startY + (element.endY - element.startY) * progress;
    meshRef.current.position.y = currentY / -50; 

    // Opacity
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
  
  const { scrollY } = useScroll({ container: containerRef });

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
          
          {sceneLayouts.map(scene => 
            scene.elements
              .filter(el => el.type === 'cube')
              .map(el => (
                <CubeElementView 
                  key={el.id} 
                  element={el} 
                  scrollRef={containerRef} 
                  sceneStartVh={scene.startVh}
                  sceneHeightVh={scene.height}
                />
              ))
          )}
        </Canvas>
      </div>

      {/* Scrollable Content Layer */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 overflow-y-auto overflow-x-hidden z-20"
      >
        <div className="relative flex flex-col">
          {sceneLayouts.map(scene => (
            <div 
              key={scene.id} 
              className="relative w-full border-b border-slate-800/30"
              style={{ height: `${scene.height}vh` }}
            >
              {/* Sticky container that stays on screen for the duration of the scene's height */}
              <div className="sticky top-0 w-full h-[100vh] overflow-hidden pointer-events-none">
                <div className="absolute top-4 left-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
                  Scene {scene.id.slice(0,6)} ({scene.height}vh)
                </div>
                
                <SceneDOMObserver 
                  scene={scene} 
                  scrollY={scrollY} 
                  startVh={scene.startVh}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneDOMObserver({ scene, scrollY, startVh }: { scene: any, scrollY: MotionValue<number>, startVh: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = React.useState({ startPx: 0, heightPx: 0 });

  React.useEffect(() => {
    const updateLayout = () => {
      // Find the scroll container (closest overflow-y-auto parent, or just assume it matches viewport height for now)
      // Since container is relative to full screen height minus any headers, let's use the container's clientHeight.
      // In this app, the container is the preview panel which fills the right column.
      let container = ref.current?.closest('.overflow-y-auto');
      let vhPx = container ? container.clientHeight : window.innerHeight;
      
      setLayout({
        startPx: (startVh / 100) * vhPx,
        heightPx: (scene.height / 100) * vhPx
      });
    };
    updateLayout();
    
    // Resize observer on container is better, but window resize is okay for prototype
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [scene.height, startVh]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      {layout.heightPx > 0 && scene.elements.map((el: SceneElement) => (
        <TextElementView 
          key={el.id} 
          element={el} 
          scrollY={scrollY} 
          sceneStartPx={layout.startPx} 
          sceneHeightPx={layout.heightPx} 
        />
      ))}
    </div>
  );
}

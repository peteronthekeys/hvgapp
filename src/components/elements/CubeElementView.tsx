import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CubeElement } from '../../types';
import { ScrollProgressContext, getElementProgress } from './progress';
import type { ScenePolishControls } from './registry';

export function CubeElementView({
  element,
  sceneStartVh,
  sceneHeightVh,
  polishControls,
}: {
  element: CubeElement;
  sceneStartVh: number;
  sceneHeightVh: number;
  polishControls: ScenePolishControls;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const progressRef = React.useContext(ScrollProgressContext);

  useFrame(({ size }) => {
    if (!meshRef.current || !materialRef.current) return;

    const progress = getElementProgress(element, progressRef.current, size.height, sceneStartVh, sceneHeightVh);

    meshRef.current.rotation.x = progress * Math.PI * 2 * polishControls.cubeRotationTurns;
    meshRef.current.rotation.y = progress * Math.PI * 2 * polishControls.cubeRotationTurns;

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

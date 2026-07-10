import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Clone, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GlbObjectElement, DEFAULT_GLB_OBJECT_MODEL_PATH } from '../../types';
import { ScrollProgressContext, getElementProgress } from './progress';
import type { ScenePolishControls } from './registry';

export function GlbObjectElementView({
  element,
  sceneStartVh,
  sceneHeightVh,
  polishControls,
}: {
  element: GlbObjectElement;
  sceneStartVh: number;
  sceneHeightVh: number;
  polishControls: ScenePolishControls;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = React.useContext(ScrollProgressContext);
  const gltf = useGLTF(element.modelPath || DEFAULT_GLB_OBJECT_MODEL_PATH);

  useFrame(({ size }) => {
    if (!groupRef.current) return;

    const progress = getElementProgress(element, progressRef.current, size.height, sceneStartVh, sceneHeightVh);
    const currentY = element.startY + (element.endY - element.startY) * progress;
    const currentOpacity = element.startOpacity + (element.endOpacity - element.startOpacity) * progress;

    groupRef.current.position.y = currentY / -50;
    groupRef.current.rotation.x = progress * Math.PI * 0.5;
    groupRef.current.rotation.y = progress * Math.PI * 2 * polishControls.glbRotationTurns;

    groupRef.current.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        material.transparent = true;
        material.opacity = currentOpacity;
      });
    });
  });

  return (
    <group ref={groupRef} scale={polishControls.glbScale}>
      <Clone object={gltf.scene} />
    </group>
  );
}

useGLTF.preload(DEFAULT_GLB_OBJECT_MODEL_PATH);

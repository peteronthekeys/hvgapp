import React from 'react';
import { SceneElement } from '../../types';

// Normalized scroll progress shared by the R3F (cube) layer. Fed by the same
// Lenis instance that drives the shared scroll container, so both engines
// read from one scroll model instead of the cube layer polling raw scrollTop.
export const ScrollProgressContext = React.createContext<{ current: number }>({ current: 0 });

export const getElementProgress = (
  element: SceneElement,
  scrollProgress: number,
  viewportHeight: number,
  sceneStartVh: number,
  sceneHeightVh: number
) => {
  const normalizedOffsetPx = scrollProgress * viewportHeight;
  const sceneStartPx = (sceneStartVh / 100) * viewportHeight;
  const sceneHeightPx = (sceneHeightVh / 100) * viewportHeight;

  const elStartPx = sceneStartPx + element.start * sceneHeightPx;
  const elEndPx = sceneStartPx + element.end * sceneHeightPx;

  let progress = 0;
  if (elEndPx > elStartPx) {
    progress = (normalizedOffsetPx - elStartPx) / (elEndPx - elStartPx);
  }

  return Math.max(0, Math.min(1, progress));
};

import React from 'react';
import { ImageElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';

export function ImageElementView({
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
  if (element.type !== 'image') return null;

  const image = element as ImageElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  // Explicit layout.width means the wrapper already constrains size, so the
  // image just fills it; with no layout, cap at 40vw so it doesn't dominate
  // the scene (see PositionedElement's centered default).
  const sizeClass = image.layout?.width !== undefined ? 'w-full h-auto' : 'max-w-[40vw]';

  return (
    <PositionedElement element={element} ctx={ctx}>
      <img
        src={image.src}
        srcSet={image.srcset}
        alt={image.alt ?? ''}
        draggable={false}
        loading="lazy"
        className={`${sizeClass} rounded-lg block`}
        style={{ objectFit: image.objectFit ?? 'cover' }}
      />
    </PositionedElement>
  );
}

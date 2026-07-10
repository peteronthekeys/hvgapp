import React, { useRef } from 'react';
import { ElementLayout, SceneElement } from '../../types';
import type { DomRendererCtx } from './registry';
import { useScrubTween } from './useScrubTween';

const ANCHOR_TRANSFORM: Record<NonNullable<ElementLayout['anchor']>, string> = {
  center: 'translate(-50%, -50%)',
  'top-left': 'none',
  'top-right': 'translateX(-100%)',
  'bottom-left': 'translateY(-100%)',
  'bottom-right': 'translate(-100%, -100%)',
};

/**
 * DOM wrapper that applies an element's optional `layout` (position/anchor/
 * width/z) and runs the shared scroll-scrub tween. The outer div owns the
 * anchor transform (position in the scene); the inner div is the GSAP tween
 * target for y/opacity — keeping them separate means GSAP's transform never
 * overwrites the anchor transform.
 */
export function PositionedElement({
  element,
  ctx,
  className,
  children,
}: {
  element: SceneElement;
  ctx: DomRendererCtx;
  className?: string;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  useScrubTween(innerRef, element, ctx);

  const layout = element.layout;
  const x = layout?.x ?? 50;
  const y = layout?.y ?? 50;
  const anchor = layout?.anchor ?? 'center';

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: layout?.width !== undefined ? `${layout.width}%` : undefined,
        zIndex: layout?.z ?? 0,
        transform: ANCHOR_TRANSFORM[anchor],
      }}
    >
      <div ref={innerRef} className={className}>
        {children}
      </div>
    </div>
  );
}

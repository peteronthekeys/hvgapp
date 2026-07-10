import React, { useRef } from 'react';
import { ElementLayout, SceneElement } from '../../types';
import { elementRegistry } from './registry';
import type { DomRendererCtx } from './registry';
import { useScrubTween } from './useScrubTween';
import { useAppear } from './useAppear';

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
  interactive,
}: {
  element: SceneElement;
  ctx: DomRendererCtx;
  className?: string;
  children: React.ReactNode;
  // Overrides the registry's `interactive` flag for this element when set —
  // lets a renderer make interactivity conditional on element state (e.g.
  // video only being interactive in 'clickToPlay' mode) instead of always-on
  // for the whole type. Falls back to elementRegistry[element.type]?.interactive.
  interactive?: boolean;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  // trigger 'appear' (default 'scrub') picks one tween or the other, never
  // both — the unused hook gets a permanently-null ref so its effect bails
  // out immediately (see useScrubTween/useAppear).
  const disabledRef = useRef<HTMLDivElement>(null);
  const isAppear = element.trigger === 'appear';
  useScrubTween(isAppear ? disabledRef : innerRef, element, ctx);
  useAppear(isAppear ? innerRef : disabledRef, element, ctx);

  const layout = element.layout;
  const x = layout?.x ?? 50;
  const y = layout?.y ?? 50;
  const anchor = layout?.anchor ?? 'center';
  // The scene/sticky/DOM-layer wrappers are all pointer-events-none (see
  // PreviewPanel.tsx) so scroll-hijacking scroll events pass through to
  // Lenis; only elements that opt in via the registry (or this override)
  // re-enable pointer events on their own wrapper.
  const isInteractive = interactive ?? elementRegistry[element.type]?.interactive ?? false;

  return (
    <div
      className={isInteractive ? 'absolute pointer-events-auto' : 'absolute'}
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

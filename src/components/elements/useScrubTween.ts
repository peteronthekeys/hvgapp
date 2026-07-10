import { useEffect } from 'react';
import { SceneElement } from '../../types';
import type { DomRendererCtx } from './registry';

/**
 * Converts an element's start/end (0-1 fractions of its scene) into absolute
 * scroll-container pixel offsets. Shared by useScrubTween and any nested
 * scrub timeline (e.g. TextElementView's SplitText reveal) so both agree on
 * the same window math.
 */
export function getElementWindowPx(
  element: Pick<SceneElement, 'start' | 'end'>,
  sceneStartPx: number,
  sceneHeightPx: number
): { elStartPx: number; elEndPx: number } {
  return {
    elStartPx: sceneStartPx + element.start * sceneHeightPx,
    elEndPx: sceneStartPx + element.end * sceneHeightPx,
  };
}

/**
 * Drives the shared scroll-scrub tween (y + opacity) for a DOM element:
 * gsap.set to the start values, then gsap.to the end values scrubbed over
 * the element's px window within its scene. Extracted from TextElementView
 * so any DOM renderer can opt in. Kills the tween and its ScrollTrigger on
 * cleanup.
 */
export function useScrubTween(
  targetRef: React.RefObject<HTMLElement | null>,
  element: SceneElement,
  ctx: Pick<DomRendererCtx, 'gsapInstance' | 'container' | 'sceneStartPx' | 'sceneHeightPx'>
): void {
  const { gsapInstance, container, sceneStartPx, sceneHeightPx } = ctx;

  useEffect(() => {
    if (!targetRef.current) return;

    const { elStartPx, elEndPx } = getElementWindowPx(element, sceneStartPx, sceneHeightPx);
    const distance = Math.max(elEndPx - elStartPx, 1);

    const target = targetRef.current;
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
  }, [element, gsapInstance, container, sceneStartPx, sceneHeightPx]);
}

import { useLayoutEffect } from 'react';
import { AppearConfig, SceneElement } from '../../types';
import type { DomRendererCtx } from './registry';

const DEFAULT_DURATION = 0.8;
const DEFAULT_DELAY = 0;
// Shrinks the IntersectionObserver root's bottom edge so an element is
// considered "entered" once it crosses into the top 80% of the container —
// the IO analog of the originally-planned ScrollTrigger `start: 'top 80%'`.
const ENTER_ROOT_MARGIN = '0px 0px -20% 0px';

const PRESET_FROM: Record<AppearConfig['preset'], Record<string, number>> = {
  fade: { opacity: 0 },
  'slide-up': { opacity: 0, y: 48 },
  'slide-left': { opacity: 0, x: 48 },
  scale: { opacity: 0, scale: 0.9 },
  spring: { opacity: 0, y: 48 },
};

const PRESET_TO: Record<AppearConfig['preset'], Record<string, number>> = {
  fade: { opacity: 1 },
  'slide-up': { opacity: 1, y: 0 },
  'slide-left': { opacity: 1, x: 0 },
  scale: { opacity: 1, scale: 1 },
  spring: { opacity: 1, y: 0 },
};

/**
 * Drives a one-shot reveal tween (opacity + transform, per `appear.preset`)
 * that plays when the element's wrapper node scrolls into view — the
 * trigger:'appear' counterpart to useScrubTween's continuous scrub.
 *
 * Shipped as IntersectionObserver, not ScrollTrigger. The originally-planned
 * approach (a ScrollTrigger with `trigger: <element>` inside the Lenis
 * scrollerProxy container) was verified empirically to never fire: seeking
 * across the full 0-1 progress range left the target's opacity at 0. IO with
 * `root: container` is scroller-agnostic — it reacts to the element's actual
 * intersection with the container's viewport regardless of how scrollTop is
 * driven (native scroll, Lenis smoothing, or an imperative `scrollTo`), so it
 * doesn't depend on ScrollTrigger's coordinate math agreeing with the
 * scrollerProxy override.
 */
export function useAppear(
  targetRef: React.RefObject<HTMLElement | null>,
  element: SceneElement,
  ctx: Pick<DomRendererCtx, 'gsapInstance' | 'container'>
): void {
  const { gsapInstance, container } = ctx;
  const appear = element.appear;
  // Value deps, not object identity: every schema write re-creates element
  // objects (migrate-on-write), and identity deps would re-hide + replay every
  // visible appear element on unrelated edits. useLayoutEffect so the initial
  // hide lands before paint (no one-frame flash at natural opacity).
  const preset = appear?.preset;
  const duration = appear?.duration ?? DEFAULT_DURATION;
  const delay = appear?.delay ?? DEFAULT_DELAY;
  const once = appear ? appear.once !== false : true;

  useLayoutEffect(() => {
    if (!targetRef.current || !preset) return;

    const target = targetRef.current;
    const from = PRESET_FROM[preset];
    const to = PRESET_TO[preset];
    const ease = preset === 'spring' ? 'back.out(1.7)' : 'power3.out';

    gsapInstance.set(target, from);

    let tween: gsap.core.Tween | null = null;
    let hasPlayed = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (once && hasPlayed) return;
          hasPlayed = true;
          tween?.kill();
          tween = gsapInstance.to(target, { ...to, duration, delay, ease });
        } else if (!once && hasPlayed) {
          tween?.kill();
          tween = gsapInstance.to(target, { ...from, duration, ease: 'power2.in' });
        }
      },
      { root: container, rootMargin: ENTER_ROOT_MARGIN, threshold: 0 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      tween?.kill();
    };
  }, [preset, duration, delay, once, gsapInstance, container, targetRef]);
}

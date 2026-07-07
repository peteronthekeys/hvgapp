import { useEffect, useRef, useState } from 'react';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';

export interface LandingEngines {
  gsapInstance: typeof gsapType;
  scrollTrigger: typeof ScrollTriggerType;
  lenis: Lenis;
}

export interface LandingScroll {
  engines: LandingEngines | null;
  /** Normalized 0-1 page scroll progress, same shape the studio's R3F layer consumes. */
  progressRef: React.RefObject<{ current: number }>;
  reducedMotion: boolean;
}

/**
 * The landing page's single scroll model: window-mode Lenis feeding GSAP
 * ScrollTrigger (no scrollerProxy needed for window) plus a normalized
 * progress ref for the R3F hero canvas — mirror of PreviewPanel's wiring.
 * With prefers-reduced-motion, no engines load and the page scrolls natively.
 */
export function useLandingScroll(): LandingScroll {
  const progressRef = useRef({ current: 0 });
  const [engines, setEngines] = useState<LandingEngines | null>(null);
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reducedMotion) return;

    let cancelled = false;
    let lenis: Lenis | undefined;
    let rafCallback: ((time: number) => void) | undefined;
    let gsapRef: typeof gsapType | undefined;

    (async () => {
      const [{ default: gsapInstance }, { ScrollTrigger }, { default: LenisConstructor }] =
        await Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]);
      if (cancelled) return;

      gsapInstance.registerPlugin(ScrollTrigger);
      gsapRef = gsapInstance;

      lenis = new LenisConstructor();
      lenis.on('scroll', () => {
        ScrollTrigger.update();
        progressRef.current.current = lenis!.progress;
      });

      rafCallback = (time: number) => {
        lenis!.raf(time * 1000);
      };
      gsapInstance.ticker.add(rafCallback);
      gsapInstance.ticker.lagSmoothing(0);

      if (import.meta.env.DEV) {
        (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
      }

      setEngines({ gsapInstance, scrollTrigger: ScrollTrigger, lenis });
    })();

    return () => {
      cancelled = true;
      if (gsapRef && rafCallback) gsapRef.ticker.remove(rafCallback);
      lenis?.destroy();
    };
  }, [reducedMotion]);

  return { engines, progressRef, reducedMotion };
}

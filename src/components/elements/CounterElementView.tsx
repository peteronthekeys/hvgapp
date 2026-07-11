import React, { useEffect, useRef } from 'react';
import { CounterElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';
import { getElementWindowPx } from './useScrubTween';

const DEFAULT_APPEAR_DURATION = 2;
// Mirrors useAppear's IO threshold — see that file's comment on why
// IntersectionObserver (not a ScrollTrigger element-trigger) is used to
// detect viewport entry inside the Lenis scrollerProxy container.
const ENTER_ROOT_MARGIN = '0px 0px -20% 0px';

function formatCounter(counter: CounterElement, value: number): string {
  const decimals = counter.decimals ?? 0;
  return `${counter.prefix ?? ''}${value.toFixed(decimals)}${counter.suffix ?? ''}`;
}

export function CounterElementView({
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
  if (element.type !== 'counter') return null;

  const counter = element as CounterElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };

  return (
    <PositionedElement element={element} ctx={ctx}>
      <CounterValue
        counter={counter}
        gsapInstance={gsapInstance}
        container={container}
        sceneStartPx={sceneStartPx}
        sceneHeightPx={sceneHeightPx}
      />
    </PositionedElement>
  );
}

// Owns only the number's textContent — the wrapper's y/opacity scrub or
// appear reveal (PositionedElement, driven by useScrubTween/useAppear) is
// untouched by this component.
function CounterValue({
  counter,
  gsapInstance,
  container,
  sceneStartPx,
  sceneHeightPx,
}: {
  counter: CounterElement;
  gsapInstance: typeof gsapType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isAppear = counter.trigger === 'appear';

  // Scrub mode: a GSAP tween on a plain proxy object, scrubbed via
  // ScrollTrigger over the same start/end window as the wrapper's own scrub
  // tween (getElementWindowPx) — onUpdate writes the formatted value into
  // textContent directly so counting never triggers a React re-render.
  useEffect(() => {
    if (isAppear || !ref.current) return;
    const target = ref.current;
    const proxy = { value: counter.from };
    const { elStartPx, elEndPx } = getElementWindowPx(counter, sceneStartPx, sceneHeightPx);
    const distance = Math.max(elEndPx - elStartPx, 1);

    target.textContent = formatCounter(counter, counter.from);

    const tween = gsapInstance.to(proxy, {
      value: counter.to,
      ease: 'none',
      onUpdate: () => {
        target.textContent = formatCounter(counter, proxy.value);
      },
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
  }, [isAppear, counter, gsapInstance, container, sceneStartPx, sceneHeightPx]);

  // Appear mode: count once over appear.duration (default 2s) starting when
  // the element's own wrapper enters the viewport, detected the same way
  // useAppear does (IO, not ScrollTrigger — see that file's comment).
  useEffect(() => {
    if (!isAppear || !ref.current) return;
    const target = ref.current;
    const proxy = { value: counter.from };
    const duration = counter.appear?.duration ?? DEFAULT_APPEAR_DURATION;

    target.textContent = formatCounter(counter, counter.from);

    let tween: gsap.core.Tween | null = null;
    let hasPlayed = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasPlayed) return;
        hasPlayed = true;
        tween = gsapInstance.to(proxy, {
          value: counter.to,
          duration,
          delay: counter.appear?.delay ?? 0,
          ease: 'power2.out',
          onUpdate: () => {
            target.textContent = formatCounter(counter, proxy.value);
          },
        });
      },
      { root: container, rootMargin: ENTER_ROOT_MARGIN, threshold: 0 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      tween?.kill();
    };
  }, [isAppear, counter, gsapInstance, container]);

  return (
    <span ref={ref} className="font-mono font-bold text-5xl text-slate-100 tabular-nums">
      {formatCounter(counter, counter.from)}
    </span>
  );
}

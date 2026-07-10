import React, { useRef, useEffect } from 'react';
import { SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

export function TextElementView({
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
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (element.type !== 'text' || !elRef.current) return;

    const elStartPx = sceneStartPx + element.start * sceneHeightPx;
    const elEndPx = sceneStartPx + element.end * sceneHeightPx;
    const distance = Math.max(elEndPx - elStartPx, 1);

    const target = elRef.current;
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
  }, [element, gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx]);

  if (element.type !== 'text') return null;

  return (
    <div
      ref={elRef}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-bold tracking-tighter text-slate-100 whitespace-nowrap"
    >
      {element.content}
    </div>
  );
}

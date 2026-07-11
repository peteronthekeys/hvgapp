import React, { useEffect, useRef, useState } from 'react';
import { LottieElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { AnimationItem } from 'lottie-web';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';
import { getElementWindowPx } from './useScrubTween';
import { loadLottie } from './lottieLoader';

// Mirrors useAppear's/CounterElementView's IO threshold — autoplay entry
// detection uses IntersectionObserver (not a ScrollTrigger element-trigger)
// for the same reason documented in useAppear.ts: it doesn't depend on
// ScrollTrigger's coordinate math agreeing with the Lenis scrollerProxy.
const ENTER_ROOT_MARGIN = '0px 0px -20% 0px';

export function LottieElementView({
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
  if (element.type !== 'lottie') return null;

  const lottieEl = element as LottieElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  // Mirrors SvgElementView's centered-default sizing: an explicit
  // layout.width means the wrapper already constrains size, otherwise cap
  // at 30vw square so the animation doesn't dominate the scene.
  const sizeClass = lottieEl.layout?.width !== undefined ? 'w-full h-auto aspect-square' : 'w-[30vw] max-w-[30vw] aspect-square';

  return (
    <PositionedElement element={element} ctx={ctx}>
      <LottiePlayer
        lottieEl={lottieEl}
        gsapInstance={gsapInstance}
        container={container}
        sceneStartPx={sceneStartPx}
        sceneHeightPx={sceneHeightPx}
        sizeClass={sizeClass}
      />
    </PositionedElement>
  );
}

// Owns the lottie AnimationItem lifecycle: loads the runtime (lottieLoader),
// creates the animation into a plain DOM node, then either scrubs its frame
// via a GSAP tween over the element's scroll window (same window math as
// CounterElementView/SvgElementView) or plays it once an IntersectionObserver
// reports viewport entry. The lottie <div> stays mounted even after a load
// failure — only a text overlay toggles — so a mid-flight `data_failed`
// can't detach the node this effect is holding a reference to.
function LottiePlayer({
  lottieEl,
  gsapInstance,
  container,
  sceneStartPx,
  sceneHeightPx,
  sizeClass,
}: {
  lottieEl: LottieElement;
  gsapInstance: typeof gsapType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
  sizeClass: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const playMode = lottieEl.playMode === 'autoplay' ? 'autoplay' : 'scrub';
  const hasSrc = Boolean(lottieEl.src);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !lottieEl.src) return;

    // StrictMode-safe: `cancelled` guards the async loadLottie().then() so a
    // dev double-invoke (mount -> cleanup -> remount) never creates an
    // AnimationItem for an already-unmounted effect run — nothing is created,
    // so there is nothing to destroy or leak.
    let cancelled = false;
    let anim: AnimationItem | null = null;
    const cleanups: Array<() => void> = [];

    loadLottie()
      .then(lottie => {
        if (cancelled) return;

        const created = lottie.loadAnimation({
          container: node,
          renderer: 'svg',
          loop: playMode === 'autoplay' ? (lottieEl.loop ?? true) : false,
          autoplay: false,
          path: lottieEl.src,
        }) as AnimationItem;
        anim = created;

        cleanups.push(created.addEventListener('data_failed', () => setFailed(true)));

        if (playMode === 'scrub') {
          // totalFrames is 0 until the animation data + DOM are ready, so
          // the scrub tween's frame range can only be built inside this
          // one-shot DOMLoaded listener.
          cleanups.push(
            created.addEventListener('DOMLoaded', () => {
              const { elStartPx, elEndPx } = getElementWindowPx(lottieEl, sceneStartPx, sceneHeightPx);
              const distance = Math.max(elEndPx - elStartPx, 1);
              const maxFrame = Math.max(created.totalFrames - 1, 0);
              const proxy = { frame: 0 };

              const tween = gsapInstance.to(proxy, {
                frame: maxFrame,
                ease: 'none',
                onUpdate: () => created.goToAndStop(proxy.frame, true),
                scrollTrigger: {
                  scroller: container,
                  trigger: container,
                  start: `top+=${elStartPx} top`,
                  end: `top+=${elStartPx + distance} top`,
                  scrub: true,
                },
              });

              cleanups.push(() => {
                tween.scrollTrigger?.kill();
                tween.kill();
              });
            })
          );
        } else {
          const loop = lottieEl.loop ?? true;
          let hasEntered = false;

          const observer = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                hasEntered = true;
                created.play();
              } else if (hasEntered && loop) {
                // Non-looping autoplay is left to finish once started.
                created.pause();
              }
            },
            { root: container, rootMargin: ENTER_ROOT_MARGIN, threshold: 0 }
          );
          observer.observe(node);
          cleanups.push(() => observer.disconnect());
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      cleanups.forEach(fn => fn());
      anim?.destroy();
    };
  }, [lottieEl, gsapInstance, container, sceneStartPx, sceneHeightPx, playMode]);

  return (
    <div className={`${sizeClass} relative`}>
      <div ref={containerRef} className="w-full h-full block" style={{ visibility: hasSrc && !failed ? 'visible' : 'hidden' }} />
      {(!hasSrc || failed) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-900/60 p-2 text-center text-xs text-slate-400">
          Lottie — set a JSON URL
        </div>
      )}
    </div>
  );
}

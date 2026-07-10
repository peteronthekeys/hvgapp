import React, { useRef } from 'react';
import { VideoElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';
import { useScrubTween } from './useScrubTween';

export function VideoElementView({
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
  if (element.type !== 'video') return null;

  const video = element as VideoElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  const mode = video.mode ?? 'background';

  // Background video with no explicit layout is the common hero case: fill
  // the whole scene layer instead of sitting inside PositionedElement's
  // centered-point wrapper (which is sized for point elements, not a
  // full-bleed background).
  if (mode === 'background' && !video.layout) {
    return <FullBleedBackgroundVideo element={video} ctx={ctx} />;
  }

  const sizeClass = video.layout?.width !== undefined ? 'w-full h-auto' : 'max-w-[40vw]';

  return (
    <PositionedElement element={element} ctx={ctx}>
      {mode === 'background' ? (
        <video
          src={video.src}
          poster={video.poster}
          autoPlay
          muted
          loop={video.loop ?? true}
          playsInline
          className={`${sizeClass} object-cover pointer-events-none rounded-lg block`}
        />
      ) : (
        <ClickToPlayPoster video={video} sizeClass={sizeClass} />
      )}
    </PositionedElement>
  );
}

function FullBleedBackgroundVideo({ element, ctx }: { element: VideoElement; ctx: DomRendererCtx }) {
  const innerRef = useRef<HTMLDivElement>(null);
  useScrubTween(innerRef, element, ctx);

  return (
    <div ref={innerRef} className="absolute inset-0 w-full h-full">
      <video
        src={element.src}
        poster={element.poster}
        autoPlay
        muted
        loop={element.loop ?? true}
        playsInline
        className="w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
}

// Click-to-play is visually obvious but inert for now — no click handler
// or interactive flag until Wave 2 wires playback.
function ClickToPlayPoster({ video, sizeClass }: { video: VideoElement; sizeClass: string }) {
  return (
    <div className={`${sizeClass} relative rounded-lg overflow-hidden bg-slate-900 pointer-events-none`}>
      {video.poster ? (
        <img src={video.poster} alt="" draggable={false} className="w-full h-auto block" />
      ) : (
        <video src={video.src} muted playsInline className="w-full h-auto block" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-0 h-0 border-y-[14px] border-y-transparent border-l-[22px] border-l-white/90 ml-1" />
      </div>
    </div>
  );
}

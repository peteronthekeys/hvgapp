import React, { useRef, useState } from 'react';
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
    <PositionedElement element={element} ctx={ctx} interactive={mode === 'clickToPlay'}>
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

// Real click-to-play toggle: the video renders directly (poster attribute
// covers the pre-play frame, no separate <img> poster layer), no autoplay,
// no native controls. `paused` tracks the video's actual play state via
// onPlay/onPause (not a click-driven guess) so the glyph stays correct even
// if playback ends or is controlled elsewhere.
function ClickToPlayPoster({ video, sizeClass }: { video: VideoElement; sizeClass: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);

  const handleClick = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  return (
    <div
      className={`${sizeClass} relative rounded-lg overflow-hidden bg-slate-900 cursor-pointer`}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={video.src}
        poster={video.poster}
        controls={false}
        loop={video.loop ?? true}
        playsInline
        className="w-full h-auto block"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      />
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-0 h-0 border-y-[14px] border-y-transparent border-l-[22px] border-l-white/90 ml-1" />
        </div>
      )}
    </div>
  );
}

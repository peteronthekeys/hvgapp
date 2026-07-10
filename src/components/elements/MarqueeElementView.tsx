import React, { useLayoutEffect, useRef, useState } from 'react';
import { MarqueeElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';

const DEFAULT_SPEED = 80;
const DEFAULT_GAP_REM = 3;
// Shown until the track's real width is measured (first paint), so the loop
// never renders with a nonsensical (e.g. zero) duration.
const FALLBACK_DURATION_SEC = 20;

let marqueeStylesInjected = false;

// Installs the @keyframes + reduced-motion rule once per page, idempotently
// (guarded by the module-level flag) — mirrors the "small useEffect installing
// a stylesheet" approach rather than a CSS module, since this is the only
// component that needs these rules.
function ensureMarqueeStyles(): void {
  if (marqueeStylesInjected || typeof document === 'undefined') return;
  marqueeStylesInjected = true;

  const style = document.createElement('style');
  style.setAttribute('data-marquee-styles', '');
  style.textContent = `
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.marquee-track {
  display: flex;
  align-items: center;
  width: max-content;
  animation-name: marquee-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation-play-state: paused;
  }
}
`;
  document.head.appendChild(style);
}

// The editor's generic 'list' field edits {value} object rows (see
// ElementEditor's ListFieldInput) — migrateSchema normalizes those back to
// plain strings on every schema write, but this stays defensive for the brief
// window between an in-progress edit and the next migrate-on-write pass.
function normalizeItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).value === 'string') {
        return (item as Record<string, unknown>).value as string;
      }
      return '';
    })
    .map(item => item.trim())
    .filter(Boolean);
}

export function MarqueeElementView({
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
  if (element.type !== 'marquee') return null;

  const marquee = element as MarqueeElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  // No layout means the strip should span the full scene width, unlike
  // PositionedElement's usual centered-point default (see ImageElementView).
  const effectiveElement: SceneElement = marquee.layout
    ? marquee
    : { ...marquee, layout: { x: 50, y: 50, anchor: 'center', width: 100 } };

  return (
    <PositionedElement element={effectiveElement} ctx={ctx} className="overflow-hidden w-full">
      <MarqueeTrack marquee={marquee} />
    </PositionedElement>
  );
}

function MarqueeTrack({ marquee }: { marquee: MarqueeElement }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [durationSec, setDurationSec] = useState(FALLBACK_DURATION_SEC);

  const items = normalizeItems(marquee.items);
  const gapRem = marquee.gapRem ?? DEFAULT_GAP_REM;
  const speed = marquee.speedPxPerSec ?? DEFAULT_SPEED;
  const direction = marquee.direction ?? 'left';

  useLayoutEffect(() => {
    ensureMarqueeStyles();
  }, []);

  // Duration = one copy's rendered width / speed, so the loop always moves at
  // a constant px/sec regardless of how much text is in `items`. Re-measures
  // on content/gap/speed change and on any layout-driven resize (font load,
  // container resize) via ResizeObserver.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const contentWidth = track.scrollWidth / 2;
      if (contentWidth > 0) {
        setDurationSec(contentWidth / speed);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [marquee.items, gapRem, speed]);

  const renderItems = (ariaHidden: boolean) =>
    items.map((item, index) => (
      <span key={`${ariaHidden ? 'dup' : 'src'}-${index}`} aria-hidden={ariaHidden || undefined}>
        {item}
        <span aria-hidden="true"> · </span>
      </span>
    ));

  return (
    <div
      ref={trackRef}
      className="marquee-track uppercase font-mono tracking-widest text-slate-100"
      style={{
        gap: `${gapRem}rem`,
        fontSize: '1.5rem',
        animationDuration: `${durationSec}s`,
        animationDirection: direction === 'right' ? 'reverse' : 'normal',
      }}
    >
      {/* Rendered twice: translateX(-50%) lands exactly at the second copy's
          start, so the loop repeats seamlessly. The duplicate is aria-hidden
          so screen readers only announce the content once. */}
      {renderItems(false)}
      {renderItems(true)}
    </div>
  );
}

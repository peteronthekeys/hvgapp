import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CarouselElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';

const DEFAULT_WIDTH = 60;

let carouselStylesInjected = false;

// Hides the native scrollbar on the horizontal scroller (dots are the visible
// position indicator instead) — same injected-stylesheet-once pattern as
// MarqueeElementView's ensureMarqueeStyles.
function ensureCarouselStyles(): void {
  if (carouselStylesInjected || typeof document === 'undefined') return;
  carouselStylesInjected = true;

  const style = document.createElement('style');
  style.setAttribute('data-carousel-styles', '');
  style.textContent = `
.carousel-scroller {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.carousel-scroller::-webkit-scrollbar {
  display: none;
}
`;
  document.head.appendChild(style);
}

export function CarouselElementView({
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
  if (element.type !== 'carousel') return null;

  const carousel = element as CarouselElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  // No layout means a sensible default point size, unlike Marquee's full-bleed
  // default (a carousel is a point element, not a strip).
  const effectiveElement: SceneElement = carousel.layout
    ? carousel
    : { ...carousel, layout: { x: 50, y: 50, anchor: 'center', width: DEFAULT_WIDTH } };

  return (
    <PositionedElement element={effectiveElement} ctx={ctx} interactive>
      <CarouselTrack carousel={carousel} />
    </PositionedElement>
  );
}

function CarouselTrack({ carousel }: { carousel: CarouselElement }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = carousel.slides ?? [];
  const showDots = carousel.showDots ?? true;
  const showArrows = carousel.showArrows ?? true;
  const autoplayMs = carousel.autoplayMs ?? 0;

  useEffect(() => {
    ensureCarouselStyles();
  }, []);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const scroller = scrollerRef.current;
      if (!scroller || slides.length === 0) return;
      const clamped = Math.max(0, Math.min(slides.length - 1, index));
      scroller.scrollTo({ left: clamped * scroller.clientWidth, behavior: 'smooth' });
    },
    [slides.length]
  );

  // Active dot tracks scroll position, rAF-throttled so fast scroll events
  // don't thrash setState.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const width = scroller.clientWidth || 1;
        const index = Math.round(scroller.scrollLeft / width);
        setActiveIndex(Math.max(0, Math.min(slides.length - 1, index)));
      });
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [slides.length]);

  // Autoplay advances on an interval, wrapping to 0 at the end, and pauses
  // while the pointer hovers the scroller. Reads activeIndexRef rather than
  // activeIndex so the interval isn't torn down/recreated on every advance.
  useEffect(() => {
    if (!autoplayMs || slides.length <= 1) return;
    const scroller = scrollerRef.current;
    let paused = false;

    const interval = setInterval(() => {
      if (paused) return;
      const nextIndex = (activeIndexRef.current + 1) % slides.length;
      scrollToIndex(nextIndex);
    }, autoplayMs);

    const handleEnter = () => {
      paused = true;
    };
    const handleLeave = () => {
      paused = false;
    };
    scroller?.addEventListener('pointerenter', handleEnter);
    scroller?.addEventListener('pointerleave', handleLeave);

    return () => {
      clearInterval(interval);
      scroller?.removeEventListener('pointerenter', handleEnter);
      scroller?.removeEventListener('pointerleave', handleLeave);
    };
  }, [autoplayMs, slides.length, scrollToIndex]);

  return (
    <div className="relative w-full">
      {/* data-lenis-prevent: this is a nested horizontal scroller inside the
          Lenis-hijacked vertical scroll container — without this attribute
          Lenis intercepts wheel/touch input meant for the carousel. */}
      <div
        ref={scrollerRef}
        data-lenis-prevent
        className="carousel-scroller flex w-full overflow-x-auto snap-x snap-mandatory rounded-lg"
      >
        {slides.map(slide => (
          <div key={slide.id} className="relative w-full shrink-0 snap-center">
            <img
              src={slide.src}
              alt={slide.caption ?? ''}
              draggable={false}
              loading="lazy"
              className="block h-auto w-full rounded-lg object-cover"
            />
            {slide.caption && (
              <div className="absolute bottom-3 left-3 rounded bg-black/50 px-2 py-1 text-sm text-white">
                {slide.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => scrollToIndex(activeIndexRef.current - 1)}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => scrollToIndex(activeIndexRef.current + 1)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            ›
          </button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === activeIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

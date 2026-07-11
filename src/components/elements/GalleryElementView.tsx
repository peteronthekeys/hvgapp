import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GalleryElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';

const DEFAULT_WIDTH = 80;
const DEFAULT_COLUMNS = 3;

export function GalleryElementView({
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
  if (element.type !== 'gallery') return null;

  const gallery = element as GalleryElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  const effectiveElement: SceneElement = gallery.layout
    ? gallery
    : { ...gallery, layout: { x: 50, y: 50, anchor: 'center', width: DEFAULT_WIDTH } };

  return (
    <PositionedElement element={effectiveElement} ctx={ctx} className="w-full" interactive>
      <GalleryGrid gallery={gallery} />
    </PositionedElement>
  );
}

function GalleryGrid({ gallery }: { gallery: GalleryElement }) {
  const images = gallery.images ?? [];
  const columns = Math.min(gallery.columns ?? DEFAULT_COLUMNS, Math.max(images.length, 1));
  const lightboxEnabled = gallery.lightbox ?? true;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(() => {
    setOpenIndex(current => (current === null ? current : (current - 1 + images.length) % images.length));
  }, [images.length]);
  const showNext = useCallback(() => {
    setOpenIndex(current => (current === null ? current : (current + 1) % images.length));
  }, [images.length]);

  return (
    <div
      className="grid w-full gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {images.map((image, index) => (
        <img
          key={image.id}
          src={image.src}
          alt={image.alt ?? ''}
          loading="lazy"
          onClick={lightboxEnabled ? () => setOpenIndex(index) : undefined}
          className={`aspect-square w-full rounded-lg object-cover ${lightboxEnabled ? 'cursor-zoom-in' : ''}`}
        />
      ))}
      {lightboxEnabled && openIndex !== null && images[openIndex] && (
        <GalleryLightbox
          image={images[openIndex]}
          onClose={closeLightbox}
          onPrev={images.length > 1 ? showPrev : undefined}
          onNext={images.length > 1 ? showNext : undefined}
        />
      )}
    </div>
  );
}

function GalleryLightbox({
  image,
  onClose,
  onPrev,
  onNext,
}: {
  image: { src: string; alt?: string };
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrev?.();
      if (event.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  // z-[60]: PlaybackOverlay (PlaybackOverlay.tsx) uses z-50 for the fullscreen
  // clean-playback surface; the lightbox must sit above it when the studio
  // preview is embedded there, so it uses z-60 instead of the scene's usual
  // z-index scale.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 pointer-events-auto"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-xl text-white transition-colors hover:bg-black/70"
      >
        ×
      </button>

      {onPrev && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={event => {
            event.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white transition-colors hover:bg-black/70"
        >
          ‹
        </button>
      )}

      <figure className="flex max-w-[90vw] flex-col items-center" onClick={event => event.stopPropagation()}>
        <img src={image.src} alt={image.alt ?? ''} className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" />
        {image.alt && <figcaption className="mt-3 text-sm text-slate-300">{image.alt}</figcaption>}
      </figure>

      {onNext && (
        <button
          type="button"
          aria-label="Next image"
          onClick={event => {
            event.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white transition-colors hover:bg-black/70"
        >
          ›
        </button>
      )}
    </div>,
    document.body
  );
}

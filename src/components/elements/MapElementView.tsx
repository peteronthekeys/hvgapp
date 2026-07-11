import React from 'react';
import { MapElement, ProjectIntegrations, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';

const DEFAULT_WIDTH = 60;
const DEFAULT_LAT = 40.7128;
const DEFAULT_LNG = -74.006;
const DEFAULT_ZOOM = 12;
const MIN_ZOOM = 1;
const MAX_ZOOM = 20;

function clampZoom(zoom: unknown): number {
  const value = typeof zoom === 'number' && Number.isFinite(zoom) ? zoom : DEFAULT_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value)));
}

function coerceCoordinate(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

// Deliberate deviation from "JS API when key present" — the Maps Embed API
// gives keyed support with zero script-loading; the JS API adds nothing this
// element exposes yet. All interpolated values are encoded/clamped — no raw
// user strings reach the URL.
function buildMapSrc(map: MapElement, apiKey?: string): string {
  const lat = coerceCoordinate(map.lat, DEFAULT_LAT);
  const lng = coerceCoordinate(map.lng, DEFAULT_LNG);
  const zoom = clampZoom(map.zoom);

  if (apiKey) {
    const query = encodeURIComponent(map.markerLabel || `${lat},${lng}`);
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${query}&center=${lat},${lng}&zoom=${zoom}`;
  }

  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export function MapElementView({
  element,
  gsapInstance,
  scrollTrigger,
  container,
  sceneStartPx,
  sceneHeightPx,
  integrations,
}: {
  element: SceneElement;
  gsapInstance: typeof gsapType;
  scrollTrigger: typeof ScrollTriggerType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
  integrations?: ProjectIntegrations;
}) {
  if (element.type !== 'map') return null;

  const map = element as MapElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  // No layout means a sensible default point size, mirroring the
  // carousel/gallery default-layout pattern (a map is a point element).
  const effectiveElement: SceneElement = map.layout
    ? map
    : { ...map, layout: { x: 50, y: 50, anchor: 'center', width: DEFAULT_WIDTH } };

  const src = buildMapSrc(map, integrations?.googleMapsApiKey);

  return (
    <PositionedElement element={effectiveElement} ctx={ctx} interactive>
      {/* data-lenis-prevent: the embedded map captures wheel/touch gestures
          for pan/zoom — without this Lenis hijacks them, same law as the
          carousel's horizontal scroller. */}
      <div data-lenis-prevent className="w-full overflow-hidden rounded-xl border border-slate-800">
        <iframe
          src={src}
          title={map.markerLabel || 'Map'}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-80 w-full border-0"
        />
      </div>
    </PositionedElement>
  );
}

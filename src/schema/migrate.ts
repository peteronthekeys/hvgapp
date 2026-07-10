/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectSchema, Scene, SceneElement, CarouselSlide, SCHEMA_VERSION } from '../types';

const DEFAULT_SCENE_HEIGHT = 100;
const MIN_SCENE_HEIGHT = 10;
const MAX_SCENE_HEIGHT = 2000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function coerceNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function migrateLayout(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, unknown>;
  const layout: Record<string, unknown> = { ...source };

  if (typeof source.x === 'number') layout.x = clamp(source.x, 0, 100);
  if (typeof source.y === 'number') layout.y = clamp(source.y, 0, 100);
  if (typeof source.width === 'number') layout.width = clamp(source.width, 1, 100);

  return layout;
}

// The editor's generic 'list' field (ElementEditor's ListFieldInput) edits
// array-of-object rows keyed by itemFields — for marquee's `items` field that
// means rows shaped like { value: string }. This normalizes those rows (and
// already-canonical strings) back to the string[] shape MarqueeElement.items
// declares, dropping blanks and falling back to a default when empty.
function migrateMarqueeItems(raw: unknown): string[] {
  const items = Array.isArray(raw)
    ? raw
        .map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).value === 'string') {
            return (item as Record<string, unknown>).value as string;
          }
          return '';
        })
        .map(item => item.trim())
        .filter(Boolean)
    : [];

  return items.length > 0 ? items : ['MARQUEE'];
}

// Normalizes carousel slides: drops non-object rows, ensures every slide has
// an id (randomUUID when missing), coerces src to a string, and keeps caption
// only when it's already a string. An empty array is a valid result — unlike
// marquee's items there's no single-slide fallback.
function migrateCarouselSlides(raw: unknown): CarouselSlide[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map(source => {
      const slide: CarouselSlide = {
        id: typeof source.id === 'string' && source.id ? source.id : crypto.randomUUID(),
        src: typeof source.src === 'string' ? source.src : '',
      };
      if (typeof source.caption === 'string') {
        slide.caption = source.caption;
      }
      return slide;
    });
}

function migrateElement(raw: unknown): SceneElement {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const start = clamp(coerceNumber(source.start, 0), 0, 1);
  const end = clamp(coerceNumber(source.end, 1), 0, 1);
  const layout = migrateLayout(source.layout);

  const migrated: Record<string, unknown> = {
    ...source,
    id: typeof source.id === 'string' && source.id ? source.id : crypto.randomUUID(),
    start,
    end,
    startY: coerceNumber(source.startY, 0),
    endY: coerceNumber(source.endY, 0),
    startOpacity: coerceNumber(source.startOpacity, 1),
    endOpacity: coerceNumber(source.endOpacity, 1),
  };

  if (layout !== undefined) {
    migrated.layout = layout;
  }

  if (source.type === 'image' || source.type === 'video') {
    migrated.src = typeof source.src === 'string' ? source.src : '';
  }
  if (source.type === 'image') {
    migrated.objectFit = source.objectFit === 'contain' ? 'contain' : 'cover';
  }
  if (source.type === 'video') {
    migrated.mode = source.mode === 'clickToPlay' ? 'clickToPlay' : 'background';
  }
  if (source.type === 'marquee') {
    migrated.items = migrateMarqueeItems(source.items);
    if (typeof source.speedPxPerSec === 'number') {
      migrated.speedPxPerSec = clamp(source.speedPxPerSec, 10, 400);
    }
  }
  if (source.type === 'carousel') {
    migrated.slides = migrateCarouselSlides(source.slides);
    if (typeof source.autoplayMs === 'number') {
      migrated.autoplayMs = clamp(source.autoplayMs, 0, 30000);
    }
  }
  if (source.type === 'text') {
    if (typeof source.staggerEach === 'number') {
      migrated.staggerEach = clamp(source.staggerEach, 0.005, 0.5);
    }
    if (typeof source.fontSize === 'number') {
      migrated.fontSize = clamp(source.fontSize, 0.25, 16);
    }
  }

  // trigger/pin pass through untouched via the `...source` spread above;
  // appear's duration/delay get the same clamp-if-present treatment as the
  // other optional numerics.
  if (source.appear && typeof source.appear === 'object') {
    const appearSource = source.appear as Record<string, unknown>;
    const appear: Record<string, unknown> = { ...appearSource };
    if (typeof appearSource.duration === 'number') {
      appear.duration = clamp(appearSource.duration, 0.1, 5);
    }
    if (typeof appearSource.delay === 'number') {
      appear.delay = clamp(appearSource.delay, 0, 5);
    }
    migrated.appear = appear;
  }

  return migrated as unknown as SceneElement;
}

function migrateScene(raw: unknown): Scene {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const height = clamp(coerceNumber(source.height, DEFAULT_SCENE_HEIGHT), MIN_SCENE_HEIGHT, MAX_SCENE_HEIGHT);
  const elements = Array.isArray(source.elements) ? source.elements.map(migrateElement) : [];

  return {
    ...source,
    id: typeof source.id === 'string' && source.id ? source.id : crypto.randomUUID(),
    height,
    elements,
  } as Scene;
}

export function migrateSchema(raw: unknown): ProjectSchema {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as Record<string, unknown>).scenes)) {
    return { version: SCHEMA_VERSION, scenes: [] };
  }

  const source = raw as Record<string, unknown>;
  const scenes = (source.scenes as unknown[]).map(migrateScene);

  return {
    ...source,
    version: SCHEMA_VERSION,
    scenes,
  } as ProjectSchema;
}

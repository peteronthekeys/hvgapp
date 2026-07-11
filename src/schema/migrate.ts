/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectSchema, Scene, SceneElement, CarouselSlide, GridCard, GalleryImage, FormField, SiteConfig, SiteLink, ProjectIntegrations, SCHEMA_VERSION } from '../types';

const DEFAULT_SCENE_HEIGHT = 100;
const MIN_SCENE_HEIGHT = 10;
const MAX_SCENE_HEIGHT = 2000;
const MIN_LOADING_GATE_MS = 0;
const MAX_LOADING_GATE_MS = 10000;
const MIN_MAP_ZOOM = 1;
const MAX_MAP_ZOOM = 20;
const DEFAULT_MAP_LAT = 40.7128;
const DEFAULT_MAP_LNG = -74.006;
const DEFAULT_MAP_ZOOM = 12;
const FORM_FIELD_KINDS = new Set(['text', 'email', 'textarea']);

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

// Same {value} row -> plain string normalization as migrateMarqueeItems, but
// for SvgElement.paths — defaults to a flat horizontal line rather than
// marquee's text fallback when empty.
function migrateSvgPaths(raw: unknown): string[] {
  const paths = Array.isArray(raw)
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

  return paths.length > 0 ? paths : ['M10 50 L90 50'];
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

// Normalizes grid cards: drops non-object rows, ensures every card has an id
// (randomUUID when missing) and a title, coerces body/imageSrc to strings
// only when already strings. Mirrors migrateCarouselSlides' shape-coercion
// approach.
function migrateGridCards(raw: unknown): GridCard[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map(source => {
      const card: GridCard = {
        id: typeof source.id === 'string' && source.id ? source.id : crypto.randomUUID(),
        title: typeof source.title === 'string' ? source.title : '',
      };
      if (typeof source.body === 'string') {
        card.body = source.body;
      }
      if (typeof source.imageSrc === 'string') {
        card.imageSrc = source.imageSrc;
      }
      return card;
    });
}

// Normalizes gallery images: drops non-object rows, ensures every image has
// an id (randomUUID when missing), coerces src to a string, and keeps alt
// only when it's already a string. Mirrors migrateCarouselSlides.
function migrateGalleryImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map(source => {
      const image: GalleryImage = {
        id: typeof source.id === 'string' && source.id ? source.id : crypto.randomUUID(),
        src: typeof source.src === 'string' ? source.src : '',
      };
      if (typeof source.alt === 'string') {
        image.alt = source.alt;
      }
      return image;
    });
}

// Normalizes form fields: drops non-object rows, ensures every field has an
// id (randomUUID when missing) and a label, coerces kind to the enum
// (defaulting to 'text'), keeps required only when already boolean, and
// drops rows with an empty label. Falls back to a name/email/message default
// set when nothing survives — mirrors migrateMarqueeItems' non-empty
// fallback (and server/gemini.ts's sanitizeSchema for the AI path).
function migrateFormFields(raw: unknown): FormField[] {
  const fields = Array.isArray(raw)
    ? raw
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map(source => {
          const field: FormField = {
            id: typeof source.id === 'string' && source.id ? source.id : crypto.randomUUID(),
            label: typeof source.label === 'string' ? source.label : '',
            kind: FORM_FIELD_KINDS.has(source.kind as string) ? (source.kind as FormField['kind']) : 'text',
          };
          if (typeof source.required === 'boolean') {
            field.required = source.required;
          }
          return field;
        })
        .filter(field => field.label.trim().length > 0)
    : [];

  if (fields.length > 0) return fields;

  return [
    { id: crypto.randomUUID(), label: 'Name', kind: 'text', required: true },
    { id: crypto.randomUUID(), label: 'Email', kind: 'email', required: true },
    { id: crypto.randomUUID(), label: 'Message', kind: 'textarea' },
  ];
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

  if (source.type === 'image' || source.type === 'video' || source.type === 'lottie') {
    migrated.src = typeof source.src === 'string' ? source.src : '';
  }
  if (source.type === 'image') {
    migrated.objectFit = source.objectFit === 'contain' ? 'contain' : 'cover';
  }
  if (source.type === 'video') {
    migrated.mode = source.mode === 'clickToPlay' ? 'clickToPlay' : 'background';
  }
  if (source.type === 'lottie') {
    migrated.playMode = source.playMode === 'autoplay' ? 'autoplay' : 'scrub';
    migrated.loop = typeof source.loop === 'boolean' ? source.loop : true;
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
  if (source.type === 'counter') {
    migrated.from = coerceNumber(source.from, 0);
    migrated.to = coerceNumber(source.to, 100);
    if (typeof source.decimals === 'number') {
      migrated.decimals = clamp(Math.round(source.decimals), 0, 4);
    }
  }
  if (source.type === 'svg') {
    migrated.paths = migrateSvgPaths(source.paths);
  }
  if (source.type === 'grid') {
    migrated.cards = migrateGridCards(source.cards);
    if (typeof source.columns === 'number') {
      migrated.columns = clamp(Math.round(source.columns), 1, 6);
    }
  }
  if (source.type === 'gallery') {
    migrated.images = migrateGalleryImages(source.images);
    if (typeof source.columns === 'number') {
      migrated.columns = clamp(Math.round(source.columns), 1, 6);
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
  if (source.type === 'form') {
    migrated.fields = migrateFormFields(source.fields);
  }
  if (source.type === 'map') {
    migrated.lat = clamp(coerceNumber(source.lat, DEFAULT_MAP_LAT), -90, 90);
    migrated.lng = clamp(coerceNumber(source.lng, DEFAULT_MAP_LNG), -180, 180);
    migrated.zoom = clamp(Math.round(coerceNumber(source.zoom, DEFAULT_MAP_ZOOM)), MIN_MAP_ZOOM, MAX_MAP_ZOOM);
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

// Site links render as raw <a href> in SiteChrome AND ship into exported
// standalone HTML, so an unvalidated scheme (javascript:, data:) is XSS on
// the published site. Allowlist: fragments (#scene-N et al) and
// http/https/mailto/tel absolute URLs; everything else (including relative
// paths, meaningless in a single-file export) is blanked like a non-string.
function safeSiteHref(href: string): string {
  if (href.startsWith('#')) return href;
  try {
    const protocol = new URL(href).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'tel:' ? href : '';
  } catch {
    return '';
  }
}

// Non-array `links` (or an array with no valid rows) becomes undefined
// rather than an empty array, so a malformed AI/editor write drops the field
// instead of leaving a link bar with nothing in it.
function migrateSiteLinks(raw: unknown): SiteLink[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const links = raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map(source => ({
      label: typeof source.label === 'string' ? source.label : '',
      href: typeof source.href === 'string' ? safeSiteHref(source.href) : '',
    }))
    .filter(link => link.label || link.href);
  return links.length > 0 ? links : undefined;
}

// No defaults injected here (unlike scene/element migration) — `site` only
// passes through fields that are already present, clamping the obviously
// broken ones. An absent/malformed `site` returns undefined so migrateSchema
// drops the key entirely, preserving the pre-Wave-5.1 no-site behavior.
function migrateSite(raw: unknown): SiteConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, unknown>;
  const site: Record<string, unknown> = {};

  if (source.theme && typeof source.theme === 'object') {
    site.theme = { ...(source.theme as Record<string, unknown>) };
  }

  if (source.nav && typeof source.nav === 'object') {
    const navSource = source.nav as Record<string, unknown>;
    const nav: Record<string, unknown> = { ...navSource };
    const links = migrateSiteLinks(navSource.links);
    if (links !== undefined) {
      nav.links = links;
    } else {
      delete nav.links;
    }
    site.nav = nav;
  }

  if (source.footer && typeof source.footer === 'object') {
    const footerSource = source.footer as Record<string, unknown>;
    const footer: Record<string, unknown> = { ...footerSource };
    const links = migrateSiteLinks(footerSource.links);
    if (links !== undefined) {
      footer.links = links;
    } else {
      delete footer.links;
    }
    site.footer = footer;
  }

  if (source.cursor && typeof source.cursor === 'object') {
    const cursorSource = source.cursor as Record<string, unknown>;
    const style =
      cursorSource.style === 'dot' || cursorSource.style === 'glow' || cursorSource.style === 'default'
        ? cursorSource.style
        : 'default';
    site.cursor = { ...cursorSource, style };
  }

  if (source.loadingGate && typeof source.loadingGate === 'object') {
    const gateSource = source.loadingGate as Record<string, unknown>;
    const loadingGate: Record<string, unknown> = {
      ...gateSource,
      enabled: typeof gateSource.enabled === 'boolean' ? gateSource.enabled : false,
    };
    if (typeof gateSource.minMs === 'number') {
      loadingGate.minMs = clamp(gateSource.minMs, MIN_LOADING_GATE_MS, MAX_LOADING_GATE_MS);
    }
    site.loadingGate = loadingGate;
  }

  return Object.keys(site).length > 0 ? (site as SiteConfig) : undefined;
}

// User-owned integrations pass through untouched by the AI (see
// server/gemini.ts) — this only guards against a malformed/legacy schema on
// load: keeps string-typed, trimmed, non-empty values, drops the object
// entirely when nothing survives.
const INTEGRATION_KEYS: (keyof ProjectIntegrations)[] = ['formEndpoint', 'recaptchaSiteKey', 'googleMapsApiKey'];

function migrateIntegrations(raw: unknown): ProjectIntegrations | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, unknown>;
  const integrations: ProjectIntegrations = {};

  for (const key of INTEGRATION_KEYS) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      integrations[key] = value.trim();
    }
  }

  return Object.keys(integrations).length > 0 ? integrations : undefined;
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
  const site = migrateSite(source.site);
  const integrations = migrateIntegrations(source.integrations);

  const migrated = {
    ...source,
    version: SCHEMA_VERSION,
    scenes,
  } as ProjectSchema;

  if (site !== undefined) {
    migrated.site = site;
  } else {
    delete migrated.site;
  }

  if (integrations !== undefined) {
    migrated.integrations = integrations;
  } else {
    delete migrated.integrations;
  }

  return migrated;
}

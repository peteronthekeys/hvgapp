/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectSchema, Scene, SceneElement, SCHEMA_VERSION } from '../types';

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
  if (source.type === 'text') {
    if (typeof source.staggerEach === 'number') {
      migrated.staggerEach = clamp(source.staggerEach, 0.005, 0.5);
    }
    if (typeof source.fontSize === 'number') {
      migrated.fontSize = clamp(source.fontSize, 0.25, 16);
    }
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

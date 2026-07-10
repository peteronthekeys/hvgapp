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

function migrateElement(raw: unknown): SceneElement {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const start = clamp(coerceNumber(source.start, 0), 0, 1);
  const end = clamp(coerceNumber(source.end, 1), 0, 1);

  return {
    ...source,
    id: typeof source.id === 'string' && source.id ? source.id : crypto.randomUUID(),
    start,
    end,
    startY: coerceNumber(source.startY, 0),
    endY: coerceNumber(source.endY, 0),
    startOpacity: coerceNumber(source.startOpacity, 1),
    endOpacity: coerceNumber(source.endOpacity, 1),
  } as SceneElement;
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

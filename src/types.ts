export const DEFAULT_GLB_OBJECT_MODEL_PATH = '/models/scroll-orb.glb';

// Bump when ProjectSchema's shape changes; migrateSchema (src/schema/migrate.ts)
// upgrades older/malformed schemas to this version on load.
export const SCHEMA_VERSION = 2;

// 'text', 'cube', and 'glbObject' are the only types with a real renderer (see PreviewPanel.tsx)
// and the only types the AI can emit (see server.ts updateSchema). The rest are
// editor-only placeholders: creatable/draggable in EditorPanel.tsx but invisible
// in the preview. Adding a new type to this union does not make it render or
// make the AI aware of it — follow .claude/skills/new-element-type/SKILL.md.
export type ElementType = 'text' | 'cube' | 'glbObject' | 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';

export interface BaseElement {
  id: string;
  type: ElementType;
  start: number;
  end: number;
  startY: number;
  endY: number;
  startOpacity: number;
  endOpacity: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
}

export interface CubeElement extends BaseElement {
  type: 'cube';
}

export interface GlbObjectElement extends BaseElement {
  type: 'glbObject';
  modelPath: string;
}

export interface GenericElement extends BaseElement {
  type: 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';
}

export type SceneElement = TextElement | CubeElement | GlbObjectElement | GenericElement;

export interface Scene {
  id: string;
  height: number; // representing vh
  elements: SceneElement[];
  transition?: boolean;
}

export interface ProjectSchema {
  version?: number;
  scenes: Scene[];
}

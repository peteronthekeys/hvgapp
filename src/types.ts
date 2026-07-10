export const DEFAULT_GLB_OBJECT_MODEL_PATH = '/models/scroll-orb.glb';

// Bump when ProjectSchema's shape changes; migrateSchema (src/schema/migrate.ts)
// upgrades older/malformed schemas to this version on load.
export const SCHEMA_VERSION = 2;

// 'text', 'cube', 'glbObject', 'image', and 'video' are the only types with a
// real renderer (see PreviewPanel.tsx) and the only types the AI can emit
// (see server/gemini.ts updateSchema). The rest are editor-only placeholders:
// creatable/draggable in EditorPanel.tsx but invisible in the preview. Adding
// a new type to this union does not make it render or make the AI aware of
// it — follow .claude/skills/new-element-type/SKILL.md.
export type ElementType = 'text' | 'cube' | 'glbObject' | 'image' | 'video' | 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';

// Positioning for DOM element renderers, layered on top of the scroll-scrub
// animation. All fields are optional; absence means centered default at
// render time (x/y 50, width auto, anchor 'center', z 0) — see
// PositionedElement.tsx.
export interface ElementLayout {
  x?: number; // % of viewport width, default 50
  y?: number; // % of viewport height, default 50
  width?: number; // % of viewport width; undefined = auto
  anchor?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // default 'center'
  z?: number; // stacking within scene DOM layer, default 0
}

export interface BaseElement {
  id: string;
  type: ElementType;
  start: number;
  end: number;
  startY: number;
  endY: number;
  startOpacity: number;
  endOpacity: number;
  layout?: ElementLayout;
}

// splitMode/staggerEach drive a per-char/word/line staggered reveal (GSAP
// SplitText) nested inside the outer scrub tween — see TextElementView.tsx.
// tag/fontSize are optional presentational overrides; omitting all four
// keeps rendering identical to the pre-Wave-1.3 plain-text behavior.
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  splitMode?: 'none' | 'chars' | 'words' | 'lines'; // default 'none'
  staggerEach?: number; // seconds per unit within the scrub window, default 0.03
  tag?: 'h1' | 'h2' | 'p'; // semantic tag, default div-like current
  fontSize?: number; // rem; default matches current text-5xl (3rem)
}

export interface CubeElement extends BaseElement {
  type: 'cube';
}

export interface GlbObjectElement extends BaseElement {
  type: 'glbObject';
  modelPath: string;
}

// Image/video parallax reuses the existing startY/endY scrub (see BaseElement)
// — there is no separate parallax field. `layout` (inherited from
// BaseElement) controls position/size; omitting it keeps an image centered,
// and for video in 'background' mode with no layout, the renderer goes
// full-bleed across the scene instead of a centered point (see
// VideoElementView.tsx).
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  srcset?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain';
}

export interface VideoElement extends BaseElement {
  type: 'video';
  src: string;
  poster?: string;
  mode?: 'background' | 'clickToPlay';
  loop?: boolean;
}

export interface GenericElement extends BaseElement {
  type: 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';
}

export type SceneElement = TextElement | CubeElement | GlbObjectElement | ImageElement | VideoElement | GenericElement;

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

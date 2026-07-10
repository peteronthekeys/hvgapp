export const DEFAULT_GLB_OBJECT_MODEL_PATH = '/models/scroll-orb.glb';

// Bump when ProjectSchema's shape changes; migrateSchema (src/schema/migrate.ts)
// upgrades older/malformed schemas to this version on load.
export const SCHEMA_VERSION = 2;

// 'text', 'cube', 'glbObject', 'image', 'video', 'marquee', and 'carousel'
// (7) are the only types with a real renderer (see PreviewPanel.tsx) and the
// only types the AI can emit (see server/gemini.ts updateSchema). The rest
// are editor-only placeholders: creatable/draggable in EditorPanel.tsx but
// invisible in the preview. Adding a new type to this union does not make it
// render or make the AI aware of it — follow .claude/skills/new-element-type/SKILL.md.
export type ElementType = 'text' | 'cube' | 'glbObject' | 'image' | 'video' | 'marquee' | 'carousel' | 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';

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

// Reveal preset for trigger 'appear' — see elements/useAppear.ts for the
// from-state each preset animates out of.
export interface AppearConfig {
  preset: 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'spring';
  duration?: number; // seconds, default 0.8
  delay?: number; // seconds, default 0
  once?: boolean; // default true = play once; false = replay on re-enter/leave
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
  // 'scrub' (default): existing start/end scroll-scrub tween. 'appear': a
  // one-shot reveal tween driven by `appear` when the element's wrapper
  // enters the viewport — see elements/useAppear.ts. One or the other, never
  // both (PositionedElement picks based on this field).
  trigger?: 'scrub' | 'appear';
  appear?: AppearConfig;
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

// Infinite horizontal loop strip (client-logo bands, tickers) — see
// MarqueeElementView.tsx. items is the canonical string[] shape; the editor's
// generic 'list' field works on object rows, so migrateSchema normalizes any
// {value} rows it produces back to plain strings on every schema write.
export interface MarqueeElement extends BaseElement {
  type: 'marquee';
  items: string[];
  speedPxPerSec?: number; // px/sec, default 80
  direction?: 'left' | 'right'; // default 'left'
  gapRem?: number; // rem between items, default 3
}

// A single slide in a CarouselElement — see CarouselElementView.tsx.
export interface CarouselSlide {
  id: string;
  src: string;
  caption?: string;
}

// Swipeable/scrollable image carousel — see CarouselElementView.tsx. Registered
// as `interactive: true` (registry.tsx) so its scroller/arrows/dots receive
// pointer events despite the scene layer being pointer-events-none.
export interface CarouselElement extends BaseElement {
  type: 'carousel';
  slides: CarouselSlide[];
  autoplayMs?: number; // ms between auto-advances; 0/undefined = off
  showDots?: boolean; // default true
  showArrows?: boolean; // default true
}

export interface GenericElement extends BaseElement {
  type: 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';
}

export type SceneElement = TextElement | CubeElement | GlbObjectElement | ImageElement | VideoElement | MarqueeElement | CarouselElement | GenericElement;

export interface Scene {
  id: string;
  height: number; // representing vh
  elements: SceneElement[];
  transition?: boolean;
  // default true = pinned sticky set-piece (current behavior). false = a
  // normal document-flow section — its elements scroll past instead of
  // holding on screen. See PreviewPanel.tsx's per-scene render branch.
  pin?: boolean;
}

export interface ProjectSchema {
  version?: number;
  scenes: Scene[];
}

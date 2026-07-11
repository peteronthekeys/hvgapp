export const DEFAULT_GLB_OBJECT_MODEL_PATH = '/models/scroll-orb.glb';

// Bump when ProjectSchema's shape changes; migrateSchema (src/schema/migrate.ts)
// upgrades older/malformed schemas to this version on load.
export const SCHEMA_VERSION = 2;

// 'text', 'cube', 'glbObject', 'image', 'video', 'marquee', 'carousel',
// 'counter', 'svg', 'grid', 'gallery', 'lottie', 'form', and 'map' (14) are
// the only types with a real renderer (see PreviewPanel.tsx) and the only
// types the AI can emit (see server/gemini.ts updateSchema). The rest are
// editor-only placeholders: creatable/draggable in EditorPanel.tsx but
// invisible in the preview. Adding a new type to this union does not make it
// render or make the AI aware of it — follow
// .claude/skills/new-element-type/SKILL.md.
export type ElementType = 'text' | 'cube' | 'glbObject' | 'image' | 'video' | 'marquee' | 'carousel' | 'counter' | 'svg' | 'grid' | 'gallery' | 'lottie' | 'form' | 'map' | 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';

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

// Animated number that counts from `from` to `to` as the user scrolls
// through the element's start/end window (scrub) or once on viewport entry
// (trigger 'appear') — see CounterElementView.tsx.
export interface CounterElement extends BaseElement {
  type: 'counter';
  from: number;
  to: number;
  decimals?: number; // default 0
  prefix?: string;
  suffix?: string;
}

// Line-art that draws itself (stroke-dashoffset animated to 0) over the
// element's scrub window — see SvgElementView.tsx. paths is the canonical
// string[] of SVG path `d` attributes; the editor's generic 'list' field
// works on object rows, so migrateSchema normalizes any {value} rows it
// produces back to plain strings on every schema write (mirrors
// MarqueeElement.items).
export interface SvgElement extends BaseElement {
  type: 'svg';
  paths: string[];
  viewBox?: string; // default '0 0 100 100'
  strokeColor?: string; // default '#2dd4bf'
  strokeWidth?: number; // default 2
}

// A single card in a GridElement — see GridElementView.tsx.
export interface GridCard {
  id: string;
  title: string;
  body?: string;
  imageSrc?: string;
}

// Responsive CSS-grid of feature/service/team cards — see GridElementView.tsx.
// Non-interactive (pure display); the whole grid rides the normal
// scrub/appear wrapper like any other DOM element.
export interface GridElement extends BaseElement {
  type: 'grid';
  columns?: number; // 1-6, default 3
  cards: GridCard[];
}

// A single image in a GalleryElement — see GalleryElementView.tsx.
export interface GalleryImage {
  id: string;
  src: string;
  alt?: string;
}

// Image grid with a click-to-zoom lightbox — see GalleryElementView.tsx.
// Registered as `interactive: true` (registry.tsx) so the images and lightbox
// controls receive pointer events despite the scene layer being
// pointer-events-none.
export interface GalleryElement extends BaseElement {
  type: 'gallery';
  columns?: number; // 1-6, default 3
  images: GalleryImage[];
  lightbox?: boolean; // default true
}

// Lottie/After Effects JSON animation (bodymovin export) — see
// LottieElementView.tsx and elements/lottieLoader.ts for the runtime.
// 'scrub' (default) ties the animation's frame to the element's start/end
// scroll window, mirroring CounterElementView/SvgElementView's scrub
// pattern. 'autoplay' plays once (or loops per `loop`) when the element
// enters the viewport, detected via IntersectionObserver like useAppear.
export interface LottieElement extends BaseElement {
  type: 'lottie';
  src: string; // URL to a .json Lottie animation
  playMode: 'scrub' | 'autoplay';
  loop?: boolean; // autoplay mode only; default true
}

// A single input in a FormElement — see FormElementView.tsx.
export interface FormField {
  id: string;
  label: string;
  kind: 'text' | 'email' | 'textarea';
  required?: boolean;
}

// Contact/signup form — see FormElementView.tsx. Registered as
// `interactive: true` (registry.tsx) so its inputs/button receive pointer
// events despite the scene layer being pointer-events-none. Submissions post
// to ctx.integrations?.formEndpoint (see the DomRendererCtx plumbing note in
// registry.tsx); with no endpoint configured the renderer shows an inline
// notice instead of posting.
export interface FormElement extends BaseElement {
  type: 'form';
  fields: FormField[];
  title?: string;
  submitLabel?: string; // default "Send"
  successMessage?: string; // default "Thanks — we'll be in touch."
}

// Embedded Google map — see MapElementView.tsx. Registered as
// `interactive: true` (registry.tsx) so pan/zoom gestures reach the iframe;
// its wrapper carries data-lenis-prevent so Lenis doesn't hijack them (same
// law as the carousel's horizontal scroller). Uses the keyless Google Maps
// embed URL by default, or the Maps Embed API when
// ctx.integrations?.googleMapsApiKey is set — see MapElementView.tsx.
export interface MapElement extends BaseElement {
  type: 'map';
  lat: number;
  lng: number;
  zoom?: number; // default 12, clamped 1-20
  markerLabel?: string; // optional place label shown via the q= param
}

export interface GenericElement extends BaseElement {
  type: 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';
}

export type SceneElement = TextElement | CubeElement | GlbObjectElement | ImageElement | VideoElement | MarqueeElement | CarouselElement | CounterElement | SvgElement | GridElement | GalleryElement | LottieElement | FormElement | MapElement | GenericElement;

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

export interface SiteLink {
  label: string;
  href: string;
}

// Page-level chrome layered around the scroll animation: theme colors/font,
// a sticky nav bar, a footer, a custom cursor, and a loading gate for the
// standalone player. Rendered by SiteChrome (src/components/site/) and
// wired additively into PreviewPanel.tsx — every field is optional and an
// absent `site` produces identical output to pre-Wave-5.1 schemas. See
// src/schema/migrate.ts's migrateSite for clamping rules.
export interface SiteConfig {
  theme?: { background?: string; text?: string; accent?: string; fontFamily?: string };
  nav?: { logoText?: string; links?: SiteLink[] };
  footer?: { text?: string; links?: SiteLink[] };
  cursor?: { style: 'default' | 'dot' | 'glow'; color?: string };
  loadingGate?: { enabled: boolean; text?: string; minMs?: number };
}

// User-managed public site keys, set via the studio's Integrations drawer
// (src/components/IntegrationsDrawer.tsx) — never emitted or touched by the
// AI (see server/gemini.ts's sanitizeSchema + runChat reattach). These are
// PUBLIC keys by design (form endpoint, reCAPTCHA v3 site key, Maps API key)
// and ship as-is in exported HTML; never put a secret key here.
export interface ProjectIntegrations {
  formEndpoint?: string;
  recaptchaSiteKey?: string;
  googleMapsApiKey?: string;
}

export interface ProjectSchema {
  version?: number;
  scenes: Scene[];
  site?: SiteConfig;
  integrations?: ProjectIntegrations;
}

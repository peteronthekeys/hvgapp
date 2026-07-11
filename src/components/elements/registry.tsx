import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Type, Box, Package, Image as ImageIcon, Video, MoveHorizontal, GalleryHorizontal, Hash, PenTool, LayoutGrid, Images, Sparkles, ClipboardList, MapPin } from 'lucide-react';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { ElementType, SceneElement, TextElement, CubeElement, GlbObjectElement, ImageElement, VideoElement, MarqueeElement, CarouselElement, CounterElement, SvgElement, GridElement, GalleryElement, LottieElement, FormElement, MapElement, DEFAULT_GLB_OBJECT_MODEL_PATH } from '../../types';
import type { ProjectIntegrations } from '../../types';
import type { FieldSpec } from './specs';
import { TextElementView } from './TextElementView';
import { CubeElementView } from './CubeElementView';
import { GlbObjectElementView } from './GlbObjectElementView';
import { ImageElementView } from './ImageElementView';
import { VideoElementView } from './VideoElementView';
import { MarqueeElementView } from './MarqueeElementView';
import { CarouselElementView } from './CarouselElementView';
import { CounterElementView } from './CounterElementView';
import { SvgElementView } from './SvgElementView';
import { GridElementView } from './GridElementView';
import { GalleryElementView } from './GalleryElementView';
import { LottieElementView } from './LottieElementView';
import { FormElementView } from './FormElementView';
import { MapElementView } from './MapElementView';

export type ScenePolishControls = {
  bloomIntensity: number;
  bloomLuminanceThreshold: number;
  vignetteDarkness: number;
  cubeRotationTurns: number;
  glbRotationTurns: number;
  glbScale: number;
};

export const DEFAULT_POLISH_CONTROLS: ScenePolishControls = {
  bloomIntensity: 0.22,
  bloomLuminanceThreshold: 0.28,
  vignetteDarkness: 0.14,
  cubeRotationTurns: 1,
  glbRotationTurns: 1,
  glbScale: 1.35,
};

export interface DomRendererCtx {
  gsapInstance: typeof gsapType;
  scrollTrigger: typeof ScrollTriggerType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
  // Threaded from PreviewPanel's schema.integrations (see the form/map
  // adapters below) — additive; existing adapters/renderers ignore it.
  integrations?: ProjectIntegrations;
}

export interface R3fRendererCtx {
  sceneStartVh: number;
  sceneHeightVh: number;
  polishControls: ScenePolishControls;
}

export interface ElementDefinition {
  type: ElementType;
  layer: 'dom' | 'r3f';
  label: string;
  icon: LucideIcon;
  Dom?: React.FC<{ element: SceneElement; ctx: DomRendererCtx }>;
  R3f?: React.FC<{ element: SceneElement; ctx: R3fRendererCtx }>;
  fields: FieldSpec[];
  create: () => SceneElement;
  interactive?: boolean;
}

const TextDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <TextElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const CubeR3fAdapter: React.FC<{ element: SceneElement; ctx: R3fRendererCtx }> = ({ element, ctx }) => (
  <CubeElementView
    element={element as CubeElement}
    sceneStartVh={ctx.sceneStartVh}
    sceneHeightVh={ctx.sceneHeightVh}
    polishControls={ctx.polishControls}
  />
);

const GlbObjectR3fAdapter: React.FC<{ element: SceneElement; ctx: R3fRendererCtx }> = ({ element, ctx }) => (
  <GlbObjectElementView
    element={element as GlbObjectElement}
    sceneStartVh={ctx.sceneStartVh}
    sceneHeightVh={ctx.sceneHeightVh}
    polishControls={ctx.polishControls}
  />
);

const ImageDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <ImageElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const VideoDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <VideoElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const MarqueeDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <MarqueeElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const CarouselDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <CarouselElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const CounterDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <CounterElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const SvgDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <SvgElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const GridDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <GridElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const GalleryDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <GalleryElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const LottieDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <LottieElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
  />
);

const FormDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <FormElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
    integrations={ctx.integrations}
  />
);

const MapDomAdapter: React.FC<{ element: SceneElement; ctx: DomRendererCtx }> = ({ element, ctx }) => (
  <MapElementView
    element={element}
    gsapInstance={ctx.gsapInstance}
    scrollTrigger={ctx.scrollTrigger}
    container={ctx.container}
    sceneStartPx={ctx.sceneStartPx}
    sceneHeightPx={ctx.sceneHeightPx}
    integrations={ctx.integrations}
  />
);

export const elementRegistry: Partial<Record<ElementType, ElementDefinition>> = {
  text: {
    type: 'text',
    layer: 'dom',
    label: 'Text',
    icon: Type,
    Dom: TextDomAdapter,
    fields: [
      { key: 'content', label: 'Content', kind: 'textarea' },
      {
        key: 'splitMode',
        label: 'Split Mode',
        kind: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'chars', label: 'Characters' },
          { value: 'words', label: 'Words' },
          { value: 'lines', label: 'Lines' },
        ],
      },
      { key: 'staggerEach', label: 'Stagger Each (s)', kind: 'number', min: 0.005, max: 0.2, step: 0.005 },
      {
        key: 'tag',
        label: 'Tag',
        kind: 'select',
        options: [
          { value: '', label: 'Default' },
          { value: 'h1', label: 'H1' },
          { value: 'h2', label: 'H2' },
          { value: 'p', label: 'Paragraph' },
        ],
      },
      { key: 'fontSize', label: 'Font Size (rem)', kind: 'number', min: 0.5, max: 12, step: 0.25 },
    ],
    create: (): TextElement => ({
      id: crypto.randomUUID(),
      type: 'text',
      content: 'New Text',
      start: 0,
      end: 1,
      startY: 100,
      endY: 0,
      startOpacity: 0,
      endOpacity: 1,
    }),
  },
  cube: {
    type: 'cube',
    layer: 'r3f',
    label: 'Cube',
    icon: Box,
    R3f: CubeR3fAdapter,
    fields: [],
    create: (): CubeElement => ({
      id: crypto.randomUUID(),
      type: 'cube',
      start: 0,
      end: 1,
      startY: 100,
      endY: -100,
      startOpacity: 0,
      endOpacity: 1,
    }),
  },
  glbObject: {
    type: 'glbObject',
    layer: 'r3f',
    label: 'GLB Object',
    icon: Package,
    R3f: GlbObjectR3fAdapter,
    fields: [{ key: 'modelPath', label: 'Model path', kind: 'url', placeholder: '/models/scroll-orb.glb' }],
    create: (): GlbObjectElement => ({
      id: crypto.randomUUID(),
      type: 'glbObject',
      modelPath: DEFAULT_GLB_OBJECT_MODEL_PATH,
      start: 0,
      end: 1,
      startY: 100,
      endY: -100,
      startOpacity: 0,
      endOpacity: 1,
    }),
  },
  image: {
    type: 'image',
    layer: 'dom',
    label: 'Image',
    icon: ImageIcon,
    Dom: ImageDomAdapter,
    fields: [
      { key: 'src', label: 'Image URL', kind: 'url', placeholder: 'https://...' },
      { key: 'srcset', label: 'Srcset', kind: 'text' },
      { key: 'alt', label: 'Alt text', kind: 'text' },
      {
        key: 'objectFit',
        label: 'Object fit',
        kind: 'select',
        options: [
          { value: 'cover', label: 'Cover' },
          { value: 'contain', label: 'Contain' },
        ],
      },
    ],
    create: (): ImageElement => ({
      id: crypto.randomUUID(),
      type: 'image',
      src: '',
      objectFit: 'cover',
      start: 0,
      end: 1,
      startY: 40,
      endY: -40,
      startOpacity: 0,
      endOpacity: 1,
    }),
  },
  video: {
    type: 'video',
    layer: 'dom',
    label: 'Video',
    icon: Video,
    Dom: VideoDomAdapter,
    fields: [
      { key: 'src', label: 'Video URL', kind: 'url', placeholder: 'https://...' },
      { key: 'poster', label: 'Poster URL', kind: 'url' },
      {
        key: 'mode',
        label: 'Mode',
        kind: 'select',
        options: [
          { value: 'background', label: 'Background' },
          { value: 'clickToPlay', label: 'Click to Play' },
        ],
      },
      { key: 'loop', label: 'Loop', kind: 'toggle' },
    ],
    create: (): VideoElement => ({
      id: crypto.randomUUID(),
      type: 'video',
      src: '',
      mode: 'background',
      loop: true,
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  marquee: {
    type: 'marquee',
    layer: 'dom',
    label: 'Marquee',
    icon: MoveHorizontal,
    Dom: MarqueeDomAdapter,
    fields: [
      { key: 'items', label: 'Items', kind: 'list', itemFields: [{ key: 'value', label: 'Text', kind: 'text' }] },
      { key: 'speedPxPerSec', label: 'Speed (px/s)', kind: 'number', min: 10, max: 400, step: 5 },
      {
        key: 'direction',
        label: 'Direction',
        kind: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
        ],
      },
      { key: 'gapRem', label: 'Gap (rem)', kind: 'number', min: 0.5, max: 10, step: 0.5 },
    ],
    create: (): MarqueeElement => ({
      id: crypto.randomUUID(),
      type: 'marquee',
      items: ['ANIMATION', 'STUDIO', 'PRO'],
      speedPxPerSec: 80,
      direction: 'left',
      gapRem: 3,
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  carousel: {
    type: 'carousel',
    layer: 'dom',
    label: 'Carousel',
    icon: GalleryHorizontal,
    Dom: CarouselDomAdapter,
    interactive: true,
    fields: [
      {
        key: 'slides',
        label: 'Slides',
        kind: 'list',
        itemFields: [
          { key: 'src', label: 'Image URL', kind: 'url', placeholder: 'https://...' },
          { key: 'caption', label: 'Caption', kind: 'text' },
        ],
      },
      { key: 'autoplayMs', label: 'Autoplay (ms)', kind: 'number', min: 0, max: 15000, step: 500 },
      { key: 'showDots', label: 'Show Dots', kind: 'toggle' },
      { key: 'showArrows', label: 'Show Arrows', kind: 'toggle' },
    ],
    create: (): CarouselElement => ({
      id: crypto.randomUUID(),
      type: 'carousel',
      slides: [
        { id: crypto.randomUUID(), src: 'https://picsum.photos/seed/carousel1/800/600' },
        { id: crypto.randomUUID(), src: 'https://picsum.photos/seed/carousel2/800/600' },
        { id: crypto.randomUUID(), src: 'https://picsum.photos/seed/carousel3/800/600' },
      ],
      showDots: true,
      showArrows: true,
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  counter: {
    type: 'counter',
    layer: 'dom',
    label: 'Counter',
    icon: Hash,
    Dom: CounterDomAdapter,
    fields: [
      { key: 'from', label: 'From', kind: 'number', step: 1 },
      { key: 'to', label: 'To', kind: 'number', step: 1 },
      { key: 'decimals', label: 'Decimals', kind: 'number', min: 0, max: 4, step: 1 },
      { key: 'prefix', label: 'Prefix', kind: 'text' },
      { key: 'suffix', label: 'Suffix', kind: 'text' },
    ],
    create: (): CounterElement => ({
      id: crypto.randomUUID(),
      type: 'counter',
      from: 0,
      to: 100,
      start: 0.1,
      end: 0.6,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  svg: {
    type: 'svg',
    layer: 'dom',
    label: 'SVG Draw',
    icon: PenTool,
    Dom: SvgDomAdapter,
    fields: [
      { key: 'paths', label: 'Paths', kind: 'list', itemFields: [{ key: 'value', label: 'Path (d)', kind: 'textarea' }] },
      { key: 'viewBox', label: 'View Box', kind: 'text' },
      { key: 'strokeColor', label: 'Stroke Color', kind: 'color' },
      { key: 'strokeWidth', label: 'Stroke Width', kind: 'number', min: 0.5, max: 20, step: 0.5 },
    ],
    create: (): SvgElement => ({
      id: crypto.randomUUID(),
      type: 'svg',
      paths: ['M10 50 Q50 10 90 50'],
      viewBox: '0 0 100 60',
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  grid: {
    type: 'grid',
    layer: 'dom',
    label: 'Grid',
    icon: LayoutGrid,
    Dom: GridDomAdapter,
    fields: [
      { key: 'columns', label: 'Columns', kind: 'number', min: 1, max: 6, step: 1 },
      {
        key: 'cards',
        label: 'Cards',
        kind: 'list',
        itemFields: [
          { key: 'title', label: 'Title', kind: 'text' },
          { key: 'body', label: 'Body', kind: 'textarea' },
          { key: 'imageSrc', label: 'Image URL', kind: 'url', placeholder: 'https://...' },
        ],
      },
    ],
    create: (): GridElement => ({
      id: crypto.randomUUID(),
      type: 'grid',
      columns: 3,
      cards: [
        { id: crypto.randomUUID(), title: 'Feature A' },
        { id: crypto.randomUUID(), title: 'Feature B' },
        { id: crypto.randomUUID(), title: 'Feature C' },
      ],
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  gallery: {
    type: 'gallery',
    layer: 'dom',
    label: 'Gallery',
    icon: Images,
    Dom: GalleryDomAdapter,
    interactive: true,
    fields: [
      { key: 'columns', label: 'Columns', kind: 'number', min: 1, max: 6, step: 1 },
      { key: 'lightbox', label: 'Lightbox', kind: 'toggle' },
      {
        key: 'images',
        label: 'Images',
        kind: 'list',
        itemFields: [
          { key: 'src', label: 'Image URL', kind: 'url', placeholder: 'https://...' },
          { key: 'alt', label: 'Alt text', kind: 'text' },
        ],
      },
    ],
    create: (): GalleryElement => ({
      id: crypto.randomUUID(),
      type: 'gallery',
      columns: 3,
      lightbox: true,
      images: [
        { id: crypto.randomUUID(), src: 'https://picsum.photos/seed/gallery1/800/800' },
        { id: crypto.randomUUID(), src: 'https://picsum.photos/seed/gallery2/800/800' },
        { id: crypto.randomUUID(), src: 'https://picsum.photos/seed/gallery3/800/800' },
      ],
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  lottie: {
    type: 'lottie',
    layer: 'dom',
    label: 'Lottie',
    icon: Sparkles,
    Dom: LottieDomAdapter,
    fields: [
      { key: 'src', label: 'Lottie JSON URL', kind: 'url', placeholder: '/lottie/pulse.json' },
      {
        key: 'playMode',
        label: 'Play Mode',
        kind: 'select',
        options: [
          { value: 'scrub', label: 'Scrub' },
          { value: 'autoplay', label: 'Autoplay' },
        ],
      },
      { key: 'loop', label: 'Loop (autoplay)', kind: 'toggle' },
    ],
    create: (): LottieElement => ({
      id: crypto.randomUUID(),
      type: 'lottie',
      src: '/lottie/pulse.json',
      playMode: 'scrub',
      loop: true,
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  form: {
    type: 'form',
    layer: 'dom',
    label: 'Form',
    icon: ClipboardList,
    Dom: FormDomAdapter,
    interactive: true,
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      {
        key: 'fields',
        label: 'Fields',
        kind: 'list',
        itemFields: [
          { key: 'label', label: 'Label', kind: 'text' },
          {
            key: 'kind',
            label: 'Kind',
            kind: 'select',
            options: [
              { value: 'text', label: 'Text' },
              { value: 'email', label: 'Email' },
              { value: 'textarea', label: 'Textarea' },
            ],
          },
          { key: 'required', label: 'Required', kind: 'toggle' },
        ],
      },
      { key: 'submitLabel', label: 'Submit Label', kind: 'text' },
      { key: 'successMessage', label: 'Success Message', kind: 'text' },
    ],
    create: (): FormElement => ({
      id: crypto.randomUUID(),
      type: 'form',
      title: 'Get in touch',
      fields: [
        { id: crypto.randomUUID(), label: 'Name', kind: 'text', required: true },
        { id: crypto.randomUUID(), label: 'Email', kind: 'email', required: true },
        { id: crypto.randomUUID(), label: 'Message', kind: 'textarea' },
      ],
      submitLabel: 'Send',
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
  map: {
    type: 'map',
    layer: 'dom',
    label: 'Map',
    icon: MapPin,
    Dom: MapDomAdapter,
    interactive: true,
    fields: [
      { key: 'lat', label: 'Latitude', kind: 'number', step: 0.0001 },
      { key: 'lng', label: 'Longitude', kind: 'number', step: 0.0001 },
      { key: 'zoom', label: 'Zoom', kind: 'number', min: 1, max: 20, step: 1 },
      { key: 'markerLabel', label: 'Marker Label', kind: 'text' },
    ],
    create: (): MapElement => ({
      id: crypto.randomUUID(),
      type: 'map',
      lat: 40.7128,
      lng: -74.006,
      zoom: 12,
      start: 0,
      end: 1,
      startY: 0,
      endY: 0,
      startOpacity: 1,
      endOpacity: 1,
    }),
  },
};

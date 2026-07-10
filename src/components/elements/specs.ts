export type FieldKind = 'text' | 'number' | 'range' | 'select' | 'color' | 'url' | 'toggle' | 'textarea' | 'list';

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  itemFields?: FieldSpec[];
}

// Shared animation fields present on every SceneElement (see BaseElement in
// src/types.ts). Rendered after any type-specific fields in ElementEditor.
export const BASE_FIELDS: FieldSpec[] = [
  { key: 'start', label: 'Start %', kind: 'range', min: 0, max: 1, step: 0.01 },
  { key: 'end', label: 'End %', kind: 'range', min: 0, max: 1, step: 0.01 },
  { key: 'startY', label: 'Start Y', kind: 'number' },
  { key: 'endY', label: 'End Y', kind: 'number' },
  { key: 'startOpacity', label: 'Start Opacity', kind: 'range', min: 0, max: 1, step: 0.05 },
  { key: 'endOpacity', label: 'End Opacity', kind: 'range', min: 0, max: 1, step: 0.05 },
];

// Shared trigger/appear fields present on every SceneElement (see `trigger`/
// `appear` on BaseElement in src/types.ts). Dot-path keys under `appear.*`
// follow the same nested-value convention as LAYOUT_FIELDS. Only rendered
// for DOM-layer registry types (ElementEditor.tsx) — R3F elements don't run
// through PositionedElement's scrub/appear selection.
export const TRIGGER_FIELDS: FieldSpec[] = [
  {
    key: 'trigger',
    label: 'Trigger',
    kind: 'select',
    options: [
      { value: 'scrub', label: 'Scrub' },
      { value: 'appear', label: 'Appear' },
    ],
  },
  {
    key: 'appear.preset',
    label: 'Appear Preset',
    kind: 'select',
    options: [
      { value: 'fade', label: 'Fade' },
      { value: 'slide-up', label: 'Slide Up' },
      { value: 'slide-left', label: 'Slide Left' },
      { value: 'scale', label: 'Scale' },
      { value: 'spring', label: 'Spring' },
    ],
  },
  { key: 'appear.duration', label: 'Appear Duration (s)', kind: 'number', min: 0.1, max: 3, step: 0.1 },
  { key: 'appear.delay', label: 'Appear Delay (s)', kind: 'number', min: 0, max: 2, step: 0.1 },
  { key: 'appear.once', label: 'Appear Once', kind: 'toggle' },
];

// Shared layout fields present on every SceneElement via the optional
// `layout` prop (see ElementLayout in src/types.ts). Keys use dot-paths
// (e.g. 'layout.x') — ElementEditor's generic form reads/writes nested
// values immutably. Rendered between type-specific fields and BASE_FIELDS.
export const LAYOUT_FIELDS: FieldSpec[] = [
  { key: 'layout.x', label: 'X %', kind: 'number', min: 0, max: 100, step: 1 },
  { key: 'layout.y', label: 'Y %', kind: 'number', min: 0, max: 100, step: 1 },
  { key: 'layout.width', label: 'Width %', kind: 'number', min: 1, max: 100, step: 1 },
  {
    key: 'layout.anchor',
    label: 'Anchor',
    kind: 'select',
    options: [
      { value: 'center', label: 'Center' },
      { value: 'top-left', label: 'Top Left' },
      { value: 'top-right', label: 'Top Right' },
      { value: 'bottom-left', label: 'Bottom Left' },
      { value: 'bottom-right', label: 'Bottom Right' },
    ],
  },
  { key: 'layout.z', label: 'Z', kind: 'number', step: 1 },
];

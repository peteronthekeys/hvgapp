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

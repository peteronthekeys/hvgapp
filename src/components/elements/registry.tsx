import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Type, Box, Package } from 'lucide-react';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { ElementType, SceneElement, TextElement, CubeElement, GlbObjectElement, DEFAULT_GLB_OBJECT_MODEL_PATH } from '../../types';
import type { FieldSpec } from './specs';
import { TextElementView } from './TextElementView';
import { CubeElementView } from './CubeElementView';
import { GlbObjectElementView } from './GlbObjectElementView';

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

export const elementRegistry: Partial<Record<ElementType, ElementDefinition>> = {
  text: {
    type: 'text',
    layer: 'dom',
    label: 'Text',
    icon: Type,
    Dom: TextDomAdapter,
    fields: [{ key: 'content', label: 'Content', kind: 'textarea' }],
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
};

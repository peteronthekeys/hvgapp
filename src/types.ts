export type ElementType = 'text' | 'cube' | 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';

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

export interface GenericElement extends BaseElement {
  type: 'environment' | 'object' | 'character' | 'action' | 'motion' | 'font' | 'component';
}

export type SceneElement = TextElement | CubeElement | GenericElement;

export interface Scene {
  id: string;
  height: number; // representing vh
  elements: SceneElement[];
  transition?: boolean;
}

export interface ProjectSchema {
  scenes: Scene[];
}

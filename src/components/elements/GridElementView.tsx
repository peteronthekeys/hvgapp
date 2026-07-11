import React from 'react';
import { GridElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';

const DEFAULT_WIDTH = 80;
const DEFAULT_COLUMNS = 3;

export function GridElementView({
  element,
  gsapInstance,
  scrollTrigger,
  container,
  sceneStartPx,
  sceneHeightPx,
}: {
  element: SceneElement;
  gsapInstance: typeof gsapType;
  scrollTrigger: typeof ScrollTriggerType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
}) {
  if (element.type !== 'grid') return null;

  const grid = element as GridElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  // No layout means a wide-but-contained default (a feature grid, not a
  // point element and not full-bleed like Marquee) — see the carousel/marquee
  // default-layout pattern.
  const effectiveElement: SceneElement = grid.layout
    ? grid
    : { ...grid, layout: { x: 50, y: 50, anchor: 'center', width: DEFAULT_WIDTH } };

  return (
    <PositionedElement element={effectiveElement} ctx={ctx} className="w-full">
      <GridCards grid={grid} />
    </PositionedElement>
  );
}

function GridCards({ grid }: { grid: GridElement }) {
  const cards = grid.cards ?? [];
  const columns = Math.min(grid.columns ?? DEFAULT_COLUMNS, Math.max(cards.length, 1));

  return (
    <div
      className="grid w-full gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cards.map(card => (
        <div key={card.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          {card.imageSrc && (
            <img
              src={card.imageSrc}
              alt={card.title}
              loading="lazy"
              className="mb-3 aspect-video w-full rounded-lg object-cover"
            />
          )}
          <div className="font-semibold text-slate-100">{card.title}</div>
          {card.body && <p className="mt-1 text-sm text-slate-400">{card.body}</p>}
        </div>
      ))}
    </div>
  );
}

import React, { useLayoutEffect, useRef } from 'react';
import { SvgElement, SceneElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';
import { getElementWindowPx } from './useScrubTween';

const DEFAULT_VIEW_BOX = '0 0 100 100';
const DEFAULT_STROKE_COLOR = '#2dd4bf';
const DEFAULT_STROKE_WIDTH = 2;

// The editor's generic 'list' field edits {value} object rows (see
// ElementEditor's ListFieldInput) — migrateSchema normalizes those back to
// the string[] shape SvgElement.paths declares, but this stays defensive for
// the brief window between an in-progress edit and the next migrate-on-write
// pass (mirrors MarqueeElementView's normalizeItems).
function normalizePaths(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).value === 'string') {
        return (item as Record<string, unknown>).value as string;
      }
      return '';
    })
    .map(item => item.trim())
    .filter(Boolean);
}

export function SvgElementView({
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
  if (element.type !== 'svg') return null;

  const svgEl = element as SvgElement;
  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  // Explicit layout.width means the wrapper already constrains size; with no
  // layout, cap at 30vw so a diagram/underline doesn't dominate the scene
  // (mirrors ImageElementView's centered-default sizing).
  const sizeClass = svgEl.layout?.width !== undefined ? 'w-full h-auto' : 'max-w-[30vw]';

  return (
    <PositionedElement element={element} ctx={ctx}>
      <SvgDraw
        svgEl={svgEl}
        gsapInstance={gsapInstance}
        container={container}
        sceneStartPx={sceneStartPx}
        sceneHeightPx={sceneHeightPx}
        sizeClass={sizeClass}
      />
    </PositionedElement>
  );
}

// Draw-on-scroll: each <path>'s stroke-dasharray is set to its measured
// length, stroke-dashoffset starts equal (fully hidden) and is animated to 0.
// All paths share one scrubbed GSAP timeline over the element's scrub window
// (getElementWindowPx); timeline.to() with no position arg appends each path
// sequentially, so paths draw one after another instead of all at once.
function SvgDraw({
  svgEl,
  gsapInstance,
  container,
  sceneStartPx,
  sceneHeightPx,
  sizeClass,
}: {
  svgEl: SvgElement;
  gsapInstance: typeof gsapType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
  sizeClass: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const paths = normalizePaths(svgEl.paths);

  useLayoutEffect(() => {
    const svgNode = svgRef.current;
    if (!svgNode) return;

    const pathNodes = Array.from(svgNode.querySelectorAll('path'));
    if (pathNodes.length === 0) return;

    const { elStartPx, elEndPx } = getElementWindowPx(svgEl, sceneStartPx, sceneHeightPx);
    const distance = Math.max(elEndPx - elStartPx, 1);

    pathNodes.forEach(node => {
      const length = node.getTotalLength();
      node.style.strokeDasharray = `${length}`;
      node.style.strokeDashoffset = `${length}`;
    });

    const timeline = gsapInstance.timeline({
      scrollTrigger: {
        scroller: container,
        trigger: container,
        start: `top+=${elStartPx} top`,
        end: `top+=${elStartPx + distance} top`,
        scrub: true,
      },
    });

    pathNodes.forEach(node => {
      timeline.to(node, { strokeDashoffset: 0, ease: 'none' });
    });

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, [svgEl, gsapInstance, container, sceneStartPx, sceneHeightPx, paths]);

  return (
    <svg ref={svgRef} viewBox={svgEl.viewBox ?? DEFAULT_VIEW_BOX} fill="none" className={`${sizeClass} block`}>
      {paths.map((d, index) => (
        <path
          key={index}
          d={d}
          stroke={svgEl.strokeColor ?? DEFAULT_STROKE_COLOR}
          strokeWidth={svgEl.strokeWidth ?? DEFAULT_STROKE_WIDTH}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

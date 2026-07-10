import React, { useEffect, useRef } from 'react';
import { SceneElement, TextElement } from '../../types';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type { DomRendererCtx } from './registry';
import { PositionedElement } from './PositionedElement';
import { getElementWindowPx } from './useScrubTween';

const RESIZE_DEBOUNCE_MS = 150;
const DEFAULT_STAGGER_EACH = 0.03;

const VALID_TAGS = new Set(['h1', 'h2', 'p']);

function resolveTag(tag: TextElement['tag']): 'h1' | 'h2' | 'p' | 'div' {
  return tag && VALID_TAGS.has(tag) ? tag : 'div';
}

/**
 * Splits the content node into chars/words/lines (GSAP SplitText) and drives
 * a nested SCRUBBED reveal timeline (from y:40/opacity:0 to y:0/opacity:1,
 * staggered across the split targets) over the same start/end px window as
 * the outer whole-element scrub tween (see useScrubTween.ts /
 * getElementWindowPx). The outer scrub (applied by PositionedElement to the
 * wrapping div) still animates this node's y/opacity as a whole — the split
 * timeline animates the individual chars/words/lines nested inside it, so
 * both coexist without fighting over the same DOM node's transform.
 */
function SplitTextContent({
  element,
  splitMode,
  Tag,
  fontSizeStyle,
  gsapInstance,
  container,
  sceneStartPx,
  sceneHeightPx,
}: {
  element: TextElement;
  splitMode: 'chars' | 'words' | 'lines';
  Tag: 'h1' | 'h2' | 'p' | 'div';
  fontSizeStyle: React.CSSProperties | undefined;
  gsapInstance: typeof gsapType;
  container: HTMLDivElement;
  sceneStartPx: number;
  sceneHeightPx: number;
}) {
  const nodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    gsapInstance.registerPlugin(SplitText);

    let split: SplitText | null = null;
    let timeline: gsap.core.Timeline | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const build = () => {
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      split?.revert();

      split = new SplitText(node, { type: splitMode });
      const targets = split[splitMode];

      const { elStartPx, elEndPx } = getElementWindowPx(element, sceneStartPx, sceneHeightPx);
      const distance = Math.max(elEndPx - elStartPx, 1);
      const staggerEach = element.staggerEach ?? DEFAULT_STAGGER_EACH;

      timeline = gsapInstance.timeline({
        scrollTrigger: {
          scroller: container,
          trigger: container,
          start: `top+=${elStartPx} top`,
          end: `top+=${elStartPx + distance} top`,
          scrub: true,
        },
      });
      timeline.fromTo(
        targets,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: staggerEach, ease: 'none' }
      );
    };

    build();

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, RESIZE_DEBOUNCE_MS);
    });
    resizeObserver.observe(node);

    return () => {
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      split?.revert();
    };
  }, [element, splitMode, gsapInstance, container, sceneStartPx, sceneHeightPx]);

  return React.createElement(Tag, { ref: nodeRef, style: fontSizeStyle }, element.content);
}

export function TextElementView({
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
  if (element.type !== 'text') return null;

  const ctx: DomRendererCtx = { gsapInstance, scrollTrigger, container, sceneStartPx, sceneHeightPx };
  const className = 'text-5xl font-bold tracking-tighter text-slate-100 whitespace-nowrap';

  // splitMode 'none' with no tag/fontSize override: visually equivalent to the
  // pre-Wave-1.3 path (plain text child, no wrapper). Note: the anchor transform
  // now survives the tween, so text sits truly centered — Wave 0's single-node
  // structure let GSAP discard the -translate-y-1/2 (~half a line lower).
  if ((element.splitMode ?? 'none') === 'none' && element.tag === undefined && element.fontSize === undefined) {
    return (
      <PositionedElement element={element} ctx={ctx} className={className}>
        {element.content}
      </PositionedElement>
    );
  }

  const Tag = resolveTag(element.tag);
  const fontSizeStyle: React.CSSProperties | undefined =
    element.fontSize !== undefined ? { fontSize: `${element.fontSize}rem` } : undefined;

  if ((element.splitMode ?? 'none') === 'none') {
    return (
      <PositionedElement element={element} ctx={ctx} className={className}>
        <Tag style={fontSizeStyle}>{element.content}</Tag>
      </PositionedElement>
    );
  }

  return (
    <PositionedElement element={element} ctx={ctx} className={className}>
      <SplitTextContent
        element={element}
        splitMode={element.splitMode as 'chars' | 'words' | 'lines'}
        Tag={Tag}
        fontSizeStyle={fontSizeStyle}
        gsapInstance={gsapInstance}
        container={container}
        sceneStartPx={sceneStartPx}
        sceneHeightPx={sceneHeightPx}
      />
    </PositionedElement>
  );
}

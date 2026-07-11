/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Page-level chrome for a ProjectSchema's optional `site` config: theme CSS
// vars, a sticky nav bar, a footer, a custom cursor, and a standalone-only
// loading gate. Mounted additively by PreviewPanel.tsx (see its wiring for
// where each piece lives in the DOM).
//
// Purity law (src/components/AGENTS.md): this file is part of the player
// bundle graph (PreviewPanel imports it) — it must never import
// App/EditorPanel/ChatPanel or any other editor-side module. Only React and
// src/types.ts.

import React, { useEffect, useRef, useState } from 'react';
import { SiteConfig } from '../../types';

const SCENE_HREF_PATTERN = /^#scene-(\d+)$/;
const DEFAULT_LOADING_MIN_MS = 600;
const LOADING_FADE_MS = 500;
const CURSOR_LERP = 0.2;

/** `#scene-<index>` (0-based, matching schema.scenes array order) -> index, else null for any other href. */
export function parseSceneHref(href: string): number | null {
  const match = SCENE_HREF_PATTERN.exec(href);
  if (!match) return null;
  return Number(match[1]);
}

/** CSS custom properties + page-level background/text/font for the preview wrapper. Scene elements keep their own explicit colors — this is only the page default. */
export function getSiteThemeStyle(theme: SiteConfig['theme']): React.CSSProperties | undefined {
  if (!theme) return undefined;
  const style: Record<string, string> = {};
  if (theme.background) {
    style.backgroundColor = theme.background;
    style['--site-bg'] = theme.background;
  }
  if (theme.text) {
    style.color = theme.text;
    style['--site-text'] = theme.text;
  }
  if (theme.accent) {
    style['--site-accent'] = theme.accent;
  }
  if (theme.fontFamily) {
    style.fontFamily = theme.fontFamily;
  }
  return style as React.CSSProperties;
}

/**
 * Sticky bar at the top of the scroll content (not document-fixed — it lives
 * inside the Lenis-scrolled content flow, so wheel/touch events over it
 * bubble to the Lenis wrapper normally; no data-lenis-prevent needed since
 * it isn't a nested scroller).
 */
export function SiteNav({
  nav,
  onScrollToScene,
}: {
  nav: NonNullable<SiteConfig['nav']>;
  onScrollToScene: (sceneIndex: number) => void;
}) {
  const links = nav.links ?? [];

  return (
    <div
      className="sticky top-0 z-30 flex w-full items-center justify-between gap-4 px-6 py-3 pointer-events-auto bg-black/30 backdrop-blur-sm"
      style={{ color: 'var(--site-text, #f8fafc)' }}
    >
      <span className="font-display text-lg font-bold tracking-tight">{nav.logoText ?? ''}</span>
      <div className="flex items-center gap-6">
        {links.map((link, index) => {
          const sceneIndex = parseSceneHref(link.href);
          if (sceneIndex !== null) {
            return (
              <button
                key={`${link.href}-${index}`}
                type="button"
                onClick={() => onScrollToScene(sceneIndex)}
                className="text-sm font-medium opacity-80 transition-opacity hover:opacity-100"
              >
                {link.label}
              </button>
            );
          }
          return (
            <a
              key={`${link.href}-${index}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium opacity-80 transition-opacity hover:opacity-100"
            >
              {link.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** Normal document-flow footer rendered after the last scene — see PreviewPanel.tsx's wiring comment for why this approach keeps seek(1)/scrub math untouched. */
export function SiteFooter({ footer }: { footer: NonNullable<SiteConfig['footer']> }) {
  const links = footer.links ?? [];

  return (
    <div
      className="relative flex w-full flex-col items-center gap-3 border-t border-white/10 px-6 py-10 text-sm"
      style={{ color: 'var(--site-text, #94a3b8)' }}
    >
      {footer.text && <p className="opacity-80">{footer.text}</p>}
      {links.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {links.map((link, index) => (
            <a
              key={`${link.href}-${index}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Fixed pointer-events-none dot/glow that lerp-follows the pointer via one
 * rAF loop. Starts on pointerenter of `wrapperRef`'s element, stops + hides
 * on pointerleave. Position updates write directly to the DOM node's
 * transform (no setState per frame — compositor-friendly, no re-renders).
 * Hidden on coarse (touch) pointers; snaps instead of lerping under
 * prefers-reduced-motion.
 */
export function SiteCursor({
  cursor,
  wrapperRef,
}: {
  cursor: NonNullable<SiteConfig['cursor']>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}) {
  const dotRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (cursor.style === 'default') return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const paint = (x: number, y: number) => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
    };

    const tick = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * CURSOR_LERP;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * CURSOR_LERP;
      paint(currentRef.current.x, currentRef.current.y);
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleMove = (event: PointerEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      if (reduceMotion) {
        currentRef.current = { x: event.clientX, y: event.clientY };
        paint(event.clientX, event.clientY);
      }
    };

    const handleEnter = (event: PointerEvent) => {
      currentRef.current = { x: event.clientX, y: event.clientY };
      targetRef.current = { x: event.clientX, y: event.clientY };
      paint(event.clientX, event.clientY);
      setVisible(true);
      if (!reduceMotion && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const handleLeave = () => {
      setVisible(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    wrapper.addEventListener('pointerenter', handleEnter);
    wrapper.addEventListener('pointerleave', handleLeave);
    wrapper.addEventListener('pointermove', handleMove);

    return () => {
      wrapper.removeEventListener('pointerenter', handleEnter);
      wrapper.removeEventListener('pointerleave', handleLeave);
      wrapper.removeEventListener('pointermove', handleMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cursor.style, wrapperRef]);

  if (cursor.style === 'default') return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[80] rounded-full transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${cursor.style === 'glow' ? 'h-20 w-20 blur-xl' : 'h-3 w-3'}`}
      style={{ backgroundColor: cursor.color ?? 'var(--site-accent, #2dd4bf)', willChange: 'transform' }}
    />
  );
}

/**
 * Fullscreen-within-container overlay shown only for `embedded` PreviewPanel
 * mounts (standalone player / playback overlay) — the studio editing
 * preview never renders it, since it would obstruct editing. Fades out
 * after max(window load, minMs). StrictMode-safe: the `cancelled` flag
 * guards every timer/listener callback so a double-invoked effect can't
 * double-fire or leak.
 */
export function LoadingGate({
  loadingGate,
  theme,
}: {
  loadingGate: NonNullable<SiteConfig['loadingGate']>;
  theme?: SiteConfig['theme'];
}) {
  const [hidden, setHidden] = useState(false);
  const [fading, setFading] = useState(false);
  const enabled = loadingGate.enabled;
  const minMs = loadingGate.minMs ?? DEFAULT_LOADING_MIN_MS;

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === 'undefined') return;

    let cancelled = false;
    const timers: number[] = [];
    const startedAt = Date.now();

    const onReady = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minMs - elapsed);
      const hideTimer = window.setTimeout(() => {
        if (cancelled) return;
        setFading(true);
        const doneTimer = window.setTimeout(() => {
          if (!cancelled) setHidden(true);
        }, LOADING_FADE_MS);
        timers.push(doneTimer);
      }, remaining);
      timers.push(hideTimer);
    };

    if (document.readyState === 'complete') {
      onReady();
    } else {
      window.addEventListener('load', onReady, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', onReady);
      timers.forEach(id => window.clearTimeout(id));
    };
  }, [enabled, minMs]);

  if (!enabled || hidden) return null;

  return (
    <div
      className={`absolute inset-0 z-[90] flex items-center justify-center transition-opacity duration-500 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: theme?.background ?? '#020617', color: theme?.text ?? '#f8fafc' }}
    >
      <p className="text-sm font-mono uppercase tracking-widest">{loadingGate.text ?? 'Loading'}</p>
    </div>
  );
}

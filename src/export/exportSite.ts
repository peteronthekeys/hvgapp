/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// One-click export: bundles the current ProjectSchema + the standalone player
// (dist/player/player.js + player.css, built via `npm run build:player`) into
// a single self-contained HTML file and triggers a browser download. See
// src/player/entry.tsx for the runtime this file boots via
// window.__ASP_PROJECT__.

import { CarouselElement, ProjectSchema, Scene, SceneElement } from '../types';

const ASSET_URL_FIELDS = ['src', 'srcset', 'poster', 'modelPath'] as const;

function absolutizeUrl(value: string): string {
  // Root-relative only ('/foo', not '//foo' protocol-relative or 'data:'/'https:' etc).
  return value.startsWith('/') && !value.startsWith('//') ? `${location.origin}${value}` : value;
}

function absolutizeElement(element: SceneElement): SceneElement {
  const updated: Record<string, unknown> = { ...element };
  const source = element as unknown as Record<string, unknown>;

  for (const field of ASSET_URL_FIELDS) {
    const value = source[field];
    if (typeof value === 'string') {
      updated[field] = absolutizeUrl(value);
    }
  }

  if (element.type === 'carousel') {
    updated.slides = (element as CarouselElement).slides.map(slide =>
      typeof slide.src === 'string' ? { ...slide, src: absolutizeUrl(slide.src) } : slide
    );
  }

  return updated as unknown as SceneElement;
}

function absolutizeScene(scene: Scene): Scene {
  return { ...scene, elements: scene.elements.map(absolutizeElement) };
}

// Pure — rewrites root-relative asset URLs (src/srcset/poster/modelPath, plus
// carousel slide src) to absolute URLs against the current origin, so the
// exported HTML keeps working when opened from a different host/file://.
// Exported separately from exportSite() for unit testability.
export function absolutizeAssetUrls(schema: ProjectSchema): ProjectSchema {
  return { ...schema, scenes: schema.scenes.map(absolutizeScene) };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value: string): string {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'export';
}

// True when any scene has a lottie element — gates fetching/inlining
// dist/player/lottie.js so exports with no lottie usage stay byte-identical
// to pre-Wave-4.3 output.
function schemaHasLottie(schema: ProjectSchema): boolean {
  return schema.scenes.some(scene => scene.elements.some(el => el.type === 'lottie'));
}

async function fetchPlayerAsset(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error('Player bundle not found — run npm run build:player');
  }
  return response.text();
}

// Fetches the standalone player (same-origin /player/*), inlines it with the
// (asset-URL-rewritten) schema into one HTML document, and downloads it as a
// Blob. No network calls beyond the same-origin player fetch.
export async function exportSite(schema: ProjectSchema, title = 'My Scroll Site'): Promise<void> {
  const hasLottie = schemaHasLottie(schema);
  const [playerJs, playerCss, lottieJs] = await Promise.all([
    fetchPlayerAsset('/player/player.js'),
    fetchPlayerAsset('/player/player.css'),
    hasLottie ? fetchPlayerAsset('/player/lottie.js') : Promise.resolve(''),
  ]);
  // Loaded as its own <script> ahead of player.js so window.lottie exists
  // before LottieElementView's loadLottie() (elements/lottieLoader.ts) runs.
  const lottieScriptTag = hasLottie ? `<script>${lottieJs}</script>\n` : '';

  const absolutized = absolutizeAssetUrls(schema);
  const projectJson = JSON.stringify(absolutized)
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--')
    // JS line separators are legal in JSON strings but not in pre-ES2019
    // script source — escape for maximum host compatibility.
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>${playerCss}</style>
</head>
<body>
<div id="asp-root"></div>
<script>window.__ASP_PROJECT__ = ${projectJson};</script>
${lottieScriptTag}<script>${playerJs}</script>
</body>
</html>
`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(title)}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

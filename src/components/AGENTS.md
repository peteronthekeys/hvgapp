# src/components

## Purpose

UI components for editing, previewing, and AI-updating the animation schema.

## Ownership

- `PreviewPanel.tsx` is the animation engine orchestrator: Lenis + GSAP ScrollTrigger wiring (scrollerProxy), the R3F Canvas with postprocessing polish, scene layout math, and the imperative `playbackRef` handle. It accepts an additive `embedded` prop (default false) used by the landing page's LiveDemo section to suppress dev-only Leva chrome; keep new props additive so the studio path never changes behavior.
- `elements/` owns element rendering: `registry.tsx` is the single map from `ElementType` to renderer (`layer: 'dom' | 'r3f'`), editor `fields: FieldSpec[]`, `create()` factory, and `interactive` flag; `progress.ts` owns `getElementProgress` and the shared `ScrollProgressContext`; one `<Type>ElementView.tsx` per renderable type.
- `EditorPanel.tsx` and `SceneEditor.tsx` create and arrange schema elements; `ElementEditor.tsx` is a generic form renderer driven by `FieldSpec`s from the registry — new types get editor UI by declaring fields, not by editing ElementEditor.
- `ChatPanel.tsx` sends schema updates through the server-side AI loop; all schema writes funnel through `App.tsx`'s `applySchema` (migrate-on-write).

## Local Contracts

- Preserve explicit `el.type === '<type>'` guards at the registry lookup boundaries in `PreviewPanel.tsx`.
- New live element type work must follow `.claude/skills/new-element-type/SKILL.md` (types.ts + `elements/` registry entry + `server/gemini.ts` in one change).
- R3F element animation must consume `ScrollProgressContext` from `elements/progress.ts`; do not add per-frame DOM scroll reads.
- Files under `elements/` must not import EditorPanel/ChatPanel/App — they are bundled into the standalone player.
- Never use `ScrollTrigger.pin` inside the preview's scroll container (it fights the scrollerProxy) — the sticky scene wrapper IS the pin mechanism.
- Interactive elements (carousel, click-to-play video, etc.) opt in via the registry `interactive` flag on their `ElementDefinition` (or a `PositionedElement` `interactive` prop override for per-instance cases) — this is what re-enables `pointer-events-auto` on an otherwise `pointer-events-none` scene layer. Any nested scroller inside such an element (e.g. a carousel's horizontal track) must carry `data-lenis-prevent` so Lenis doesn't hijack its wheel/touch input.

## Work Guidance

- Keep renderer additions parallel to existing text/cube/GLB patterns.
- Keep dev-only tooling, such as Leva panels and the `window.__studio` hook, gated out of production bundles.

## Verification

- Run `npm run lint` after component edits.
- Playwright fixture flow via the DEV hook: `window.__studio.setSchema(fixture)` → `playback.current.seek(p)` → assert.

## Child DOX Index

No child DOX files yet.

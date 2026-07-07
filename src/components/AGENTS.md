# src/components

## Purpose

UI components for editing, previewing, and AI-updating the animation schema.

## Ownership

- `PreviewPanel.tsx` is the animation engine home: GSAP plus Lenis for DOM text, `ScrollProgressContext` for R3F elements, and postprocessing polish.
- `EditorPanel.tsx`, `SceneEditor.tsx`, and `ElementEditor.tsx` create and edit schema elements.
- `ChatPanel.tsx` sends schema updates through the server-side AI loop.

## Local Contracts

- Preserve `PreviewPanel.tsx` type-filter guards for text, cube, and `glbObject`.
- New live element type work must follow `.claude/skills/new-element-type/SKILL.md` and update all root type-drift layers.
- R3F element animation must consume `ScrollProgressContext`; do not add per-frame DOM scroll reads.

## Work Guidance

- Keep renderer additions parallel to existing text/cube/GLB patterns.
- Keep dev-only tooling, such as Leva panels, gated out of production bundles.

## Verification

- Run `npm run lint` after component edits.

## Child DOX Index

No child DOX files yet.

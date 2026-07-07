# src

## Purpose

React app source for Animation Studio Pro: the studio app (`App.tsx`, served at `/studio`) and the marketing landing page (`landing/`, served at `/`).

## Ownership

- `types.ts` owns `ProjectSchema` and `SceneElement` shapes.
- `App.tsx` owns the current `ProjectSchema` state and passes it to editor, preview, and chat panels.
- `main.tsx` owns the route split: pathname conditional + `React.lazy` for both pages (no router dependency; full-page navigation between `/` and `/studio`).
- `landing/` owns the marketing page: `useLandingScroll.ts` is its single scroll model (window-mode Lenis + ScrollTrigger, no scrollerProxy), `HeroCanvas.tsx` is the fixed demand-frameloop R3F canvas driven by the normalized progress ref, `sections/` holds one file per page section, and `demoSchema.ts` is the canned project for the embedded live demo.
- `components/AGENTS.md` owns component-level guidance.

## Landing Contracts

- The landing page mirrors the one-scroll-model rule per document: its R3F orb reads the normalized progress ref from `useLandingScroll`; do not add another scroll source.
- Landing R3F must not use drei `<Environment>` CDN presets — the HDR fetch can hang the Suspense boundary (use the local `RoomEnvironment` setup in `HeroCanvas.tsx`).
- `demoSchema.ts` may only use renderable element types (`text` | `cube` | `glbObject`).

## Local Contracts

- Treat `ProjectSchema` in `types.ts` as the schema source of truth.
- Keep `ElementType` honest: a type in the AI-emittable/renderable set must satisfy the root type-drift law.
- Keep placeholder-only types out of the server enum until they have a real renderer.

## Work Guidance

- Prefer small schema-compatible changes over broad refactors.
- Keep app imports relative unless the project-wide convention changes.

## Verification

- Run `npm run lint` after TypeScript or TSX edits.

## Child DOX Index

- `components/AGENTS.md`: editor, preview, and chat component contracts.

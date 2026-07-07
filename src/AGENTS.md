# src

## Purpose

React app source for Animation Studio Pro.

## Ownership

- `types.ts` owns `ProjectSchema` and `SceneElement` shapes.
- `App.tsx` owns the current `ProjectSchema` state and passes it to editor, preview, and chat panels.
- `components/AGENTS.md` owns component-level guidance.

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

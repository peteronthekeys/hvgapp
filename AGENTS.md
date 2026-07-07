# DOX Framework

DOX is the AGENTS.md hierarchy for this repository. AGENTS.md files are binding work contracts for their subtrees.

## Core Contract

- Before editing, read this root file, identify the files or folders you expect to touch, then walk from the repository root to each target path and read every AGENTS.md found along that route.
- If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there.
- The nearest AGENTS.md owns local details. Parent docs own broader rules. A child doc may be more specific, but it must not weaken DOX or project-wide invariants.
- After meaningful changes, update the closest owning AGENTS.md if purpose, structure, contracts, workflows, verification, or durable operating rules changed. Update parent or child indexes when the tree changes.
- Child AGENTS.md files should hold pointers and local specifics only. Do not duplicate broad root rules across many files.

## Project Pointers

- `CLAUDE.md`: app architecture, commands, server/Vite behavior, and current gotchas.
- `HVG_ROADMAP.md`: resolved rulings, build-push order, and keep/kill checkpoint.
- `HVG_BRIEF.md`: dependency inventory, platform notes, cost/licensing warnings, and longer-term lanes.
- `.claude/skills/new-element-type/SKILL.md`: required checklist for any live `ElementType` change.

## Non-Negotiables

- Type-drift law: a new live `ElementType` must exist in all three layers in the same change: `src/types.ts` union/detail shape, `server.ts` `updateSchema` enum plus system prompt, and a renderer in `src/components/PreviewPanel.tsx`.
- One-scroll-model rule: scroll-driven R3F work reads `ScrollProgressContext` normalized progress. Do not read `container.scrollTop` or add another scroll source for element animation.
- Preserve renderer type guards. Keep text, cube, and GLB object rendering behind explicit type filters.
- Keep secrets server-side. Do not edit `.env`; do not expose keys through `VITE_`-prefixed variables.
- Follow existing relative import style for app code.

## Verification

- `npm run lint` runs `tsc --noEmit` and is the only project check.
- There is no test runner unless one is added deliberately and documented here.

## Child DOX Index

- `src/AGENTS.md`: React app schema, state ownership, and source contracts.

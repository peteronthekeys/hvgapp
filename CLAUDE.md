# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Google AI Studio applet: a browser-based scroll-animation builder ("Animation Studio Pro") where an AI chat assistant edits the animation by calling a Gemini function. React 19 + Vite front end, single Express server that also proxies the Gemini API. `metadata.json` marks it as a server-side Gemini applet; AI Studio injects `GEMINI_API_KEY` and `APP_URL` at runtime.

## Commands

```bash
npm install
npm run dev      # tsx server.ts — Express + Vite middleware on :3000 (NOT `vite`)
npm run build    # vite build, then esbuild bundles server.ts -> dist/server.cjs
npm start        # node dist/server.cjs (set NODE_ENV=production to serve dist/)
npm run lint     # tsc --noEmit — the only check; no test runner, no ESLint/Prettier
```

There are no tests. `GEMINI_API_KEY` must be set (see `.env.example`) or `/api/chat` fails.

## Architecture

**One Express process serves everything** (`server.ts`). In dev it mounts Vite as middleware; in prod (`NODE_ENV=production`) it serves `dist/` static + SPA fallback. Both modes expose `POST /api/chat`. This is why `dev` runs `tsx server.ts`, not the Vite CLI.

**Single source of truth is `ProjectSchema`** (`src/types.ts`), held in `App.tsx` `useState`. Everything is a function of it:
- `EditorPanel` (left) mutates it immutably via `onChange` — add/delete scenes, drag elements in, toggle transitions.
- `PreviewPanel` (center) renders it as a scroll-driven animation.
- `ChatPanel` (right) sends it to the AI and replaces it wholesale with the returned schema.

**AI editing loop:** `ChatPanel` POSTs `{ message, currentSchema, history }` → `server.ts` calls Gemini with a single `updateSchema` function declaration whose parameters mirror `ProjectSchema` → the model returns the **entire** new schema as function args → server returns `{ text, newSchema }` → `ChatPanel` calls `onChange(newSchema)`, replacing App state. The model is told to always return the full schema, not a patch.

**Two animation engines share one scroll container** in `PreviewPanel`:
- Text elements: Framer `motion` (`motion/react`) with `useTransform` over `useScroll` pixel offsets.
- Cube elements: react-three-fiber `<Canvas>` overlay; `useFrame` reads `scrollTop` off the container ref each frame and drives a Three.js mesh.
Scene `height` is in `vh`; each element's `start`/`end` are 0–1 fractions of its scene's scroll span, converted to pixels against the container's `clientHeight`.

## Gotchas

- `server.ts` uses model id `"gemini-3.5-flash"` and its `updateSchema` declaration only enumerates `text`/`cube` (its system prompt even has a leftover "Wait, ..." note), while `ElementType` in `types.ts` has 9 types. The AI path and the full type union are out of sync — only `text`/`cube` actually render in `PreviewPanel`; other types are editor-only placeholders.
- `@/*` resolves to the repo root (tsconfig `paths` + vite alias), but components import via relative paths — follow the existing relative style.
- `vite.config.ts` gates HMR/file-watching on `DISABLE_HMR` (AI Studio sets it to avoid flicker during agent edits). Don't "fix" the disabled watcher.

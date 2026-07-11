---
name: new-element-type
description: Checklist for adding a new ElementType to Animation Studio Pro without reopening the AI/renderer drift (HVG_ROADMAP R3). Use whenever a scene element type is being added or an existing placeholder type is being made renderable.
---

# Adding a new ElementType

This app has three layers that must agree on which element types exist and which
actually render. Historically they drifted (`ElementType` had 9 values, the AI
could only emit 2, and the renderer only drew 2). Closing that drift is P0 — do
not reopen it. Every new element type touches **all three** of these layers in
the same change:

1. **`src/types.ts`** — add the value to the `ElementType` union and a typed
   interface extending `BaseElement` if it needs extra fields (follow the
   `TextElement`/`ImageElement` pattern). Update the comment above `ElementType`
   if the rendered/placeholder split changes. If the new type has fields that
   need defaults, add them to `src/schema/migrate.ts`.

2. **`src/components/elements/`** — create `<Type>ElementView.tsx` and register
   it in `registry.tsx`: an `ElementDefinition` with `layer` (`'dom'` or
   `'r3f'`), the renderer (`Dom` or `R3f`), `fields: FieldSpec[]` (drives the
   ElementEditor form automatically), `create()` (drag-drop factory), `label`,
   `icon`, and `interactive: true` if the element must receive pointer events.
   DOM renderers get scrub/layout behavior from the shared plumbing; R3F
   renderers must read `ScrollProgressContext` from `./progress` (one-scroll-model
   rule — never read scrollTop). Registry files must not import editor/chat/App
   modules (they are bundled into the standalone player).

   **Also add an explicit render block in `src/components/PreviewPanel.tsx`**:
   it does NOT generically iterate the registry — each type needs its own
   `scene.elements.filter(el => el.type === '<type>').map(...)` block (this is
   the "preserve explicit type guards" contract). A registry entry without a
   PreviewPanel block silently renders nowhere.

3. **`server/gemini.ts`** — add the value to the `updateSchema` declaration's
   `type` enum, any new properties to the element item schema, and a cheatsheet
   line in the system prompt (what the type is, required fields, when to use).
   Extend `sanitizeSchema()` defaults if the type has required fields the AI
   might omit. If the type isn't renderable yet, do NOT add it here — the AI
   must only emit types that actually render.

## Order of operations

A type is only "done" when all three layers are updated in the same change:

- `types.ts` only → editor placeholder; must stay OUT of the gemini enum.
- `types.ts` + registry renderer but not `server/gemini.ts` → renders when placed
  manually, AI can't emit it. Acceptable only as a deliberate, documented interim.
- gemini enum without a registry renderer → **never**. That is the drift P0 closed.

## Verification

- `npm run lint` (`tsc --noEmit`) must be clean.
- Grep-confirm the AI-emittable set matches the registry:
  `grep -n "enum:" server/gemini.ts` must list exactly the keys of
  `elementRegistry` in `src/components/elements/registry.tsx`.
- Playwright fixture check via the DEV hook: `window.__studio.setSchema(fixture)`
  → `__studio.playback.current.seek(p)` → assert the element renders/animates.

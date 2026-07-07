---
name: new-element-type
description: Checklist for adding a new ElementType to Animation Studio Pro without reopening the AI/renderer drift (HVG_ROADMAP R3). Use whenever a scene element type is being added or an existing placeholder type is being made renderable.
---

# Adding a new ElementType

This app has three layers that must agree on which element types exist and which
actually render. Historically they drifted (`ElementType` had 9 values, the AI
could only emit 2, and the renderer only drew 2). Closing that drift is P0 — do
not reopen it. Every new element type touches **all three** of these files:

1. **`src/types.ts`** — add the value to the `ElementType` union (and a typed
   interface extending `BaseElement` if it needs extra fields, following the
   `TextElement`/`CubeElement` pattern). Update the comment above `ElementType`
   if the rendered/placeholder split changes.

2. **`server.ts`** — add the value to the `updateSchema` function declaration's
   `type` enum (`parameters.properties.scenes.items.properties.elements.items.properties.type.enum`),
   and add a line to the system prompt telling the model what the type is for
   and when to use it. If the type isn't renderable yet, do NOT add it here —
   the AI must only be able to emit types that actually render.

3. **`components/PreviewPanel.tsx`** (or `src/components/PreviewPanel.tsx` in
   this repo layout) — add a real renderer: either a `motion`/Framer element
   (like `TextElementView`) or an `@react-three/fiber` mesh (like
   `CubeElementView`), and wire it into the scene render loop with a
   `.filter(el => el.type === '<newtype>')` the same way `text` and `cube` are
   filtered.

## Order of operations

A type is only "done" when all three are updated in the same change:

- Add to `types.ts` only → editor can create it, nothing else knows about it. Fine as an interim placeholder, but must stay OUT of `server.ts`'s enum.
- Add to `types.ts` + `PreviewPanel.tsx` but not `server.ts` → renders when placed manually via the editor, but the AI can't create/edit it. Acceptable only as a deliberate interim step — document it as such.
- Add to `server.ts`'s enum without a `PreviewPanel.tsx` renderer → **do not do this**. This is exactly the drift P0 closed. The AI would emit a type that silently doesn't show up.

## Verification

- `npm run lint` (`tsc --noEmit`) must be clean.
- Grep-confirm the AI-emittable set matches the rendered set:
  `grep -n "enum:" server.ts` should list exactly the types filtered on in
  `PreviewPanel.tsx` (`grep -n "type ===" src/components/PreviewPanel.tsx`).

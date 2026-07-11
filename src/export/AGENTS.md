# src/export

## Purpose

One-click export: bundles the current `ProjectSchema` + the standalone player build into a single self-contained HTML file, triggered from the studio UI.

## Ownership

- `exportSite.ts` fetches `/player/player.js` + `/player/player.css` (same-origin, built via `npm run build:player`), absolutizes root-relative asset URLs in the schema (`absolutizeAssetUrls`), inlines everything into one HTML document, and triggers a browser download. Runtime it boots: `src/player/entry.tsx`.

## Local Contracts

- Conditional lottie inline: `exportSite` fetches and inlines `/player/lottie.js` as its own `<script>` **before** the player `<script>`, but only when the schema contains at least one `lottie` element (`schemaHasLottie`). This keeps exports with no lottie usage byte-structure-identical to pre-Wave-4.3 output (no extra script tag, no extra fetch). Ordering matters: `window.lottie` must exist before the player script runs, since `elements/lottieLoader.ts` reads it as an injected global in the player bundle.
- `ASSET_URL_FIELDS` in `absolutizeElement` already covers `LottieElement.src` generically (any element's `src` field is rewritten) — no lottie-specific absolutize logic was needed.

## Verification

- Run `npm run lint` after edits.
- Manual check: load a schema with a lottie element in the studio, call `exportSite()` (or trigger the UI export button), and confirm the generated HTML has the lottie `<script>` before the player `<script>`; confirm a schema with no lottie element produces no lottie `<script>` at all.

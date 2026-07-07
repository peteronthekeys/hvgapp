# HVG_BRIEF.md

Companion to [README.md](README.md). Together these are the two sources of truth for Animation Studio Pro.

> **Engine/export/priority decisions are RESOLVED — see [HVG_ROADMAP.md](HVG_ROADMAP.md)** (rulings R1–R3, MVP definition, build push, keep/kill checkpoint). Portfolio context: `~/Documents/Obsidian/thecleanstartup/PORTFOLIO.md`.

- **README.md** — what the app *is* and how to run it.
- **HVG_BRIEF.md** (this file) — the full inventory of skills, plugins, connectors, integrations, and third-party platforms: what's installed today, what's recommended to make the animation engine more powerful, and the honest cost/licensing/maturity notes for each.

Status legend: ✅ installed · ⭐ recommended (high value) · ○ optional / situational

---

## 1. Where the engine is thin today

The app holds a single `ProjectSchema` (`src/types.ts`) in `App.tsx` state and renders it in `PreviewPanel`. The "engine" is currently hand-rolled:

- **Text elements** → Framer Motion `useTransform` over `useScroll` (pixel offsets).
- **Cube elements** → raw react-three-fiber `useFrame` reading `container.scrollTop` every frame.
- **Left asset library** (Environments, Objects, Characters, Actions, Motions, Fonts, Components) and **right resources** (Images, Videos, Links, Instructions, Sounds) are **placeholder tiles with no backing engine or data**.
- The AI (`server.ts` `updateSchema`) only knows `text` / `cube`, though `ElementType` declares 9 types.
- The navbar exposes **FPS + frame stepping**, implying an export pipeline that does not exist yet.

Everything below targets those gaps.

---

## 2. Current stack (installed)

| Package | Role | Notes |
|---|---|---|
| `react` / `react-dom` ^19 | UI runtime | React 19 (ref-as-prop, actions) |
| `vite` ^6 + `@vitejs/plugin-react` | Bundler / dev server | Mounted as Express middleware, not the Vite CLI |
| `express` ^4 | Server | Serves the SPA **and** `POST /api/chat` |
| `@google/genai` ^2 | Gemini client | Function-calling (`updateSchema`); server-side key |
| `@react-three/fiber` ^9 | 3D renderer (React↔Three) | Cube layer in `PreviewPanel` |
| `@react-three/drei` ^10 | R3F helpers | `Environment`, `Lightformer` used; more available (see §5) |
| `three` ^0.185 | 3D engine | Underlying WebGL |
| `motion` ^12 | Framer Motion (new pkg name) | DOM scroll animation |
| `@tailwindcss/vite` + `tailwindcss` ^4 | Styling | Tailwind v4 |
| `lucide-react` | Icons | Toolbar / element icons |
| `tsx`, `esbuild`, `typescript` ~5.8 | Build/tooling | `tsc --noEmit` is the only check |

**Host / deploy context:** Google AI Studio applet (`metadata.json` → `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`), deployed to Google Cloud Run. `GEMINI_API_KEY` and `APP_URL` injected at runtime.

---

## 3. Animation engine — recommended libraries

The core upgrade path. Prioritize this section.

### ⭐ GSAP + ScrollTrigger
The industry-standard animation + scroll engine (scrubbing, pinning, snapping, sequenced timelines, `matchMedia` responsive animation). Replaces the hand-rolled scroll→progress math with a battle-tested one and gives the builder features (pin scenes, snap between slides) it can't easily hand-write.
- **Fit:** directly upgrades the scroll model that is the app's whole premise.
- **Install:** `npm i gsap` · use `gsap/ScrollTrigger` (dynamic-import per perf rules).
- **License/cost:** **100% free**, all plugins included (Webflow, 2025). No Club GreenSock paywall anymore.
- **Maturity:** very high, ubiquitous in award-winning sites.

### ⭐ Theatre.js (`@theatre/core`, `@theatre/studio`, `@theatre/r3f`)
A professional keyframe/sequencing **engine with a visual editor** that drives both DOM and R3F objects. This is the closest existing tool to what Animation Studio Pro is building — `ProjectSchema` could serialize to/from a Theatre project sheet.
- **Fit:** could become the real timeline/keyframe backend behind the editor, or an interop/export target.
- **Install:** `npm i @theatre/core @theatre/studio` (+ `@theatre/r3f` for 3D). Studio is dev-only; strip from prod bundle.
- **License/cost:** Apache-2.0, free.
- **Maturity:** mature, actively used; smaller community than GSAP.

### ⭐ Lenis (`lenis`)
Smooth/normalized scroll. Pairs with scroll-driven animation for a premium feel and consistent cross-device scroll velocity. (Formerly `@studio-freight/lenis`.)
- **Fit:** one import, big perceived-quality jump on the scroll experience.
- **Install:** `npm i lenis`.
- **License/cost:** MIT, free.

### ○ drei `ScrollControls` / `useScroll`
Already available via installed `@react-three/drei`. Purpose-built for scroll-driven 3D — a cleaner engine than the current `useFrame`+`scrollTop` approach for the cube layer.
- **Fit:** refactor target for `CubeElementView`; no new dependency.
- **Cost:** free (installed).

### ○ @react-spring/web
Physics/spring-based animation. Only if you want spring dynamics Motion/GSAP don't cover — otherwise redundant with `motion`. Likely **skip** to avoid two DOM-animation engines.

---

## 4. Asset pipeline — fill the empty asset tabs

The left library promises Objects, Characters, Motions, Actions. These are the runtimes/platforms that make those real.

### ⭐ 3D models — `gltfjsx` + drei
Convert GLB/GLTF into typed R3F components; load with drei's `useGLTF`. Backs the **Objects / Characters** asset types.
- **Install:** `npx gltfjsx model.glb` (codegen) · loading via installed drei.
- **Compression:** Draco / meshopt for shippable model sizes.
- **License/cost:** free (pmndrs). Model licensing depends on source.

### ⭐ Rive (`@rive-app/react-canvas`)
Interactive vector animations with **state machines** — ideal for **Motions / Actions** (hover, toggle, scroll-reactive micro-animations) that respond to app state.
- **Platform:** rive.app editor (free tier + paid teams). Runtime is free/open.
- **Install:** `npm i @rive-app/react-canvas`.

### ⭐ Lottie (`lottie-react`)
After Effects animations exported as JSON. Backs **Motions** with designer-made vector motion. LottieFiles is a large free asset marketplace.
- **Platform:** LottieFiles (free + paid).
- **Install:** `npm i lottie-react`.

### ○ Spline (`@splinetool/react-spline` + `@splinetool/runtime`)
Designer-friendly 3D scenes authored in the Spline editor, embedded at runtime. Lets non-devs contribute **Environments / Objects**.
- **Platform:** spline.design (free tier + paid).
- **Install:** `npm i @splinetool/react-spline @splinetool/runtime`.

### ○ Physics — `@react-three/rapier`
Rapier physics for R3F (gravity, collisions, joints). Powers physics-based **Motions** and reactive objects.
- **Install:** `npm i @react-three/rapier`.
- **License/cost:** free.

---

## 5. R3F visual power & editor ergonomics

Small, high-leverage additions from the pmndrs ecosystem (all free, all pair with installed R3F).

| Package | What it adds | Why it fits |
|---|---|---|
| ⭐ `@react-three/postprocessing` | Bloom, depth-of-field, vignette, chromatic aberration | Turns flat cubes into a designed-looking scene |
| ⭐ `leva` | Live GUI controls for any value | Tweak element params (Y, opacity, easing) live in the editor |
| ○ `maath` | Easing, damping, math helpers | Smoother interpolation than raw lerp in `useFrame` |
| ○ `three-stdlib` | Extra Three loaders/controls | On demand for specific loaders |

---

## 6. Export & rendering

The FPS + frame-stepper navbar points straight at this. Pick one lane.

### ⭐ Remotion
React framework for **programmatic video** — same frame/FPS mental model as this app, with a timeline and MP4 output. Could be an export target or a rethink of the render core. **Remotion Lambda** does cloud rendering.
- **Platform:** remotion.dev (Lambda is paid infra).
- **License/cost:** free for individuals/small teams; **company license required** for larger/funded orgs — verify before committing.
- **Maturity:** high.

### ○ Canvas capture — `@ffmpeg/ffmpeg` (ffmpeg.wasm) or CCapture.js
Frame-perfect capture of the running canvas to video/GIF, honoring the FPS control.
- **ffmpeg.wasm:** powerful but heavy; needs cross-origin isolation (COOP/COEP headers). License LGPL/GPL depending on build — flag.
- **CCapture.js:** purpose-built for canvas→video/gif at fixed FPS; older, lightly maintained.

### ○ `html-to-image`
DOM→PNG for scene thumbnails (the editor currently renders placeholder thumbnails). Cheap win. MIT.

---

## 7. AI generation & media platforms (connectors / integrations / 3rd-party)

The app already has an AI chat + voice input + "Sounds" assets. These let the assistant **generate assets**, not just edit the schema.

### In-ecosystem (Google, since this is an AI Studio applet)
| Platform | Use | Access |
|---|---|---|
| ⭐ Gemini (`@google/genai`) | Schema editing (installed) → extend to reasoning over assets | Server-side `GEMINI_API_KEY` |
| ⭐ Imagen | Text→image for Images / textures / environments | via Google GenAI API |
| ⭐ Veo | Text→video for Videos / motion backdrops | via Google GenAI API |
| ○ Gemini image ("Nano Banana") | In-context image gen/edit | via Google GenAI API |

Staying in the Google stack keeps one key, one billing surface, and matches the Cloud Run / AI Studio host.

### Text-to-3D (fills Objects / Characters via AI)
| Platform | Notes |
|---|---|
| ○ Meshy | Text/image→3D GLB; API. Free tier + paid. |
| ○ Luma AI | Genie text→3D / captures. API. |
| ○ Tripo / Rodin | Text/image→3D. APIs, paid tiers. |

### Media generation (general)
| Platform | Notes |
|---|---|
| ○ ElevenLabs | TTS + sound generation → backs **Sounds** assets; complements existing voice input. Paid. |
| ○ fal.ai / Replicate | Hosted image/video/3D model inference if going multi-provider. Paid per-call. |

> ⚠️ Any of these adds a secret + a spend surface. Keep keys server-side (never `VITE_`-prefixed), validate/limit `/api/chat`-style endpoints, and prefer the Google stack unless a capability is missing.

---

## 8. Claude Code automations (animation-focused)

Skills, MCP servers, subagents, and hooks that make *developing the engine* faster. (General/project automations live in the broader recommendation set; these are the animation-relevant ones.)

### MCP servers
| Server | Why | Status |
|---|---|---|
| ⭐ **Blender MCP** | Drive Blender to model/modify scenes and export GLB assets — a real asset pipeline for the empty Objects/Characters tabs | **Already connected this session** |
| ⭐ **context7** | Version-pinned docs for R3F, drei, GSAP, Theatre, `@google/genai` (memory drifts on these) | `claude mcp add context7 -- npx -y @upstash/context7-mcp` |
| ⭐ **Playwright** / chrome-devtools | Scroll the container, screenshot the canvas, capture perf traces of `useFrame` | Playwright connecting this session; check `/mcp` |

### Skills to create (`.claude/skills/<name>/SKILL.md`)
| Skill | Does | Invocation |
|---|---|---|
| ⭐ `new-element-type` | Scaffold a new `ElementType` across `types.ts`, `EditorPanel`, `PreviewPanel`, **and** the server `updateSchema` enum + prompt (the current drift source) | user |
| ○ `scroll-scene` | Scaffold a scroll-driven scene with correct vh↔px keyframe math (GSAP or Motion) | user |
| ○ `import-gltf` | Run `gltfjsx`, drop a typed component + register it as an asset | user |

### Subagents (`.claude/agents/<name>.md`)
| Agent | Why |
|---|---|
| ⭐ `r3f-preview-reviewer` | The perf hot spot: two animation engines on one scroll container, per-frame `scrollTop` reads, `resize`-based layout. Scope to per-frame allocations, ref churn, vh→px math |
| ○ `security-reviewer` (built-in) | Point at `server.ts` — `/api/chat` takes unvalidated input and returns model-authored schema into React state |

### Hooks (`.claude/settings.json`)
| Hook | Why |
|---|---|
| ⭐ PostToolUse type-check | `tsc --noEmit` (incremental + `timeout`) on `.ts/.tsx` edits — catches the `ElementType`↔`updateSchema` drift automatically |
| ○ PreToolUse block `.env` | Protect `GEMINI_API_KEY`; allow `.env.example` |

---

## 9. Suggested adoption order

1. **Engine foundation:** GSAP + ScrollTrigger (or commit to drei `ScrollControls`) + Lenis. Retire the hand-rolled scroll math.
2. **Close the type drift:** `new-element-type` skill + the type-check hook.
3. **Real assets:** `gltfjsx` + drei for 3D; Rive/Lottie for Motions. Wire one asset tab end-to-end as the pattern.
4. **Polish:** `@react-three/postprocessing` + `leva`.
5. **Export:** decide Remotion vs. canvas-capture; wire the FPS/frame UI to it.
6. **AI generation:** Imagen/Veo in-ecosystem first; text-to-3D (Meshy/Luma) later.
7. **Consider Theatre.js** once the schema stabilizes — as timeline backend or interop target.

---

## 10. Licensing & cost — quick reference

| Thing | License / cost | Flag |
|---|---|---|
| GSAP (+plugins) | Free (Webflow, 2025) | — |
| Theatre.js | Apache-2.0 | Studio is dev-only |
| Lenis, Lottie, gltfjsx, pmndrs libs (postprocessing, rapier, leva, maath) | Free / MIT-ish | — |
| Rive | Runtime free; editor free tier + paid teams | — |
| Spline | Free tier + paid | — |
| Remotion | Free (small/individual); **company license** for larger orgs | ⚠️ verify before shipping |
| ffmpeg.wasm | LGPL/GPL by build | ⚠️ needs COOP/COEP headers |
| Imagen / Veo / Gemini | Metered (Google) | Keep key server-side |
| Meshy / Luma / Tripo / ElevenLabs / fal / Replicate | Paid API, free tiers vary | New secret + spend surface each |

---

## Maintenance

Update this file when a dependency, connector, skill, or platform is **added, removed, or changes tier/license**. Keep §2 (current stack) exactly in sync with `package.json`. When something moves from ⭐ recommended to ✅ installed, move its row into §2 and note it in README if it's user-facing.

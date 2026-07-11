# HVG_ROADMAP.md — Animation Studio Pro: Rulings + Build Plan

> **Status:** ratified rulings + roadmap · 2026-07-06 (Fable 5) · Companion to [HVG_BRIEF.md](HVG_BRIEF.md) (library facts) and [README.md](README.md). Portfolio context: `~/Documents/Obsidian/thecleanstartup/PORTFOLIO.md` — this is portfolio project #3; it gets **one focused build push** during a thecleanstartup wait-state, then a keep/kill checkpoint. This doc is one page on purpose.
>
> **2026-07-11 — growth horizon ratified:** [HVG_12MONTH_PLAN.md](HVG_12MONTH_PLAN.md) covers Jul 2026 → Jul 2027 under the keep-verdict premise (quarterly gates, revenue targets, graduation gates back into PORTFOLIO.md). Under that premise it supersedes this doc's "Not now: accounts/billing" line; everything else here stands.

## Rulings

**R1 · Engine lane = GSAP + ScrollTrigger + Lenis (DOM) and drei `ScrollControls` (R3F).** Retire the hand-rolled `useTransform`-over-pixel-offsets and the `useFrame`-reads-`scrollTop` math in the same push — one scroll model, two renderers, both battle-tested. GSAP is fully free (Webflow 2025); drei is already installed. `@react-spring/web` rejected (second DOM engine, no gain).

**R2 · Export lane = canvas capture first.** Wire the existing FPS/frame-stepper UI to fixed-FPS canvas capture (CCapture-style; ffmpeg.wasm only if container/codec needs demand it — mind COOP/COEP). **Remotion deferred:** revisit only if (a) the MVP survives its checkpoint and (b) the company-license question is settled in writing. `html-to-image` for scene thumbnails is a cheap yes.

**R3 · P0 = close the `ElementType` ↔ `updateSchema` drift before any engine work.** The AI editor is the product's premise; today it silently doesn't know 7 of 9 element types. Ship the `new-element-type` skill + the tsc PostToolUse hook (HVG_BRIEF §8) in the same commit so the drift can't reopen.

## MVP definition

**Who:** motion-curious marketers/founders who want a scroll-story page or a short product clip without learning After Effects or GSAP.
**The loop that must feel good:** describe/edit via chat → see it live in preview → **export something usable** (a video clip or an embeddable scroll page). Compose → preview → export. Nothing else is MVP.

## The one build push (ordered)

1. **P0 — drift close + guardrails** (R3). ✓ AI can create/edit every type that renders.
2. **P1 — engine swap** (R1): GSAP/ScrollTrigger + Lenis; drei ScrollControls for cubes. ✓ pin/snap/scrub work; no per-frame `scrollTop` reads.
3. **P2 — one asset tab end-to-end** as the pattern: Objects via `gltfjsx` + drei `useGLTF` (models are the highest wow-per-effort). ✓ drag a GLB-backed object into a scene, it animates on scroll.
4. **P3 — export** (R2): FPS UI → real clip out. ✓ a user leaves with an MP4/WebM.
5. **P4 — polish only if time remains:** `@react-three/postprocessing` bloom + `leva` param tweaking.

## Keep/kill checkpoint (honest, pre-committed)

At the end of the push: put the MVP loop in front of 3–5 real target users (or ship it as an AI Studio applet showcase and watch usage). **Keep** if people complete the loop and ask for more; **park** if the reaction is polite indifference — the space (Framer, Rive, Canva) punishes half-hearted entries, and thecleanstartup's cutover outranks this. Parking is not failure; it's the portfolio working as designed.

## Not now

Theatre.js (revisit only post-checkpoint, as timeline backend) · text-to-3D APIs · ElevenLabs/media-gen platforms (each is a new secret + spend surface, per HVG_BRIEF §7 warning) · mobile anything · accounts/billing.

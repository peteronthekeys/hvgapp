# Animation Studio Pro — 12-Month Development & Clean Startup Growth Plan
**Horizon:** July 2026 → July 2027 · **Author:** Fable 5 · **Status:** draft for ratification

## Context

The expansion offense has taken the product from a two-element demo to a real site-builder substrate in one week of gated waves: 14 live element types (15 after Wave 6 re-lands), a GSAP+Lenis+R3F engine, AI chat editing with a server-side sanitization firewall, a site layer (theme/nav/footer/cursor/loading gate), an integrations system, and the two signature exports — a single self-contained HTML site file and WebM clips. Deployed continuously to hvgapp.vercel.app.

**The premise of this plan** (given): development continues at the current aggressive steady pace — roughly one gated wave per working session, executed by the Fable-plans / Sonnet-implements / Opus-gates agent team — and the keep/kill checkpoint resolves to KEEP, with users and revenue growing correspondingly.

**The honest gap**: everything shipped so far is the *demo half* of a product. There is no persistence (refresh loses work), no auth, no billing (the landing page publicly promises $0/$19/$49 tiers nothing enforces), no hosted publishing, no asset uploads, no templates. The live deploy's `/api/chat` 500s because `GEMINI_API_KEY` is unset on Vercel. The next 12 months close the demo→product→business gaps in that order.

**Doctrine constraints** (PORTFOLIO.md, HVG_ROADMAP.md): hvgapp is portfolio bet #3, funded with explicit-downtime attention only; TCS is the flagship. This plan therefore builds in *graduation gates* — pre-committed revenue thresholds at which hvgapp earns scheduled attention — and quarterly clean-startup checkpoints (proceed / adjust / park) in the spirit of the original keep/kill ruling. Growth targets are commitments to *check honestly*, not vibes.

## North star & operating model

- **The loop:** describe in chat → watch it build live → ship something you own (exported file, published site, or clip). Every quarter must make this loop faster, deeper, or more shareable.
- **North-star metric:** ships per week (exports + publishes + recorded clips) — the loop completed, not vanity signups.
- **Delivery mechanism:** the wave discipline continues unchanged — numbered waves, self-contained specs with pre-walked anchors, Opus review gates, fix-before-commit, push-to-main auto-deploy. Labor stays ~agent-cost; the solo founder is reviewer and decider.
- **Positioning sentence:** *"Describe a scroll story. Watch it build itself. Leave with a single file you own."* — AI-native scrollytelling with zero lock-in. (Competitive claims below marked ⚠ need fresh web verification — agents for this were lost to a session limit; re-run in Q1 week 1.)

---

## Q1 · Jul–Sep 2026 — "Keep the promise the landing page already makes"

**Theme: demo → product.** You cannot launch a tool that loses work on refresh and 500s on chat.

Workstreams (est. ~10–12 waves):
1. **Day-one fixes:** set `GEMINI_API_KEY` on Vercel (user action, blocking); rate-limit + abuse-guard `/api/chat`; error surfaces in ChatPanel.
2. **Wave 6 re-land + Wave 7:** directed 3D (spec ready in scratchpad, re-dispatch immediately), then multi-page + transitions + per-page export (design fresh, per the standing plan).
3. **Persistence lane (the big one):** local-first autosave (IndexedDB) + project file import/export → then accounts (Supabase or Clerk) → cloud project store + projects dashboard. Undo/redo on the schema (it's one immutable object — snapshot stack is cheap).
4. **Billing enforcement:** Stripe (Merchant-of-Record via Paddle/LemonSqueezy preferred at this scale for tax) wired to the *published* $0/$19/$49 tiers. Gate lines: free = 3 projects + daily AI-message cap + "Made with ASP" badge on exports; Pro = unlimited projects/AI, badge off, GLB imports; Studio = seats (defer seats mechanics to Q3 — sell it as "up to 5 logins" manually if bought early).
5. **Instrumentation:** PostHog (or Plausible + custom events): signup → first AI edit → first export funnel; AI cost per user; the north-star ships/week.
6. **Checkpoint executed for real:** 3–5 target users (motion-curious marketers/founders) complete the loop on the live site. This is the original pre-committed gate — the premise says it passes; run it anyway and write the verdict down.

**Launch moment #1 (late Q1, only after persistence+auth):** Show HN + Product Hunt. The WebM recorder makes the launch assets in-product.

**Quarter gate:** ≥30% of new users export/publish in first session · first 25 paying customers · MRR ≥ $500 · AI cost per active user < $0.50/mo (schema-diff optimization pulls in if not). *Miss badly on activation → the loop isn't magical yet; freeze growth work, fix the loop.*

## Q2 · Oct–Dec 2026 — "The exports are the marketing"

**Theme: distribution.** Every artifact the product emits should recruit the next user.

Workstreams (est. ~10 waves):
1. **Hosted publishing:** one-click publish → `yoursite.hvg.app` subdomain (R2/S3 + CDN; the single-file export architecture makes this almost free — it's a PUT + a route). Custom domains on Pro. Free-tier badge links back = the viral loop.
2. **Template gallery:** 25–30 templates spanning the six reference-site archetypes; a template is just a schema JSON — the AI team can produce and gate these like waves. Each template = an SEO landing page (this is the content engine).
3. **Asset uploads:** images/video to object storage with per-tier quotas; GLB uploads later in the quarter (Draco pipeline already local from Wave 6).
4. **Export quality:** conditional 3D chunk (kill the ~1MB three.js tax on DOM-only sites), SEO/meta/OG on exports, Core Web Vitals pass, responsive-output audit.
5. **AI upgrades:** schema-diff editing loop (cost + latency); **prompt-to-full-site** ("paste your product blurb → complete scroll story") — the demoable magic moment for launch #2.
6. **GTM:** weekly template drops + WebM clips on X/design communities; scrollytelling gallery of real user sites (with permission); GSAP/Lenis community presence. ⚠ Verify competitive landscape properly here (Framer/Webflow/v0/Lovable/Rive/Shorthand current pricing + AI stories) before the repositioning pass.

**Quarter gate:** MRR $2–5k · 1,000 WAU · ≥40% of new signups arriving via templates/badges/gallery · publish-rate replaces export-rate as north star. **Graduation gate #1:** MRR ≥ $2.5k sustained two months → propose PORTFOLIO.md amendment: hvgapp earns one *scheduled* block/week (COMMAND-tier ratification required — it's Peter's doctrine, not mine to change).

## Q3 · Jan–Mar 2027 — "Teams, agencies, compounding"

**Theme: the people who pay most build for clients.**

Workstreams (est. ~8–10 waves):
1. **Studio tier made real:** seats + shared projects + roles; client handoff (transfer ownership / white-label export with the client's branding); agency workspace.
2. **Community templates:** submission + review pipeline; rev-share seeds (marketplace proper waits for Q4 — don't build a store before there are sellers).
3. **AI asset generation, in-stack:** Imagen for images/textures, Veo for video backdrops (HVG_BRIEF §7 — one key, one billing surface, stays Google). Metered, Pro+. Every generated asset is stored, owned, exportable — consistent with the no-lock-in wedge.
4. **Editor depth:** timeline/keyframe view — now evaluate Theatre.js as the timeline backend (HVG_ROADMAP R2 said post-checkpoint; this is post-checkpoint), responsive breakpoint preview, a11y tooling for exported sites (it's a differentiator agencies can sell).
5. **Ops hardening:** content moderation + DMCA process for hosted sites (required the moment strangers publish on your domain), support channel (docs + AI support bot + Crisp), backup/restore, uptime SLO for published sites.

**Quarter gate:** MRR $8–15k · ≥10 agencies on Studio · churn < 5%/mo · support load < 5 hrs founder-time/week (else the AI-support lane jumps the queue). **Graduation gate #2:** MRR ≥ $10k sustained → hvgapp becomes a first-class portfolio lane; first-hire decision opens (support/community before engineering — engineering is the agents' job).

## Q4 · Apr–Jun 2027 — "Moat and scale"

**Theme: make the flywheel self-sustaining; decide the company shape.**

Workstreams (est. ~8 waves):
1. **Template marketplace:** paid templates, take rate (~20%), creator payouts — the community flywheel becomes revenue and the moat that compounds (incumbents can copy features; they can't copy a seller base).
2. **Embeds:** scroll-story embed for existing sites — wedge *into* Webflow/Framer/WordPress installed bases instead of fighting head-on. Likely the single biggest TAM expansion of the year.
3. **Integrations expansion:** webhooks/Zapier, analytics choices for published sites, data-driven scenes (CMS-lite: a schema fed by a spreadsheet/JSON endpoint).
4. **Scale + cost curve:** multi-region for published sites, infra cost review against the unit economics, provider-seam abstraction for the AI layer (Gemini stays primary; the seam is the platform-risk mitigation, not a migration).
5. **Company shape decision (pre-committed):** bootstrap remains default. Open a raise conversation only if publishing growth outruns infra budget or the marketplace needs liquidity capital. First hire executed if Q3 gate passed.

**Year-end gate:** MRR base $15k / aggressive $25–40k · churn < 4% · ≥50% of signups from owned loops (templates/badges/gallery/marketplace) · founder hours on hvgapp ≤ the ratified allocation. Miss the base case two quarters running → the clean-startup answer is the original one: park with dignity, keep the playbook.

---

## Metrics ledger (the one table to review monthly)

| | Q1 exit | Q2 exit | Q3 exit | Q4 exit |
|---|---|---|---|---|
| MRR (base / aggressive) | $500 / $1.5k | $3k / $6k | $10k / $18k | $15k / $30k+ |
| Paying customers | 25 | 150 | 450 | 700+ |
| Activation (ship in 1st session) | 30% | 40% | 45% | 50% |
| Monthly churn | — | <6% | <5% | <4% |
| AI cost / active user / mo | <$0.50 | <$0.35 | <$0.35 | <$0.30 |
| Founder hrs/wk on hvgapp | downtime | 1 block | ratified lane | ratified lane |

Assumptions: free→paid 3–5%, ARPU ~$21 (Pro-heavy, some Studio), signup growth ~2× per quarter off launch moments + template SEO. Conservative scenario = half of base; the park-tripwire tracks base, not aggressive.

## Cost model (bootstrap-lean)

- **Now → Q1:** <$200/mo (Vercel hobby→Pro, Gemini flash pennies-per-edit, domains). Labor = agent spend (the actual dominant cost — budget it explicitly, it's the company's payroll).
- **Q2+ (publishing live):** storage/CDN scale with published sites (~$0.02–0.05/site/mo at these volumes); Stripe/MoR ~5%+fees; PostHog/support tooling ~$100/mo. Break-even on infra ≈ 30 Pro subscribers; true break-even including agent payroll ≈ $2–3k MRR — inside the Q2 base case.

## Risk register (tripwire → response, pre-committed)

1. **AI edit cost outpaces ARPU** → tripwire: cost/user > $0.50/mo → schema-diff loop + response caching + tighter free caps (Q1–Q2 work already scheduled).
2. **Gemini platform dependency** (began as an AI Studio applet) → tripwire: pricing/ToS change announcement → provider seam (Q4 workstream) + key/billing already owned directly on Vercel.
3. **Incumbent response** ⚠ (Framer ships conversational editing; Webflow bundles GSAP-native scrolly; frontier prompt-to-site commoditizes "a scroll page") → leading indicators: their launch posts, hiring pages → response: speed (waves ship weekly), single-file no-lock-in export (structurally against their hosting-revenue incentive to copy), then marketplace moat. Verify landscape in Q1/Q2 research passes.
4. **GSAP/Webflow license shift** → exposure is real but bounded: license stayed free in 2025; tripwire: any license announcement → engine is already registry-abstracted; Motion (installed) is the DOM fallback lane.
5. **Solo-founder attention (the doctrine risk)** → hvgapp only takes scheduled time via the graduation gates above; TCS proof-latency remains the portfolio's protected number. If TCS demands surge, hvgapp degrades gracefully to maintenance waves — the agent team makes "paused" cheap.
6. **Quality ceiling hurts word-of-mouth** (AI-built sites look samey) → tripwire: gallery engagement flat + "template-y" feedback → invest in the design-quality lane (art-directed templates, camera-track set pieces, typography depth) before more element types.
7. **Hosted-content abuse** (phishing/spam on hvg.app subdomains) → moderation + DMCA + scanning ship in the same wave as publishing GA, not after the first incident.

## Immediate next actions (this week, post-approval)

1. Re-dispatch Wave 6 (spec ready), Opus gate, push. Design + dispatch Wave 7 (multi-page).
2. Peter: set `GEMINI_API_KEY` on the Vercel project (live chat is 500ing); manual Chrome check of the Record-clip share-picker flow (both outstanding since Wave 3).
3. Commit this plan into the repo as `HVG_12MONTH_PLAN.md` (companion to HVG_ROADMAP.md; supersedes its "Not now: accounts/billing" line under the growth premise), update HVG_ROADMAP.md pointer.
4. Start Q1 workstream 3 (persistence lane) as Wave 8 immediately after Wave 7 — it is the longest pole between here and launch #1.
5. Re-run the lost competitive-research pass (⚠ items) with a fresh agent when limits allow.

## Verification

- Plan file reviewed and ratified by Peter (COMMAND tier — allocation amendments and revenue gates are his to accept per PORTFOLIO.md doctrine).
- Each quarter-gate lands as a dated entry appended to `HVG_12MONTH_PLAN.md` in-repo (same discipline as wave-gate commit messages).
- Metrics ledger reviewed monthly against PostHog once Q1 instrumentation ships; the park-tripwire is evaluated on base-case numbers, honestly, in writing.

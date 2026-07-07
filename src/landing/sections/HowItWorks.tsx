import { useEffect, useRef, useState } from 'react';
import type { LandingEngines } from '../useLandingScroll';

const PROMPT = 'Make the headline rise as I scroll, then bring in a chrome orb with bloom at 60%.';

const STEPS = [
  { n: '01', title: 'Describe', body: 'Type what you want in plain English — or just say it out loud.' },
  { n: '02', title: 'AI rewrites the schema', body: 'Gemini function-calling returns your whole scene graph, not a video.' },
  { n: '03', title: 'Watch it render', body: 'The engine scrubs it live: GSAP for type, WebGL for everything shiny.' },
];

function ChatCard({ typedRef }: { typedRef?: React.Ref<HTMLSpanElement> }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl">
      <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-4">
        chat · you
      </div>
      <div className="rounded-xl rounded-tl-sm bg-slate-800 px-4 py-3 text-sm text-slate-200 leading-relaxed min-h-[5.5rem]">
        {typedRef ? <span ref={typedRef} /> : PROMPT}
        <span className="inline-block w-[2px] h-[1em] bg-teal-400 align-[-0.15em] ml-0.5 animate-pulse" />
      </div>
      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        assistant is editing your scene…
      </div>
    </div>
  );
}

function SchemaCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl font-mono text-[12px] leading-6">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">
        updateSchema() · function call
      </div>
      <pre className="text-slate-400 overflow-x-auto">
        <code>
          {'{ "scenes": [{\n    "height": 250,\n    "elements": [\n'}
          <span className="block bg-teal-500/10 text-teal-300 -mx-5 px-5 border-l-2 border-teal-400">
            {'      { "type": "text",\n        "content": "Headline",\n        "start": 0, "end": 0.45 },'}
          </span>
          <span className="block bg-teal-500/10 text-teal-300 -mx-5 px-5 border-l-2 border-teal-400">
            {'      { "type": "glbObject",\n        "model": "chrome-orb.glb",\n        "endOpacity": 0.6 }'}
          </span>
          {'    ]\n  }]\n}'}
        </code>
      </pre>
    </div>
  );
}

function RenderCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          preview · scrubbing
        </span>
      </div>
      <div className="relative h-52 bg-slate-950 flex items-center justify-center overflow-hidden">
        <div
          className="absolute h-40 w-40 rounded-full opacity-80"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, rgba(153,246,228,0.9), rgba(20,184,166,0.55) 45%, rgba(15,23,42,0) 72%)',
            filter: 'blur(2px)',
            right: '12%',
          }}
        />
        <span className="relative font-display font-bold text-2xl tracking-tight text-slate-100">
          Headline
        </span>
        <div className="absolute bottom-3 left-4 font-mono text-[10px] text-slate-600 uppercase tracking-widest">
          scene 001 (250vh)
        </div>
      </div>
      <div className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-teal-400">
        same engine, live below ↓
      </div>
    </div>
  );
}

export function HowItWorks({
  engines,
  reducedMotion,
}: {
  engines: LandingEngines | null;
  reducedMotion: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  // Pinned scrollytelling needs the side-by-side layout; small screens get the static stack.
  const [isDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const usePinned = isDesktop && !reducedMotion;

  useEffect(() => {
    if (!engines || !usePinned || !rootRef.current) return;
    const { gsapInstance } = engines;

    const ctx = gsapInstance.context(() => {
      const panels: HTMLElement[] = gsapInstance.utils.toArray('[data-hiw-panel]');
      const markers: HTMLElement[] = gsapInstance.utils.toArray('[data-hiw-step]');

      gsapInstance.set(panels.slice(1), { autoAlpha: 0, y: 40 });
      gsapInstance.set(markers[0], { opacity: 1 });

      const tl = gsapInstance.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: '+=260%',
          pin: true,
          scrub: true,
        },
      });

      // Step 1: the prompt types itself as you scroll.
      const typing = { chars: 0 };
      tl.to(typing, {
        chars: PROMPT.length,
        duration: 0.55,
        onUpdate: () => {
          if (typedRef.current) {
            typedRef.current.textContent = PROMPT.slice(0, Math.round(typing.chars));
          }
        },
      });

      // Progress line down the rail across the whole pin.
      tl.to(
        '[data-hiw-progress]',
        { scaleY: 1, duration: 3, ease: 'none', transformOrigin: 'top center' },
        0,
      );

      // Step 1 → 2
      tl.to(panels[0], { autoAlpha: 0, y: -40, duration: 0.25 }, 0.85);
      tl.to(markers[0], { opacity: 0.35, duration: 0.1 }, 0.85);
      tl.to(panels[1], { autoAlpha: 1, y: 0, duration: 0.25 }, 1.0);
      tl.to(markers[1], { opacity: 1, duration: 0.1 }, 1.0);

      // Step 2 → 3
      tl.to(panels[1], { autoAlpha: 0, y: -40, duration: 0.25 }, 1.9);
      tl.to(markers[1], { opacity: 0.35, duration: 0.1 }, 1.9);
      tl.to(panels[2], { autoAlpha: 1, y: 0, duration: 0.25 }, 2.05);
      tl.to(markers[2], { opacity: 1, duration: 0.1 }, 2.05);

      tl.to({}, { duration: 0.7 }); // settle room at the end of the pin
    }, rootRef);

    return () => ctx.revert();
  }, [engines, usePinned]);

  // Reduced motion or small screens: all three steps stacked, no pin.
  if (!usePinned) {
    return (
      <section id="how" aria-label="How it works" className="relative px-6 py-24">
        <div className="mx-auto max-w-7xl space-y-16">
          <SectionHeading />
          {STEPS.map((step, i) => (
            <div key={step.n} className="grid md:grid-cols-2 gap-8 items-center">
              <StepText step={step} dimmed={false} />
              {i === 0 ? <ChatCard /> : i === 1 ? <SchemaCard /> : <RenderCard />}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={rootRef} id="how" aria-label="How it works" className="relative min-h-screen px-6">
      <div className="mx-auto max-w-7xl h-screen grid md:grid-cols-2 gap-12 items-center">
        {/* Left rail */}
        <div className="relative">
          <SectionHeading />
          <div className="mt-12 flex gap-6">
            <div className="relative w-px bg-slate-800 self-stretch">
              <div
                data-hiw-progress
                className="absolute inset-x-0 top-0 h-full bg-teal-400 [transform:scaleY(0)]"
              />
            </div>
            <div className="space-y-10">
              {STEPS.map(step => (
                <div key={step.n} data-hiw-step className="opacity-35">
                  <StepText step={step} dimmed />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right stage: three stacked panels crossfade */}
        <div className="relative h-[24rem] flex items-center justify-center">
          <div data-hiw-panel className="absolute inset-0 flex items-center justify-center">
            <ChatCard typedRef={typedRef} />
          </div>
          <div data-hiw-panel className="absolute inset-0 flex items-center justify-center">
            <SchemaCard />
          </div>
          <div data-hiw-panel className="absolute inset-0 flex items-center justify-center">
            <RenderCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-teal-400 mb-4">
        how it works
      </p>
      <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-slate-100">
        One sentence in.
        <br />
        One scroll story out.
      </h2>
    </div>
  );
}

function StepText({
  step,
  dimmed,
}: {
  step: (typeof STEPS)[number];
  dimmed: boolean;
}) {
  return (
    <div className={dimmed ? '' : 'max-w-md'}>
      <div className="font-mono text-xs text-teal-400 mb-1">{step.n}</div>
      <h3 className="text-xl font-semibold text-slate-100">{step.title}</h3>
      <p className="mt-1.5 text-sm text-slate-400 leading-relaxed max-w-xs">{step.body}</p>
    </div>
  );
}

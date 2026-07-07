import { useEffect, useRef } from 'react';
import { MessageSquare, Box, Ruler, Waves, MousePointer2, Clapperboard } from 'lucide-react';
import type { LandingEngines } from '../useLandingScroll';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Chat is the timeline',
    body: 'Gemini function-calling rewrites your whole scene schema from one message. No keyframe surgery — describe the change and watch the timeline rebuild itself.',
    span: 'md:col-span-4',
    accent: 'text-teal-400',
  },
  {
    icon: Box,
    title: 'A real 3D pipeline',
    body: 'React Three Fiber, GLB models, bloom and vignette. Not CSS pretending to be depth.',
    span: 'md:col-span-2',
    accent: 'text-emerald-400',
  },
  {
    icon: Ruler,
    title: 'Scenes measured in scroll',
    body: 'Scenes are viewport-heights; elements animate over 0→1 fractions of them. Deterministic and resolution-proof.',
    span: 'md:col-span-2',
    accent: 'text-teal-400',
  },
  {
    icon: Waves,
    title: 'Butter by default',
    body: 'Lenis smooth scroll and GSAP ScrollTrigger share one scroll model, so DOM type and WebGL objects move as one — the same wiring driving the page you are reading.',
    span: 'md:col-span-4',
    accent: 'text-emerald-400',
  },
  {
    icon: MousePointer2,
    title: 'Drag, drop, done',
    body: 'Scenes, elements and assets are draggable tiles. The schema is the only source of truth.',
    span: 'md:col-span-3',
    accent: 'text-teal-400',
  },
  {
    icon: Clapperboard,
    title: 'Export to code',
    body: 'Frame-stepper and FPS controls are already in the navbar. Clip export is next.',
    span: 'md:col-span-3',
    accent: 'text-emerald-400',
    soon: true,
  },
];

export function Features({
  engines,
  reducedMotion,
}: {
  engines: LandingEngines | null;
  reducedMotion: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!engines || reducedMotion || !rootRef.current) return;
    const { gsapInstance, scrollTrigger } = engines;

    const ctx = gsapInstance.context(() => {
      const cards: HTMLElement[] = gsapInstance.utils.toArray('[data-feature-card]');
      gsapInstance.set(cards, { opacity: 0, y: 28 });
      scrollTrigger.batch(cards, {
        start: 'top 85%',
        once: true,
        onEnter: batch =>
          gsapInstance.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
          }),
      });
    }, rootRef);

    return () => ctx.revert();
  }, [engines, reducedMotion]);

  return (
    <section ref={rootRef} id="features" aria-label="Features" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-teal-400 mb-4">
          what you get
        </p>
        <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-slate-100 max-w-2xl">
          An animation studio that answers back.
        </h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-6 gap-4">
          {FEATURES.map((feature, i) => (
            <article
              key={feature.title}
              data-feature-card
              className={`group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-600 transition-colors ${feature.span}`}
            >
              <div className="flex items-start justify-between">
                <feature.icon size={20} className={feature.accent} aria-hidden="true" />
                <span className="font-mono text-[10px] text-slate-600">
                  F/{String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-100 flex items-center gap-2">
                {feature.title}
                {feature.soon && (
                  <span className="font-mono text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    soon
                  </span>
                )}
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

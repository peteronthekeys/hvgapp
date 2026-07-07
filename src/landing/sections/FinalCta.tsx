import { useEffect, useRef } from 'react';
import type { LandingEngines } from '../useLandingScroll';

export function FinalCta({
  engines,
  reducedMotion,
}: {
  engines: LandingEngines | null;
  reducedMotion: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!engines || reducedMotion || !rootRef.current) return;
    const { gsapInstance } = engines;

    const ctx = gsapInstance.context(() => {
      gsapInstance.set('[data-cta-reveal]', { opacity: 0, y: 32 });
      gsapInstance.to('[data-cta-reveal]', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 65%',
          once: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [engines, reducedMotion]);

  return (
    <section
      ref={rootRef}
      aria-label="Get started"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      {/* the orb parks here, bloom-hot, behind this copy */}
      <p data-cta-reveal className="font-mono text-[11px] uppercase tracking-[0.35em] text-teal-400 mb-6">
        your turn
      </p>
      <h2
        data-cta-reveal
        className="font-display font-extrabold tracking-tight leading-[1.02] text-slate-100 text-[clamp(2.4rem,6vw,5.5rem)] max-w-4xl"
      >
        Your next scroll story starts with a sentence.
      </h2>
      <div data-cta-reveal className="mt-10">
        <a
          href="/studio"
          className="inline-flex items-center gap-2 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-8 py-4 text-lg transition-colors"
        >
          Open the studio — it's free
        </a>
      </div>
      <p data-cta-reveal className="mt-6 text-sm text-slate-500">
        No install. No card. Runs in your browser.
      </p>
    </section>
  );
}

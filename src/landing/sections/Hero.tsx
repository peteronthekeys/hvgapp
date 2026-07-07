import { useEffect, useRef } from 'react';
import type { LandingEngines } from '../useLandingScroll';

const HEADLINE_LINES = ['Describe it.', 'Scroll it.', 'Ship it.'];

interface HeroProps {
  engines: LandingEngines | null;
  reducedMotion: boolean;
}

export function Hero({ engines, reducedMotion }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const tickerRef = useRef<HTMLSpanElement>(null);

  // Load reveal + scrub-out. Initial hidden states come from CSS (gated on
  // reducedMotion) so the pre-JS frame never flashes then jumps.
  useEffect(() => {
    if (!engines || !rootRef.current) return;
    const { gsapInstance } = engines;

    const ctx = gsapInstance.context(() => {
      gsapInstance.to('[data-hero-line]', {
        y: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.15,
      });
      gsapInstance.to('[data-hero-fade]', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.6,
      });
      gsapInstance.to('[data-hero-inner]', {
        yPercent: -10,
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [engines]);

  // The page reports its own scroll progress — the product's core primitive.
  useEffect(() => {
    if (!engines) return;
    const onScroll = () => {
      if (tickerRef.current) {
        tickerRef.current.textContent = engines.lenis.progress.toFixed(2);
      }
    };
    engines.lenis.on('scroll', onScroll);
    return () => engines.lenis.off('scroll', onScroll);
  }, [engines]);

  // Full class names as literals so Tailwind's scanner can see them.
  const hiddenLine = reducedMotion ? '' : '[transform:translateY(110%)]';
  const hiddenFade = reducedMotion ? '' : 'opacity-0 [transform:translateY(24px)]';

  return (
    <section ref={rootRef} aria-labelledby="hero-heading" className="relative min-h-[130vh]">
      <div data-hero-inner className="sticky top-0 min-h-screen flex flex-col justify-center px-6 pt-24 pb-16">
        <div className="mx-auto w-full max-w-7xl">
          <p
            data-hero-fade
            className={`font-mono text-[11px] md:text-xs uppercase tracking-[0.35em] text-teal-400 mb-8 ${hiddenFade}`}
          >
            AI scroll animation builder — GSAP · Lenis · WebGL
          </p>

          <h1 id="hero-heading" className="font-display font-extrabold tracking-tight leading-[0.95] text-slate-100">
            {HEADLINE_LINES.map(line => (
              <span key={line} className="block overflow-hidden pb-1">
                <span data-hero-line className={`block text-[clamp(3rem,8vw,7.5rem)] ${hiddenLine}`}>
                  {line === 'Scroll it.' ? (
                    <>
                      <span className="text-teal-400">Scroll</span> it.
                    </>
                  ) : (
                    line
                  )}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-hero-fade
            className={`mt-8 max-w-xl text-base md:text-lg text-slate-400 leading-relaxed ${hiddenFade}`}
          >
            Animation Studio Pro turns a plain-English prompt into a production scroll
            animation. An AI copilot edits your scene schema while a real GSAP + WebGL
            engine renders it live in the browser — no keyframes, no code.
          </p>

          <div data-hero-fade className={`mt-10 flex flex-wrap items-center gap-4 ${hiddenFade}`}>
            <a
              href="/studio"
              className="inline-flex items-center gap-2 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-7 py-3.5 transition-colors"
            >
              Start building — free
            </a>
            <a
              href="#how"
              onClick={e => {
                if (!engines) return;
                e.preventDefault();
                engines.lenis.scrollTo('#how', { offset: -8 });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 hover:border-slate-500 text-slate-300 px-7 py-3.5 transition-colors"
            >
              Watch it work <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="absolute bottom-6 inset-x-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-slate-600">
          <span>
            scroll <span aria-hidden="true">↓</span>{' '}
            <span ref={tickerRef} className="text-teal-500">
              0.00
            </span>
          </span>
          <span className="hidden sm:inline">scene 001 · live</span>
        </div>
      </div>
    </section>
  );
}

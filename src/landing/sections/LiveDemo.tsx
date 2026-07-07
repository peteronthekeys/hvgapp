import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { LandingEngines } from '../useLandingScroll';
import { DEMO_SCHEMA } from '../demoSchema';

const LazyPreviewPanel = lazy(() =>
  import('../../components/PreviewPanel').then(m => ({ default: m.PreviewPanel })),
);

/**
 * The proof section: the REAL studio engine (PreviewPanel) mounted with a
 * canned schema. Frame height is reserved up front so lazy-mounting never
 * shifts the document; `data-lenis-prevent` keeps the page's Lenis from
 * eating wheel events meant for the demo's own scroll container.
 */
export function LiveDemo({ engines }: { engines: LandingEngines | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (shouldMount || !sectionRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100%' },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [shouldMount]);

  // Heights are reserved, but recalibrate triggers once the engine mounts anyway.
  useEffect(() => {
    if (!shouldMount || !engines) return;
    const id = window.setTimeout(() => {
      engines.scrollTrigger.refresh();
      engines.lenis.resize();
    }, 300);
    return () => window.clearTimeout(id);
  }, [shouldMount, engines]);

  return (
    <section ref={sectionRef} id="playground" aria-label="Live playground" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-teal-400 mb-4">
              live proof
            </p>
            <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-slate-100">
              This is not a video.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-slate-400 leading-relaxed">
            The frame below is the production engine — GSAP, Lenis and WebGL running the
            exact schema an AI conversation produced. Scroll inside it.
          </p>
        </div>

        {/* Product chrome frame */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-amber-500/60" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
            <span className="ml-4 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              playground · live engine · scroll inside
            </span>
          </div>

          <div data-lenis-prevent className="relative h-[80vh]">
            {shouldMount ? (
              <Suspense
                fallback={
                  <div className="h-full w-full bg-slate-900 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-slate-600">
                    warming up the engine…
                  </div>
                }
              >
                <LazyPreviewPanel schema={DEMO_SCHEMA} embedded />
              </Suspense>
            ) : (
              <div className="h-full w-full bg-slate-900" />
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
            2 scenes · 4 elements · 450vh of scroll
          </p>
          <a href="/studio" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
            That wasn't a video. Remix it in the studio →
          </a>
        </div>
      </div>
    </section>
  );
}

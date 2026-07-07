import { useLandingScroll } from './useLandingScroll';
import { HeroCanvas } from './HeroCanvas';
import { Nav } from './sections/Nav';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';
import { LiveDemo } from './sections/LiveDemo';
import { Features } from './sections/Features';
import { Pricing } from './sections/Pricing';
import { Testimonials } from './sections/Testimonials';
import { FinalCta } from './sections/FinalCta';
import { Footer } from './sections/Footer';

// Film-grain overlay for atmosphere; pure CSS, no request.
const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

/**
 * Marketing page, dogfooded on the product's own stack: window Lenis + GSAP
 * ScrollTrigger drive the DOM, a fixed demand-frameloop R3F canvas carries the
 * scroll-orb across sections, and the LiveDemo section mounts the real
 * PreviewPanel engine.
 */
export default function LandingPage() {
  const { engines, progressRef, reducedMotion } = useLandingScroll();

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-clip">
      <HeroCanvas lenis={engines?.lenis ?? null} progress={progressRef.current} />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[5] opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_URI }}
      />

      <Nav engines={engines} />

      <main className="relative z-10">
        <Hero engines={engines} reducedMotion={reducedMotion} />
        <HowItWorks engines={engines} reducedMotion={reducedMotion} />
        <LiveDemo engines={engines} />
        <Features engines={engines} reducedMotion={reducedMotion} />
        <Pricing />
        <Testimonials />
        <FinalCta engines={engines} reducedMotion={reducedMotion} />
      </main>

      <Footer />
    </div>
  );
}

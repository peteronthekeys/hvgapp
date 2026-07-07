import { useEffect, useState } from 'react';
import type { LandingEngines } from '../useLandingScroll';

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#playground', label: 'Playground' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
];

export function Nav({ engines }: { engines: LandingEngines | null }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchor = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!engines) return; // native jump is the reduced-motion behavior
    event.preventDefault();
    engines.lenis.scrollTo(href, { offset: -8 });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
        scrolled
          ? 'bg-slate-950/70 backdrop-blur-md border-b border-slate-800/70'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav aria-label="Main navigation" className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-display text-base md:text-lg tracking-tight text-slate-100 whitespace-nowrap">
          Animation Studio <span className="text-teal-400">Pro</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={e => handleAnchor(e, link.href)}
              className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="/studio"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold px-4 py-2 transition-colors"
        >
          Open Studio
          <span aria-hidden="true">→</span>
        </a>
      </nav>
    </header>
  );
}

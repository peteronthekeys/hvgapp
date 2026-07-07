export function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-800/60 px-6 py-10">
      <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-6">
        <span className="font-display text-sm text-slate-300">
          Animation Studio <span className="text-teal-400">Pro</span>
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-6 text-xs text-slate-500">
          <a href="#how" className="hover:text-slate-300 transition-colors">
            How it works
          </a>
          <a href="#playground" className="hover:text-slate-300 transition-colors">
            Playground
          </a>
          <a href="#pricing" className="hover:text-slate-300 transition-colors">
            Pricing
          </a>
          <a href="/studio" className="hover:text-slate-300 transition-colors">
            Studio
          </a>
          <a href="mailto:hello@animationstudio.pro" className="hover:text-slate-300 transition-colors">
            hello@animationstudio.pro
          </a>
        </nav>
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
          © 2026 · built with its own engine
        </span>
      </div>
    </footer>
  );
}

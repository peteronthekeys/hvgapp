const QUOTES = [
  {
    quote:
      'We replaced a week of GSAP hand-tuning with a paragraph of English. The schema the AI writes is the same one my engineers would have — just faster and less grumpy.',
    name: 'Mara Chen',
    role: 'Design Engineer, Fieldnote Studio',
    initials: 'MC',
    big: true,
  },
  {
    quote: 'The AI edits the schema, not a video. That distinction is the entire product.',
    name: 'Tomás Rivera',
    role: 'Creative Director, Parallax&Co',
    initials: 'TR',
    big: false,
  },
  {
    quote: 'First tool where the 3D preview is the deliverable, not a mockup of it.',
    name: 'Ada Okafor',
    role: 'Freelance Motion Developer',
    initials: 'AO',
    big: false,
  },
];

const WORDMARKS = ['FIELDNOTE', 'PARALLAX&CO', 'ORBITAL', 'KILTER', 'NORTHFORM'];

export function Testimonials() {
  const [lead, ...rest] = QUOTES;

  return (
    <section aria-label="Testimonials" className="relative px-6 py-28 border-t border-slate-800/60">
      <div className="mx-auto max-w-6xl">
        <figure className="max-w-3xl">
          <blockquote className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-snug text-slate-100">
            “{lead.quote}”
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <Avatar initials={lead.initials} />
            <div>
              <div className="text-sm font-semibold text-slate-200">{lead.name}</div>
              <div className="text-xs text-slate-500">{lead.role}</div>
            </div>
          </figcaption>
        </figure>

        <div className="mt-12 grid md:grid-cols-2 gap-4 max-w-4xl">
          {rest.map(item => (
            <figure key={item.name} className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
              <blockquote className="text-sm text-slate-300 leading-relaxed">“{item.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <Avatar initials={item.initials} />
                <div>
                  <div className="text-sm font-semibold text-slate-200">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-600 mb-6">
            trusted by teams who ship scroll
          </p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {WORDMARKS.map(mark => (
              <span
                key={mark}
                className="font-display font-bold text-lg tracking-widest text-slate-700 select-none"
              >
                {mark}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 font-mono text-[11px] text-teal-400">
      {initials}
    </span>
  );
}

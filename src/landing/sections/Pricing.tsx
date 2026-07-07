const TIERS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    blurb: 'Kick the tires. Ship something small.',
    features: ['3 projects', 'Text + cube elements', 'AI chat editing (daily cap)', 'Community support'],
    cta: 'Start free',
    href: '/studio',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$19',
    cadence: '/month',
    blurb: 'For people who ship scroll stories weekly.',
    features: [
      'Unlimited projects',
      'GLB model imports',
      'Unlimited AI chat editing',
      'Bloom + vignette polish suite',
      'Priority render queue',
    ],
    cta: 'Go Pro',
    href: '/studio',
    featured: true,
  },
  {
    name: 'Studio',
    price: '$49',
    cadence: '/month',
    blurb: 'For teams with a motion pipeline.',
    features: [
      'Everything in Pro',
      '5 seats included',
      'Custom model library',
      'Export early access',
      'Priority support',
    ],
    cta: 'Talk to us',
    href: 'mailto:hello@animationstudio.pro',
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" aria-label="Pricing" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-teal-400 mb-4">
          pricing
        </p>
        <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-slate-100">
          Simple pricing. Serious scroll.
        </h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {TIERS.map(tier => (
            <article
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-colors ${
                tier.featured
                  ? 'border-teal-500/70 bg-slate-900 ring-1 ring-teal-500/40 md:-translate-y-3'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-6 font-mono text-[9px] uppercase tracking-widest bg-teal-500 text-slate-950 rounded-full px-3 py-1 font-semibold">
                  most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-100">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display font-bold text-5xl text-slate-100">{tier.price}</span>
                <span className="text-sm text-slate-500">{tier.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{tier.blurb}</p>
              <ul className="mt-6 space-y-2.5 text-sm text-slate-300 flex-1">
                {tier.features.map(feature => (
                  <li key={feature} className="flex gap-2.5">
                    <span className="text-teal-400" aria-hidden="true">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={tier.href}
                className={`mt-8 inline-flex justify-center rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                  tier.featured
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                    : 'border border-slate-700 hover:border-slate-500 text-slate-200'
                }`}
              >
                {tier.cta}
              </a>
            </article>
          ))}
        </div>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-slate-600">
          no card required for free · cancel anytime
        </p>
      </div>
    </section>
  );
}

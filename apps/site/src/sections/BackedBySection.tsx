const partners = [
  {
    id: 'hyperframes',
    name: 'HyperFrames',
    href: 'https://github.com/heygen-com/hyperframes',
    logo: '/logos/hyperframes.png',
    logoAlt: 'HeyGen HyperFrames',
  },
  {
    id: 'ai-hacker-house',
    name: 'AI Hacker House',
    href: 'https://crossingpodcast.com',
    logo: '/logos/crossing-podcast.png',
    logoAlt: 'AI Hacker House',
  },
  {
    id: 'effector',
    name: 'Effector',
    href: 'https://effector.wtf/',
    logo: '/logos/effector.png',
    logoAlt: 'Effector',
  },
  {
    id: 'loupe',
    name: 'loupe',
    href: 'https://github.com/Jah-yee/loupe/',
    logo: '/logos/loupe.png',
    logoAlt: 'loupe',
  },
] as const;

export default function BackedBySection() {
  const builtAround = partners.filter((p) => p.id !== 'ai-hacker-house');
  const builtAt = partners.filter((p) => p.id === 'ai-hacker-house');

  const renderPartner = (p: (typeof partners)[number]) => (
    <a
      key={p.id}
      href={p.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-3 w-[10.5rem] rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
    >
      <span className="relative flex h-16 w-full max-w-[12rem] items-center justify-center px-2">
        <img src={p.logo} alt={p.logoAlt} className="max-h-14 w-auto max-w-full object-contain" loading="lazy" decoding="async" />
      </span>
      <span className="text-center text-sm font-medium text-secondary-foreground underline-offset-2 group-hover:underline">
        {p.name}
      </span>
    </a>
  );

  return (
    <section className="py-16 px-4 border-t border-border bg-card">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-6">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">Built around:</p>
          <div className="flex flex-wrap items-start justify-center gap-12 md:gap-16">{builtAround.map(renderPartner)}</div>
        </div>
        <div className="space-y-6">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">Built at:</p>
          <div className="flex items-start justify-center">{builtAt.map(renderPartner)}</div>
        </div>
      </div>
    </section>
  );
}

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border shadow-[0_0_0_1px_rgba(209,207,197,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#top" className="flex items-center">
            <span className="font-brand text-[1.3125rem] md:text-[1.4rem] font-bold tracking-[-0.02em] text-foreground">
              Wittgenstein
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#s-thesis" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Research
            </a>
            <a href="#s-layers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Layers
            </a>
            <a href="#s-pipeline" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pipeline
            </a>
            <a href="#s-codecs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Codecs
            </a>
            <a
              href="#footer-cta"
              className="text-sm px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-[0_0_0_1px_hsl(var(--primary))] hover:opacity-90 transition-opacity"
            >
              Start
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <a
          href="#top"
          className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3"
        >
          <span className="truncate text-lg font-bold leading-none tracking-[0.12em] text-navy sm:text-xl">
            PRAWDOWID
          </span>
          <span className="inline-flex w-fit shrink-0 bg-mist px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-navy sm:px-2 sm:py-1 sm:text-[10px]">
            Hackathon 2026
          </span>
        </a>

        <nav aria-label="Nawigacja" className="flex shrink-0 items-center gap-1 sm:gap-2">
          <a
            href="#top"
            className="inline-flex h-10 items-center px-3 text-xs font-semibold uppercase tracking-[0.08em] text-navy transition-colors hover:bg-mist"
          >
            Na górę
          </a>
          <a
            href="#o-nas"
            className="btn btn-accent h-10 min-h-0 px-4 text-xs"
          >
            O nas
          </a>
        </nav>
      </div>
    </header>
  );
}

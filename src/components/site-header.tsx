"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const pathname = usePathname();
  const isDocumentation = pathname === "/dokumentacja";
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 120);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <a
            href="/"
            className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3"
          >
            <span className="truncate text-lg font-bold leading-none tracking-[0.12em] text-navy sm:text-xl">
              PRAWDO<span className="text-crimson">WID</span>
            </span>
            <span className="hidden w-fit shrink-0 bg-mist px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-navy sm:inline-flex sm:px-2 sm:py-1 sm:text-[10px]">
              Hackathon 2026
            </span>
          </a>

          <nav
            aria-label="Nawigacja"
            className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          >
            <a
              href="/#o-nas"
              className="btn btn-primary btn-outline h-10 min-h-0 whitespace-nowrap border border-navy px-1.5 text-[10px] min-[400px]:px-3 min-[400px]:text-[10px] sm:px-4 sm:text-xs"
            >
              O nas
            </a>
            <a
              href="/dokumentacja"
              aria-current={isDocumentation ? "page" : undefined}
              className={`btn h-10 min-h-0 whitespace-nowrap px-1.5 text-[10px] min-[400px]:px-3 min-[400px]:text-[10px] sm:px-4 sm:text-xs ${
                isDocumentation ? "btn-primary" : "btn-accent"
              }`}
            >
              Dokumentacja
            </a>
          </nav>
        </div>
      </header>

      {showBackToTop && (
        <a
          href="#top"
          aria-label="Wróć na górę"
          title="Na górę"
          className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center bg-navy text-white shadow-lg transition-colors hover:bg-crimson focus-visible:outline-crimson sm:bottom-8 sm:right-8"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
          >
            <path
              d="M12 19V5M5 12l7-7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </a>
      )}
    </>
  );
}

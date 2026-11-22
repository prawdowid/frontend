import type { Metadata } from "next";

import {
  Documentation,
  DocumentationFooter,
} from "@/components/documentation";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Dokumentacja | PRAWDOWID",
  description:
    "Architektura, kontrakt API, przepływ żądania, koszty i ograniczenia systemu PRAWDOWID.",
};

export default function DocumentationPage() {
  return (
    <div id="top" className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Przejdź do treści
      </a>

      <SiteHeader />

      <main id="main-content">
        <Documentation />
      </main>

      <DocumentationFooter />
    </div>
  );
}

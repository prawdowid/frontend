"use client";

import { useRef, useState } from "react";

import { AboutSection } from "@/components/about-section";
import { AnalysisResult } from "@/components/analysis-result";
import { InputPanel } from "@/components/input-panel";
import { SiteHeader } from "@/components/site-header";
import { submitForAnalysis } from "@/services/analyzeService";
import type { AnalysisPayload } from "@/types/analysis";
import type { AnalysisState } from "@/types/ui";

export default function HomePage() {
  const [state, setState] = useState<AnalysisState>({ status: "idle" });
  const resultRef = useRef<HTMLElement>(null);

  async function handleAnalyze(payload: AnalysisPayload) {
    setState({ status: "loading" });

    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    try {
      const result = await submitForAnalysis(payload);
      setState({ status: "success", result });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się przetworzyć materiału.",
      });
    }
  }

  function handleReset() {
    setState({ status: "idle" });

    window.setTimeout(() => {
      document.getElementById("panel-heading")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 40);
  }

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
        <section
          aria-labelledby="workspace-heading"
          className="bg-mist py-12 sm:py-16 lg:py-20"
        >
          <div className="shell">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16">
              <div className="max-w-xl lg:pt-4">
                <h1
                  id="workspace-heading"
                  className="max-w-[10ch] text-[clamp(2.75rem,5.5vw,4.75rem)] font-bold leading-[0.98] tracking-[-0.04em] text-navy"
                >
                  Sprawdź, co jest prawdą.
                </h1>

                <span className="accent-rule" aria-hidden="true" />

                <ul className="mt-8 max-w-md space-y-3 border-t border-line pt-6">
                  {[
                    "Tekst, link lub plik",
                    "Analiza kontekstu i źródeł",
                    "Ocena i źródła",
                  ].map((item, index) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-muted"
                    >
                      <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-crimson">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full">
                <InputPanel
                  isLoading={state.status === "loading"}
                  onSubmit={handleAnalyze}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="wynik"
          ref={resultRef}
          className="scroll-mt-20 bg-white py-14 sm:py-16"
        >
          <div className="shell">
            <AnalysisResult state={state} onReset={handleReset} />
          </div>
        </section>

        <AboutSection />
      </main>
    </div>
  );
}

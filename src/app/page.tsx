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
            <h1
              id="workspace-heading"
              className="mx-auto max-w-4xl text-center text-[clamp(2.75rem,7vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-navy"
            >
              Sprawdź, co jest prawdą.
            </h1>

            <div className="mx-auto mt-8 w-full max-w-[720px] sm:mt-10">
              <InputPanel
                isLoading={state.status === "loading"}
                onSubmit={handleAnalyze}
              />
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

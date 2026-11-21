"use client";

import type { AnalysisVerdict } from "@/types/analysis";
import type { AnalysisState } from "@/types/ui";

const VERDICT_META: Record<
  AnalysisVerdict,
  { label: string; badge: string; bar: string }
> = {
  credible: {
    label: "Wiarygodne",
    badge: "bg-navy text-white",
    bar: "bg-navy",
  },
  misleading: {
    label: "Mylące",
    badge: "bg-[#B7791F] text-white",
    bar: "bg-[#B7791F]",
  },
  false: {
    label: "Fałszywe",
    badge: "bg-crimson text-white",
    bar: "bg-crimson",
  },
  inconclusive: {
    label: "Nierozstrzygnięte",
    badge: "bg-mist text-navy",
    bar: "bg-muted",
  },
};

interface AnalysisResultProps {
  state: AnalysisState;
  onReset: () => void;
}

export function AnalysisResult({ state, onReset }: AnalysisResultProps) {
  return (
    <section aria-labelledby="result-heading" aria-live="polite">
      <h2 id="result-heading" className="text-3xl font-bold text-navy sm:text-4xl">
        Wynik analizy
      </h2>
      <span className="accent-rule" aria-hidden="true" />

      <div className="mt-6">
        {state.status === "idle" && <IdleState />}
        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && (
          <ErrorState message={state.message} onReset={onReset} />
        )}
        {state.status === "success" && (
          <SuccessState state={state} onReset={onReset} />
        )}
      </div>
    </section>
  );
}

function IdleState() {
  return (
    <div className="bg-mist p-6">
      <p className="font-semibold text-navy">Brak analizy</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Wyślij materiał w panelu powyżej. Wynik pojawi się w tym miejscu.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-busy="true" className="bg-mist p-6">
      <p className="font-semibold text-navy">Analizuję materiał</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Sprawdzam źródła, kontekst i spójność danych.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onReset,
}: {
  message: string;
  onReset: () => void;
}) {
  return (
    <div role="alert" className="bg-mist p-6">
      <p className="font-semibold text-crimson">Analiza nie powiodła się</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onReset}
        className="btn btn-primary btn-sm mt-5 h-9 min-h-0 px-4 text-xs"
      >
        Wróć do formularza
      </button>
    </div>
  );
}

function SuccessState({
  state,
  onReset,
}: {
  state: Extract<AnalysisState, { status: "success" }>;
  onReset: () => void;
}) {
  const { result } = state;
  const meta = VERDICT_META[result.verdict];
  const score = Math.min(100, Math.max(0, Math.round(result.confidenceScore)));

  return (
    <article className="border border-line bg-white shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="p-6 sm:p-8">
          <span
            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${meta.badge}`}
          >
            {meta.label}
          </span>

          <p className="mt-5 text-xl font-semibold leading-snug text-navy sm:text-2xl">
            {result.summary}
          </p>

          <h3 className="mt-7 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Ustalenia i źródła
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-navy marker:text-crimson">
            {result.details.map((detail, index) => (
              <li key={`${index}-${detail}`}>{detail}</li>
            ))}
          </ul>
        </div>

        <aside className="border-t border-line bg-mist p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Poziom pewności
          </p>
          <p className="mt-2 text-5xl font-bold leading-none text-navy">
            {score}
            <span className="text-2xl">%</span>
          </p>
          <div
            className="mt-4 h-1.5 w-full bg-white"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            aria-label="Poziom pewności"
          >
            <div className={`h-full ${meta.bar}`} style={{ width: `${score}%` }} />
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            {formatTimestamp(result.timestamp)}
          </p>

          <button
            type="button"
            onClick={onReset}
            className="btn btn-primary mt-6 h-10 min-h-0 w-full text-xs"
          >
            Nowa analiza
          </button>
        </aside>
      </div>
    </article>
  );
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak daty";

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

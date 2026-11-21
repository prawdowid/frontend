"use client";

import type { FactCheckResult, Verdict } from "@/types/analysis";
import type { AnalysisState } from "@/types/ui";

const VERDICT_META: Record<Verdict, { label: string; badge: string }> = {
  supported: {
    label: "Potwierdzone przez źródła",
    badge: "bg-navy text-white",
  },
  contradicted: {
    label: "Obalone przez źródła",
    badge: "bg-crimson text-white",
  },
  unclear: {
    label: "Brak jednoznacznych danych",
    badge: "bg-mist text-navy",
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

  return (
    <article className="border border-line bg-white shadow-sm">
      <div className="border-b border-line bg-mist p-6 sm:p-8">
        <p className="font-semibold text-navy">
          {result.status === "completed"
            ? `Sprawdzono: ${result.facts.length} ${pluralizeClaims(result.facts.length)}`
            : "Nie znaleziono sprawdzalnych twierdzeń"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{result.message}</p>
        {result.source && (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Źródło:{" "}
            {isHttpUrl(result.source.url) ? (
              <a
                href={result.source.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-navy underline"
              >
                {result.source.url}
              </a>
            ) : (
              result.source.url
            )}{" "}
            · pobrano przez {result.source.retrievedWith}
          </p>
        )}
      </div>

      {result.facts.length > 0 && (
        <div className="space-y-4 p-4 sm:p-6">
          {result.facts.map((fact, index) => (
            <FactCard key={`${fact.claim}-${index}`} fact={fact} />
          ))}
        </div>
      )}

      <div className="p-6 pt-0 sm:px-8 sm:pb-8">
        <button
          type="button"
          onClick={onReset}
          className="btn btn-primary h-10 min-h-0 w-full text-xs"
        >
          Nowa analiza
        </button>
      </div>
    </article>
  );
}

function FactCard({ fact }: { fact: FactCheckResult }) {
  const meta = VERDICT_META[fact.verdict];

  return (
    <article className="border border-line p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold ${meta.badge}`}
        >
          {meta.label}
        </span>
        {fact.cacheHit && (
          <span className="text-xs text-muted">Wynik z pamięci podręcznej</span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-navy">
        {fact.question}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-navy">{fact.summary}</p>

      {fact.reviews.length > 0 && (
        <section className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Opublikowane weryfikacje
          </h4>
          <ul className="mt-2 space-y-3">
            {fact.reviews.map((review, index) => {
              const title =
                review.title
                ?? review.matchedClaim
                ?? review.publisher?.name
                ?? "Opublikowana weryfikacja";

              return (
                <li
                  key={`${review.url ?? title}-${index}`}
                  className="border-l-2 border-crimson pl-3 text-sm"
                >
                  {isHttpUrl(review.url) ? (
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-navy underline"
                    >
                      {title}
                    </a>
                  ) : (
                    <p className="font-medium text-navy">{title}</p>
                  )}
                  {review.publisher?.name && (
                    <p className="mt-1 text-xs text-muted">
                      Wydawca: {review.publisher.name}
                    </p>
                  )}
                  {review.textualRating && (
                    <p className="mt-1 text-xs text-muted">
                      Ocena publikacji: {review.textualRating}
                    </p>
                  )}
                  {review.reviewDate && (
                    <p className="mt-1 text-xs text-muted">
                      Data publikacji: {review.reviewDate}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {fact.sources.length > 0 && (
        <section className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Źródła
          </h4>
          <ul className="mt-2 space-y-3">
            {fact.sources.map((source) => (
              <li
                key={source.url}
                className="border-l-2 border-navy pl-3 text-sm"
              >
                {isHttpUrl(source.url) ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-navy underline"
                  >
                    {source.title}
                  </a>
                ) : (
                  <p className="font-medium text-navy">{source.title}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {source.domain}
                  {source.trusted ? " · zaufane źródło" : ""}
                </p>
                {source.excerpt && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {source.excerpt}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {fact.providerErrors.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs leading-relaxed text-crimson">
          {fact.providerErrors.map((error, index) => (
            <li key={`${index}-${error}`}>{error}</li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Sprawdzono: {formatTimestamp(fact.checkedAt)}
      </p>
    </article>
  );
}

function pluralizeClaims(count: number): string {
  if (count === 1) return "twierdzenie";
  const lastTwo = count % 100;
  const last = count % 10;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
    ? "twierdzenia"
    : "twierdzeń";
}

function isHttpUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak daty";

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

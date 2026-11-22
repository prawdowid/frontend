import type {
  AnalysisResponse,
  AnalysisVerdict,
} from "@/types/analysis";

/**
 * Contract implemented by the PRAWDOWID backend (`backend/src/pipeline/types.ts`).
 * Keep this in sync with `POST /verify`; the frontend deliberately maps it to its
 * own, smaller `AnalysisResponse` instead of leaking backend internals into the UI.
 */
export type BackendVerdict =
  | "confirmed"
  | "false"
  | "misleading"
  | "insufficient_evidence"
  | "not_verifiable";

export type BackendEvidence = {
  title: string;
  publisher: string;
  publishedAt: string | null;
  retrievedAt: string;
  url: string;
  excerpt: string;
  type: "primary" | "secondary" | "fact_check";
  relation: "supports" | "refutes" | "context";
};

export type BackendClaimVerdict = {
  id: string;
  claim: string;
  verdict: BackendVerdict;
  confidence: number;
  strength: "high" | "medium" | "low";
  reasoning: string;
  evidence: BackendEvidence[];
  limitations: string[];
  asOf: string;
  cached: boolean;
};

export type BackendVerifyResponse = {
  status: "ok" | "error" | "needs_clarification" | "out_of_scope";
  language?: "pl";
  input?: { kind: "text" | "url"; preview: string };
  summary: string;
  claims: BackendClaimVerdict[];
  limitations: string[];
  timingMs?: number;
  costUsd?: number;
  models?: string[];
  sourcesUsed?: string[];
  sessionId?: string;
  disclaimer?: string;
};

const VERDICT_LABELS: Record<BackendVerdict, string> = {
  confirmed: "Potwierdzone",
  false: "Fałszywe",
  misleading: "Wprowadzające w błąd",
  insufficient_evidence: "Brak wystarczających dowodów",
  not_verifiable: "Nie podlega weryfikacji",
};

const RELATION_LABELS: Record<BackendEvidence["relation"], string> = {
  supports: "potwierdza",
  refutes: "przeczy",
  context: "kontekst",
};

const MAX_DETAILS = 30;
const MAX_EVIDENCE_PER_CLAIM = 2;

/** Old cache entries stored the English predicate; new ones are already Polish. */
const POLISH_PREDICATES: Record<string, string> = {
  status: "jest",
  is: "jest",
  was: "był",
  has: "ma",
  is_capital_of: "jest stolicą",
  capital_of: "jest stolicą",
  joined: "przystąpiła do",
  membership: "należy do",
  borders: "graniczy z",
  resigned_from_position: "zrezygnował z funkcji",
  regained_independence: "odzyskała niepodległość",
  spending_on_transport: "wydatki na transport",
  destroyed: "zniszczony",
  count: "liczba",
  won: "wygrał",
  lost: "przegrał",
  will_be: "będzie",
  announced: "ogłosił",
  signed: "podpisał",
  attacked: "zaatakował",
  killed: "zabił",
  died: "zmarł",
  arrested: "aresztował",
  elected: "wybrany",
  appointed: "mianowany",
  introduced: "wprowadził",
  increased: "wzrosła",
  decreased: "spadła",
};

const POLISH_KEEP = new Set([
  "jest",
  "był",
  "ma",
  "jest stolicą",
  "przystąpiła do",
  "członkostwo w",
  "należy do",
  "graniczy z",
  "zrezygnował z funkcji",
  "odzyskała niepodległość",
  "wydatki na transport",
  "zniszczony",
  "liczba",
  "wygrał",
  "przegrał",
  "będzie",
  "ogłosił",
  "podpisał",
  "zaatakował",
  "zabił",
  "zmarł",
  "aresztował",
  "wybrany",
  "mianowany",
  "wprowadził",
  "wzrosła",
  "spadła",
  "dotyczy",
]);

function formatClaim(value: string): string {
  const parts = value.split(/\s+[—–-]\s+/);
  if (parts.length !== 3) return value;

  const [subject, predicate, object] = parts.map((part) => part.trim());
  const key = predicate.toLowerCase().replace(/\s+/g, "_");
  const translated = POLISH_PREDICATES[key];

  if (translated) return `${subject} — ${translated} — ${object}`;
  if (POLISH_KEEP.has(predicate.toLowerCase())) return value;

  // Do not show an untranslated English predicate from an old cache entry.
  return `${subject} — ${object}`;
}

function cleanEvidenceTitle(value: string): string {
  return value
    .replace(/[*_`#>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class BackendAnalysisError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "BackendAnalysisError";
  }
}

/**
 * Converts the backend verdict/claims contract into the shape rendered by
 * `AnalysisResult`.
 */
export function mapVerifyResponse(data: BackendVerifyResponse): AnalysisResponse {
  if (data.status !== "ok") {
    throw new BackendAnalysisError(
      data.summary || "Backend nie zwrócił werdyktu.",
      422,
    );
  }

  const claims = Array.isArray(data.claims) ? data.claims : [];
  const details: string[] = [];

  for (const claim of claims) {
    const label = VERDICT_LABELS[claim.verdict] ?? "Nieznany wynik";
    const reasoning = claim.reasoning?.trim();
    details.push(
      `${label}: ${formatClaim(claim.claim)}${reasoning ? ` - ${reasoning}` : ""}`,
    );

    for (const evidence of (claim.evidence ?? []).slice(0, MAX_EVIDENCE_PER_CLAIM)) {
      const relation = RELATION_LABELS[evidence.relation] ?? "źródło";
      const title = evidence.title
        ? `„${cleanEvidenceTitle(evidence.title)}”`
        : "źródło";
      details.push(
        `Źródło (${relation}): ${evidence.publisher || "nieznany wydawca"}, ${title} - ${evidence.url}`,
      );
    }

    if (details.length >= MAX_DETAILS) break;
  }

  return {
    verdict: overallVerdict(claims),
    confidenceScore: averageConfidence(claims),
    summary: data.summary || "Brak podsumowania.",
    details,
    timestamp: new Date().toISOString(),
  };
}

function overallVerdict(claims: BackendClaimVerdict[]): AnalysisVerdict {
  if (claims.length === 0) return "inconclusive";
  if (claims.some((claim) => claim.verdict === "false")) return "false";
  if (claims.some((claim) => claim.verdict === "misleading")) return "misleading";
  if (claims.every((claim) => claim.verdict === "confirmed")) return "credible";
  return "inconclusive";
}

function averageConfidence(claims: BackendClaimVerdict[]): number {
  if (claims.length === 0) return 0;

  const verdict = overallVerdict(claims);

  // An abstention is not a confident verdict. Never show more than 10%.
  if (verdict === "inconclusive") {
    return 5;
  }

  const decisive =
    verdict === "credible"
      ? claims.filter((claim) => claim.verdict === "confirmed")
      : claims.filter((claim) => claim.verdict === verdict);

  const values = decisive
    .map((claim) => claim.confidence)
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return 5;

  // "Wiarygodne" requires every claim to be confirmed, so the weakest one
  // limits the score. One strong false/misleading claim is enough to decide.
  const raw =
    verdict === "credible" ? Math.min(...values) : Math.max(...values);

  return Math.min(99, Math.max(0, Math.round(raw * 100)));
}

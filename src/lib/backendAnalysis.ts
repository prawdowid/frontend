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
      `${label}: ${claim.claim}${reasoning ? ` - ${reasoning}` : ""}`,
    );

    for (const evidence of (claim.evidence ?? []).slice(0, MAX_EVIDENCE_PER_CLAIM)) {
      const relation = RELATION_LABELS[evidence.relation] ?? "źródło";
      const title = evidence.title ? `„${evidence.title}”` : "źródło";
      details.push(
        `Źródło (${relation}): ${evidence.publisher || "nieznany wydawca"}, ${title} - ${evidence.url}`,
      );
    }

    if (details.length >= MAX_DETAILS) break;
  }

  for (const limitation of data.limitations ?? []) {
    if (details.length >= MAX_DETAILS) break;
    details.push(`Ograniczenie: ${limitation}`);
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
  const values = claims
    .map((claim) => claim.confidence)
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return 0;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.min(100, Math.max(0, Math.round(average * 100)));
}

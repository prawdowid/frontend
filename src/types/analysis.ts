export type AnalysisInputType = "text" | "link" | "file";

export type FactCheckStatus =
  | "review_found"
  | "sources_found"
  | "no_evidence_found";

export type ProviderStatus = "available" | "not_configured" | "unavailable";

export type Verdict = "supported" | "contradicted" | "unclear";

export interface AnalysisPayload {
  type: AnalysisInputType;
  text?: string;
  url?: string;
  file?: File;
}

export interface FactCheckReview {
  matchedClaim?: string;
  publisher?: {
    name?: string;
    site?: string;
  };
  url?: string;
  title?: string;
  reviewDate?: string;
  textualRating?: string;
  languageCode?: string;
}

export interface TrustedSource {
  title: string;
  url: string;
  domain: string;
  trusted: boolean;
  excerpt?: string;
}

export interface FactCheckResult {
  claim: string;
  question: string;
  status: FactCheckStatus;
  statusMessage: string;
  verdict: Verdict;
  summary: string;
  reviews: FactCheckReview[];
  sources: TrustedSource[];
  providers: {
    googleFactCheck: ProviderStatus;
    jinaSearch: ProviderStatus;
  };
  providerMessages: {
    googleFactCheck: string;
    jinaSearch: string;
  };
  providerErrors: string[];
  checkedAt: string;
  cacheHit: boolean;
}

export interface AnalysisResponse {
  ok: true;
  status: "completed" | "no_facts";
  message: string;
  facts: FactCheckResult[];
  source?: {
    url: string;
    retrievedWith: string;
  };
}

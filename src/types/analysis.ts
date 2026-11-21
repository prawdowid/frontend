export type AnalysisInputType = "text" | "link" | "file";

export type AnalysisVerdict =
  | "credible"
  | "misleading"
  | "false"
  | "inconclusive";

export interface AnalysisPayload {
  type: AnalysisInputType;
  text?: string;
  url?: string;
  file?: File;
}

export interface AnalysisResponse {
  verdict: AnalysisVerdict;
  confidenceScore: number;
  summary: string;
  details: string[];
  timestamp: string;
}

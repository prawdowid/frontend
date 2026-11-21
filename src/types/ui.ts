import type { AnalysisResponse } from "@/types/analysis";

export type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: AnalysisResponse }
  | { status: "error"; message: string };

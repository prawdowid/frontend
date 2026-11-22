import type {
  AnalysisPayload,
  AnalysisResponse,
  AnalysisVerdict,
} from "@/types/analysis";

const ANALYSIS_ENDPOINT =
  process.env.NEXT_PUBLIC_ANALYSIS_API_URL ?? "/api/analyze";

/**
 * Sends the material to our own `/api/analyze` route, which proxies the
 * PRAWDOWID backend and maps its verdict contract to `AnalysisResponse`.
 */
export async function submitForAnalysis(
  payload: AnalysisPayload,
): Promise<AnalysisResponse> {
  validatePayload(payload);

  if (payload.type === "file") {
    const file = payload.file;
    if (!file) {
      throw new Error("Dodaj plik do analizy.");
    }

    const formData = new FormData();
    formData.append("type", payload.type);
    formData.append("file", file);

    const response = await fetch(ANALYSIS_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });

    return parseResponse(response);
  }

  const response = await fetch(ANALYSIS_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: payload.type,
      text: payload.text,
      url: payload.url,
    }),
  });

  return parseResponse(response);
}

function validatePayload(payload: AnalysisPayload): void {
  if (payload.type === "text" && !payload.text?.trim()) {
    throw new Error("Wklej tekst do analizy.");
  }

  if (payload.type === "link" && !payload.url?.trim()) {
    throw new Error("Podaj adres URL.");
  }

  if (payload.type === "file" && !payload.file) {
    throw new Error("Dodaj plik do analizy.");
  }
}

async function parseResponse(response: Response): Promise<AnalysisResponse> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as Partial<AnalysisResponse>;
  const validVerdicts: AnalysisVerdict[] = [
    "credible",
    "misleading",
    "false",
    "inconclusive",
  ];

  if (
    !data.verdict ||
    !validVerdicts.includes(data.verdict) ||
    typeof data.confidenceScore !== "number" ||
    typeof data.summary !== "string" ||
    !Array.isArray(data.details) ||
    !data.details.every((detail) => typeof detail === "string") ||
    typeof data.timestamp !== "string"
  ) {
    throw new Error("Backend zwrócił nieprawidłowy format odpowiedzi.");
  }

  return data as AnalysisResponse;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string; error?: string };
    return data.message ?? data.error ?? `Błąd serwera (HTTP ${response.status}).`;
  } catch {
    return `Błąd serwera (HTTP ${response.status}).`;
  }
}

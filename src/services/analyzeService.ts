import type {
  AnalysisPayload,
  AnalysisResponse,
  AnalysisVerdict,
} from "@/types/analysis";

const USE_MOCK = true;
const MOCK_DELAY_MS = 1500;
const ANALYSIS_ENDPOINT =
  process.env.NEXT_PUBLIC_ANALYSIS_API_URL ?? "/api/analyze";

// TODO: BACKEND INTEGRATION
// 1. Change USE_MOCK to false.
// 2. Set NEXT_PUBLIC_ANALYSIS_API_URL.
// 3. JSON for "text" / "link": { type, text?, url? }.
// 4. FormData for "file": fields "type" and "file".
// 5. Response must match AnalysisResponse.
export async function submitForAnalysis(
  payload: AnalysisPayload,
): Promise<AnalysisResponse> {
  validatePayload(payload);

  if (USE_MOCK) {
    await sleep(MOCK_DELAY_MS);
    return buildMockResponse(payload);
  }

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

interface MockScenario {
  verdict: AnalysisVerdict;
  confidence: [number, number];
  summary: string;
  details: string[];
}

const MOCK_SCENARIOS: MockScenario[] = [
  {
    verdict: "credible",
    confidence: [84, 95],
    summary:
      "Treść pokrywa się z dostępnymi źródłami. Nie znaleziono sygnałów manipulacji.",
    details: [
      "Główna teza ma potwierdzenie w dwóch niezależnych źródłach.",
      "Daty, liczby i cytaty są zgodne z materiałem źródłowym.",
      "Brak wyciętego kontekstu i emocjonalnych nagłówków.",
      "Źródła: Reuters Fact Check, Demagog.",
    ],
  },
  {
    verdict: "misleading",
    confidence: [66, 82],
    summary:
      "Fakty się zgadzają, ale kontekst został skrócony. Taki przekaz może prowadzić do błędnych wniosków.",
    details: [
      "Przytoczone dane pochodzą z prawdziwego badania.",
      "Pominięto okres i skalę, w których dane obowiązują.",
      "Nagłówek wyciąga wniosek szerszy niż materiał źródłowy.",
      "Źródła: AFP Fact Check, PolitiFact.",
    ],
  },
  {
    verdict: "false",
    confidence: [88, 97],
    summary:
      "Kluczowa teza nie znajduje potwierdzenia. Część danych jest sprzeczna ze źródłami pierwotnymi.",
    details: [
      "Centralna teza nie ma potwierdzenia w wiarygodnym źródle.",
      "Liczby różnią się od danych publikowanych w źródle pierwotnym.",
      "Brak autora, daty lub linku do materiału źródłowego.",
      "Źródła: FactCheck.org, IFCN.",
    ],
  },
  {
    verdict: "inconclusive",
    confidence: [38, 58],
    summary:
      "Za mało danych, aby wydać jednoznaczny werdykt. Potrzebny jest pełny materiał lub dodatkowy kontekst.",
    details: [
      "Liczba dostępnych źródeł pierwotnych jest zbyt mała.",
      "Fragment nie zawiera daty, autora ani początku wypowiedzi.",
      "Rekomendacja: analiza całego materiału i weryfikacja u źródła.",
      "Źródła: Google Fact Check Explorer.",
    ],
  },
];

function buildMockResponse(payload: AnalysisPayload): AnalysisResponse {
  const seed = Math.abs(hash(getFingerprint(payload)));
  const scenario = MOCK_SCENARIOS[seed % MOCK_SCENARIOS.length];
  const [min, max] = scenario.confidence;

  return {
    verdict: scenario.verdict,
    confidenceScore: min + (seed % (max - min + 1)),
    summary: scenario.summary,
    details: [...scenario.details, describePayload(payload)],
    timestamp: new Date().toISOString(),
  };
}

function getFingerprint(payload: AnalysisPayload): string {
  if (payload.type === "text") return payload.text?.trim() ?? "";
  if (payload.type === "link") return payload.url?.trim() ?? "";
  return `${payload.file?.name ?? ""}:${payload.file?.size ?? 0}`;
}

function describePayload(payload: AnalysisPayload): string {
  if (payload.type === "text") {
    return `Materiał: tekst, ${payload.text?.trim().length ?? 0} znaków.`;
  }

  if (payload.type === "link") {
    try {
      const host = new URL(payload.url ?? "").hostname.replace(/^www\./, "");
      return `Materiał: link, ${host}.`;
    } catch {
      return "Materiał: link.";
    }
  }

  return `Materiał: plik, ${payload.file?.name ?? "bez nazwy"}.`;
}

function hash(value: string): number {
  return value.split("").reduce((sum, char) => {
    return (sum * 31 + char.charCodeAt(0)) | 0;
  }, 7);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

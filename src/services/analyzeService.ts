import type {
  AnalysisPayload,
  AnalysisResponse,
  FactCheckResult,
  FactCheckReview,
  ProviderStatus,
  TrustedSource,
} from "@/types/analysis";

const ANALYSIS_ENDPOINT = "/api/process";
const MAX_IMAGE_BYTES = 6_000_000;
const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "heic",
  "heif",
]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v"]);

export async function submitForAnalysis(
  payload: AnalysisPayload,
): Promise<AnalysisResponse> {
  validatePayload(payload);

  if (payload.type === "text") {
    return postJson("text", { text: payload.text?.trim() ?? "" });
  }

  if (payload.type === "link") {
    return postJson("url", { url: payload.url?.trim() ?? "" });
  }

  const file = payload.file;
  if (!file) {
    throw new Error("Dodaj plik do analizy.");
  }
  if (isVideoFile(file)) {
    throw new Error("Analiza przesłanych plików wideo nie jest jeszcze dostępna.");
  }
  if (!isImageFile(file)) {
    throw new Error("Backend obsługuje obecnie tylko pliki graficzne.");
  }
  if (file.size === 0) {
    throw new Error("Wybrany plik jest pusty.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Maksymalny rozmiar obrazu to 6 MB.");
  }

  return postJson("image", { image: await fileToBase64(file) });
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

async function postJson(
  endpoint: "text" | "url" | "image",
  body: Record<string, string>,
): Promise<AnalysisResponse> {
  const response = await fetch(`${ANALYSIS_ENDPOINT}/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

async function parseResponse(response: Response): Promise<AnalysisResponse> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Backend zwrócił nieprawidłowy format odpowiedzi.");
  }

  if (
    isRecord(data)
    && data.ok === false
    && typeof data.error === "string"
  ) {
    throw new Error(data.error);
  }
  if (!isAnalysisResponse(data)) {
    throw new Error("Backend zwrócił nieprawidłowy format odpowiedzi.");
  }

  return data;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (isRecord(data)) {
      if (typeof data.error === "string") return data.error;
      if (typeof data.message === "string") return data.message;
    }
  } catch {
    return `Błąd serwera (HTTP ${response.status}).`;
  }

  return `Błąd serwera (HTTP ${response.status}).`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Nie udało się odczytać pliku."));
        return;
      }

      const separator = reader.result.indexOf(",");
      if (separator < 0) {
        reject(new Error("Nie udało się zakodować pliku."));
        return;
      }

      resolve(reader.result.slice(separator + 1));
    };
    reader.readAsDataURL(file);
  });
}

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/")
    || IMAGE_EXTENSIONS.has(getFileExtension(file))
  );
}

function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith("video/")
    || VIDEO_EXTENSIONS.has(getFileExtension(file))
  );
}

function getFileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (
    !isRecord(value)
    || value.ok !== true
    || (value.status !== "completed" && value.status !== "no_facts")
    || typeof value.message !== "string"
    || !Array.isArray(value.facts)
    || !value.facts.every(isFactCheckResult)
  ) {
    return false;
  }

  if (
    (value.status === "no_facts" && value.facts.length !== 0)
    || (value.status === "completed" && value.facts.length === 0)
  ) {
    return false;
  }

  return value.source === undefined || isSourceMetadata(value.source);
}

function isFactCheckResult(value: unknown): value is FactCheckResult {
  if (
    !isRecord(value)
    || typeof value.claim !== "string"
    || typeof value.question !== "string"
    || (value.status !== "review_found"
      && value.status !== "sources_found"
      && value.status !== "no_evidence_found")
    || typeof value.statusMessage !== "string"
    || (value.verdict !== "supported"
      && value.verdict !== "contradicted"
      && value.verdict !== "unclear")
    || typeof value.summary !== "string"
    || !Array.isArray(value.reviews)
    || !value.reviews.every(isFactCheckReview)
    || !Array.isArray(value.sources)
    || !value.sources.every(isTrustedSource)
    || !Array.isArray(value.providerErrors)
    || !value.providerErrors.every((error) => typeof error === "string")
    || typeof value.checkedAt !== "string"
    || typeof value.cacheHit !== "boolean"
    || !isRecord(value.providers)
    || !isRecord(value.providerMessages)
    || typeof value.providerMessages.googleFactCheck !== "string"
    || typeof value.providerMessages.jinaSearch !== "string"
  ) {
    return false;
  }

  return (
    isProviderStatus(value.providers.googleFactCheck)
    && isProviderStatus(value.providers.jinaSearch)
  );
}

function isFactCheckReview(value: unknown): value is FactCheckReview {
  if (!isRecord(value)) return false;

  const publisher = value.publisher;
  const validPublisher =
    publisher === undefined
    || (
      isRecord(publisher)
      && isOptionalString(publisher.name)
      && isOptionalString(publisher.site)
    );

  return (
    validPublisher
    && isOptionalString(value.matchedClaim)
    && isOptionalString(value.url)
    && isOptionalString(value.title)
    && isOptionalString(value.reviewDate)
    && isOptionalString(value.textualRating)
    && isOptionalString(value.languageCode)
  );
}

function isTrustedSource(value: unknown): value is TrustedSource {
  return (
    isRecord(value)
    && typeof value.title === "string"
    && typeof value.url === "string"
    && typeof value.domain === "string"
    && typeof value.trusted === "boolean"
    && isOptionalString(value.excerpt)
  );
}

function isSourceMetadata(
  value: unknown,
): value is NonNullable<AnalysisResponse["source"]> {
  return (
    isRecord(value)
    && typeof value.url === "string"
    && typeof value.retrievedWith === "string"
  );
}

function isProviderStatus(value: unknown): value is ProviderStatus {
  return (
    value === "available"
    || value === "not_configured"
    || value === "unavailable"
  );
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

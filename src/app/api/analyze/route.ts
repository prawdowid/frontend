import {
  BackendAnalysisError,
  mapVerifyResponse,
  type BackendVerifyResponse,
} from "@/lib/backendAnalysis";

const BACKEND_API_URL = (
  process.env.BACKEND_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_TEXT_LENGTH = 100_000;

class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

type BackendPayload = {
  text?: string;
  url?: string;
  channel: "web";
};

/**
 * Server-side proxy to the PRAWDOWID backend.
 *
 * Keeping the call on the server avoids CORS, hides the backend URL from the
 * browser and lets us translate `VerifyResponse` into the frontend contract.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await readPayload(request);
    const verifyResponse = await callBackend(payload);

    if (verifyResponse.status !== "ok") {
      throw new RequestError(
        verifyResponse.summary || "Backend nie zwrócił werdyktu.",
        422,
      );
    }

    return Response.json(mapVerifyResponse(verifyResponse));
  } catch (error) {
    if (error instanceof RequestError) {
      return errorResponse(error.message, error.status);
    }

    if (error instanceof BackendAnalysisError) {
      return errorResponse(error.message, error.status);
    }

    console.error("[api/analyze]", error);
    return errorResponse(
      "Nie udało się przetworzyć materiału. To nie jest werdykt.",
      500,
    );
  }
}

async function readPayload(request: Request): Promise<BackendPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const type = form.get("type");

    if (type === "file") {
      throw new RequestError(
        "Backend obsługuje obecnie tekst i linki. Analiza plików (OCR, transkrypcja) nie jest jeszcze włączona.",
        415,
      );
    }

    throw new RequestError("Nieprawidłowy format żądania.", 400);
  }

  const body = (await request.json().catch(() => null)) as {
    type?: unknown;
    text?: unknown;
    url?: unknown;
  } | null;

  if (!body || typeof body !== "object") {
    throw new RequestError("Nieprawidłowy format żądania.", 400);
  }

  if (body.type === "text") {
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) throw new RequestError("Wklej tekst do analizy.", 400);
    if (text.length > MAX_TEXT_LENGTH) {
      throw new RequestError("Tekst jest zbyt długi (limit 100 000 znaków).", 400);
    }

    return { text, channel: "web" };
  }

  if (body.type === "link") {
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!isHttpUrl(url)) {
      throw new RequestError("Podaj poprawny adres URL (http lub https).", 400);
    }

    return { url, channel: "web" };
  }

  throw new RequestError("Nieprawidłowy typ materiału.", 400);
}

async function callBackend(payload: BackendPayload): Promise<BackendVerifyResponse> {
  let response: Response;

  try {
    response = await fetch(`${BACKEND_API_URL}/verify`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    throw new RequestError(
      timedOut
        ? "Backend nie odpowiedział w wyznaczonym czasie. Spróbuj ponownie."
        : `Nie można połączyć się z backendem pod adresem ${BACKEND_API_URL}.`,
      502,
    );
  }

  const data = (await response.json().catch(() => null)) as
    | BackendVerifyResponse
    | null;

  if (!data || typeof data.summary !== "string") {
    throw new RequestError(
      `Backend zwrócił nieprawidłową odpowiedź (HTTP ${response.status}).`,
      502,
    );
  }

  if (!response.ok && data.status === "ok") {
    throw new RequestError(
      data.summary || `Błąd backendu (HTTP ${response.status}).`,
      502,
    );
  }

  if (!Array.isArray(data.claims)) {
    data.claims = [];
  }

  return data;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ message }, { status });
}

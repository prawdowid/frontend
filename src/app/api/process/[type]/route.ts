const PROCESS_TYPES = new Set(["text", "url", "image", "video"]);
const BACKEND_API_URL =
  process.env.ANALYSIS_API_URL ?? "http://localhost:3000";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
): Promise<Response> {
  const { type } = await params;
  if (!PROCESS_TYPES.has(type)) {
    return Response.json(
      { ok: false, error: "Unknown analysis endpoint." },
      { status: 404 },
    );
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(new URL(`/process/${type}`, BACKEND_API_URL), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": request.headers.get("content-type") ?? "application/json",
      },
      body: await request.arrayBuffer(),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Could not reach the analysis backend.", error);
    return Response.json(
      { ok: false, error: "Nie udało się połączyć z backendem." },
      { status: 502 },
    );
  }

  const headers = new Headers();
  const contentType = backendResponse.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
}

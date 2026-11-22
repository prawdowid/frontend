# PRAWDOWID

Frontend aplikacji do weryfikacji treści. Przyjmuje tekst, link lub zdjęcie, wysyła materiał do backendu PRAWDOWID i pokazuje werdykt wraz ze źródłami.

## Uruchomienie

### Windows - kliknij dwukrotnie

Po zainstalowaniu Node.js LTS (min. 20.9) wystarczy kliknąć dwukrotnie
`start.bat`. Skrypt sam zainstaluje zależności, uruchomi stronę i otworzy
przeglądarkę. Okna terminala nie należy zamykać podczas korzystania z aplikacji.

Frontend wymaga uruchomionego backendu (domyślnie `http://localhost:3000`).
W drugim oknie uruchom `backend\start.bat`.

### Ręcznie

```bash
npm install
npm run dev:api
```

Strona: http://localhost:3001

```bash
npm run typecheck
npm run build
```

### Docker

Obraz produkcyjny uruchamia `next start` na porcie `3001`:

```bash
docker build -t prawdowid-frontend .
docker run --rm -p 3001:3001 \
  -e BACKEND_API_URL=http://host.docker.internal:3000 \
  prawdowid-frontend
```

`BACKEND_API_URL` jest używany wyłącznie po stronie serwera, więc nie trafia do
przeglądarki. Na Linuksie zamiast `host.docker.internal` użyj adresu hosta albo
uruchom całość przez `backend/docker-compose.yml`, który buduje też frontend
i łączy go z backendem po sieci compose.

## Struktura

```text
src/
  app/
    api/analyze/route.ts
    dokumentacja/page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    about-section.tsx
    analysis-result.tsx
    documentation.tsx
    input-panel.tsx
    site-header.tsx
  lib/
    backendAnalysis.ts
  services/
    analyzeService.ts
  types/
    analysis.ts
    ui.ts
```

## Backend

Frontend nie udaje już analizy: `src/services/analyzeService.ts` wysyła materiał
do `POST /api/analyze`, a trasa serwerowa `src/app/api/analyze/route.ts` woła
backend PRAWDOWID (`POST /verify`) i mapuje jego kontrakt na `AnalysisResponse`
z `src/types/analysis.ts`.

### Uruchomienie razem z backendem

Backend domyślnie zajmuje port `3000`, więc frontend uruchamiamy na `3001`:

```bash
# terminal 1
cd ../backend
bun run dev

# terminal 2
cd ../frontend
cp .env.example .env
npm run dev:api
```

Strona: http://localhost:3001

Jeśli backend działa pod innym adresem, ustaw `BACKEND_API_URL` w `.env`
(zmienna jest używana tylko po stronie serwera, więc nie trafia do przeglądarki).

### Zakres integracji

- `text` → backend `{ text }`,
- `link` → backend `{ url }`,
- `image` (PNG/JPG/WebP, max 8 MB) → backend `{ image }` i OCR po stronie backendu,
- `MP4` → transkrypcja wideo (ASR) nie jest jeszcze włączona, dlatego API zwraca
  czytelny błąd `415` zamiast zmyślonego wyniku.

Odpowiedź backendu (`confirmed`, `false`, `misleading`,
`insufficient_evidence`, `not_verifiable`) jest agregowana do werdyktu UI,
a twierdzenia, uzasadnienia i źródła trafiają do sekcji „Ustalenia i źródła”.

### Kierunek rozwoju

Obecnie `/verify` jest wywołaniem synchronicznym: po wysłaniu formularza strona
przewija do sekcji wyniku i pokazuje stan oczekiwania. Docelowo backend ma
zwracać identyfikator zadania, a frontend ma subskrybować jego postęp przez
WebSocket i renderować etapy analizy w czasie rzeczywistym (`AnalysisState`
w `src/types/ui.ts` jest miejscem na rozszerzenie o `jobId` i `progress`).


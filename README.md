# PRAWDOWID

Frontend aplikacji do weryfikacji treści. Przyjmuje tekst lub link, wysyła materiał do backendu PRAWDOWID i pokazuje werdykt wraz ze źródłami.

## Uruchomienie

### Windows — kliknij dwukrotnie

Po zainstalowaniu Node.js LTS (min. 20.9) wystarczy kliknąć dwukrotnie
`start.bat`. Skrypt sam zainstaluje zależności, uruchomi stronę i otworzy
przeglądarkę. Okna terminala nie należy zamykać podczas korzystania z aplikacji.

### Ręcznie

```bash
npm install
npm run dev
```

Strona: http://localhost:3000

```bash
npm run typecheck
npm run build
```

## Struktura

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    about-section.tsx
    analysis-result.tsx
    input-panel.tsx
    site-header.tsx
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
- `file` → backend nie ma jeszcze ścieżki OCR/transkrypcji, dlatego API zwraca
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


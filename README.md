# PRAWDOWID

Frontend aplikacji do weryfikacji treści. Przyjmuje tekst, link lub plik i po ok. 1,5 s zwraca raport.

## Uruchomienie

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

- Kontrakt: `src/types/analysis.ts`
- Wysyłka: `src/services/analyzeService.ts`

Integracja:

1. Ustaw `USE_MOCK = false`.
2. Ustaw `NEXT_PUBLIC_ANALYSIS_API_URL`.
3. JSON dla `text` i `link`. `FormData` dla `file`.
4. Backend zwraca `AnalysisResponse`.

Komentarz `// TODO: BACKEND INTEGRATION` wskazuje miejsce integracji.

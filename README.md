# PRAWDOWID

Frontend aplikacji do weryfikacji treści. Przyjmuje tekst, link lub obraz i wyświetla znalezione fact-checki oraz źródła.

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

Strona: http://localhost:3100

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

- Domyślny adres API: `http://localhost:3000`; można go zmienić przez `ANALYSIS_API_URL` w `.env.local`.
- Serwer Next.js przekazuje żądania przez `/api/process/*`, więc przeglądarka nie łączy się bezpośrednio z backendem.
- Tekst trafia do `POST /process/text`, a link do `POST /process/url`.
- Obraz jest kodowany jako base64 i trafia do `POST /process/image`; backend zwraca obecnie HTTP 501, ponieważ analiza obrazów nie jest zaimplementowana.
- Przesłane wideo nie jest jeszcze obsługiwane. Endpoint `/process/video` jest placeholderem i nie zwraca analizy.
- Wynik backendu zawiera dla każdego twierdzenia automatyczną ocenę (potwierdzone / obalone / brak jednoznacznych danych), krótkie streszczenie oraz źródła, na których ją oparto. To ocena oparta na znalezionych źródłach, a nie niezależny fact-check.

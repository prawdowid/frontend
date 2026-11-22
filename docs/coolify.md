# Wdrożenie frontendu w Coolify

Frontend i backend wdrażamy jako **dwie oddzielne aplikacje Coolify**. Nie należy
używać compose backendu do budowania frontendu ani ustawiać kontekstu budowania
na sąsiednie repozytorium.

## Konfiguracja aplikacji frontendowej

| Ustawienie | Wartość |
| --- | --- |
| Źródło | repozytorium `frontend` |
| Build pack | `Dockerfile` |
| Dockerfile | `Dockerfile` w katalogu głównym repozytorium |
| Port aplikacji | `3001` |
| Health check | HTTP `GET /` na porcie `3001` |

Dockerfile wystawia port `3001`, uruchamia `next start -p 3001` i definiuje
kontenerowy `HEALTHCHECK` dla `http://127.0.0.1:3001/`. Jeżeli formularz
zdrowia w Coolify wymaga ścieżki, ustaw `/`; nie używaj `/api/analyze`, bo ta
trasa wymaga żądania `POST` oraz działającego backendu.

`next.config.ts` nie ma `output: "standalone"`. Jest to poprawne dla obecnego
obrazu: etap runtime zawiera produkcyjne `node_modules`, wynik `.next` i
uruchamia Next.js przez `next start`. Nie trzeba włączać trybu standalone, aby
wdrożyć tę aplikację w Coolify.

## Zmienne środowiskowe i argumenty buildu

### Runtime environment

Ustaw w zmiennych środowiskowych aplikacji frontendowej:

```env
BACKEND_API_URL=https://api.prawdowid.org
```

To adres **publicznie dostępnej, już wdrożonej aplikacji backendowej**, bez
końcowego `/verify` (frontend dopisuje tę ścieżkę). Zmienna jest odczytywana po
stronie serwera przez `src/app/api/analyze/route.ts`, więc można ją zmienić przy
redeployu/restartcie kontenera bez budowania nowego obrazu.

### Build argument

Opcjonalnie ustaw build argument Dockerfile:

```text
NEXT_PUBLIC_ANALYSIS_API_URL=/api/analyze
```

To jest wartość domyślna i zalecana. Zmienna `NEXT_PUBLIC_*` zostaje osadzona w
bundle przeglądarkowym podczas `npm run build`; jej zmiana **wymaga nowego
builda obrazu**, a nie tylko restartu. Ustawienie zewnętrznego adresu backendu
w tej zmiennej powoduje, że przeglądarka komunikuje się z nim bezpośrednio i
wtedy backend musi obsłużyć CORS. Nie jest to standardowa konfiguracja.

## Domeny i kolejność wdrożenia

1. Wdróż backend jako niezależną aplikację Coolify i przypisz mu domenę, np.
   `https://api.prawdowid.org`.
2. Sprawdź, że `POST https://api.prawdowid.org/verify` jest dostępny zgodnie z
   kontraktem backendu.
3. W aplikacji frontendowej ustaw `BACKEND_API_URL` na tę domenę backendu.
4. Wdróż frontend, przypisz mu jego publiczną domenę, np.
   `https://prawdowid.org` (oraz opcjonalnie `https://www.prawdowid.org`), i
   ustaw przekierowanie wybranej domeny kanonicznej.

Przy domyślnym `NEXT_PUBLIC_ANALYSIS_API_URL=/api/analyze` przeglądarka wysyła
żądanie pod domenę frontendu. Route Handler Next.js odbiera je pod
`POST /api/analyze`, serwerowo wywołuje `${BACKEND_API_URL}/verify` i mapuje
odpowiedź. Z tego powodu backend nie potrzebuje CORS, a jego URL nie trafia do
klienta.

## Typowe błędy

| Objaw | Przyczyna / rozwiązanie |
| --- | --- |
| Frontend zwraca błąd po analizie, komunikat o braku połączenia z backendem | Sprawdź `BACKEND_API_URL`, publiczną domenę backendu, TLS/DNS i dostępność `POST /verify`. Wartość nie może zawierać `/verify`. |
| Błąd 502 po około 120 sekundach | Backend nie odpowiedział przed limitem proxy frontendu (120 s) albo połączenie frontend → backend jest zablokowane. Sprawdź logi obu aplikacji. |
| Frontend pokazuje stary endpoint analizy | `NEXT_PUBLIC_ANALYSIS_API_URL` jest skompilowane do bundle. Uruchom redeploy z rebuildem. |
| Błąd CORS w przeglądarce | Pozostaw `NEXT_PUBLIC_ANALYSIS_API_URL=/api/analyze`. CORS nie jest potrzebny przy proxy Next.js. Jeśli świadomie wskazujesz zewnętrzny URL, skonfiguruj CORS na backendzie. |
| Aplikacja nie staje się healthy | Port w Coolify musi być `3001`, a ścieżka health check `/`. Nie kieruj health check na `/api/analyze`. |
| Build nie widzi plików frontendu | Aplikacja Coolify musi być połączona z repozytorium frontendu, nie z compose/repo backendu. |

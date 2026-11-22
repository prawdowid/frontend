const DISCLAIMER =
  "To nie jest wyrok sądu. System pokazuje, co wynika z dostępnych źródeł i gdzie kończy się jego wiedza. Sprawdź linki do źródeł.";

const TECH_STACK = [
  {
    label: "Frontend",
    items: [
      "Next.js 16 (App Router)",
      "React 19",
      "TypeScript",
      "Tailwind CSS 3",
      "daisyUI 4",
    ],
  },
  {
    label: "Backend",
    items: ["Bun", "Elysia", "TypeScript", "Swagger pod /docs"],
  },
  {
    label: "Warstwa AI",
    items: [
      "OpenRouter",
      "DeepSeek v4.1 Flash - ekstrakcja (reasoning OFF)",
      "Jev / RLCD - bramka i dopasowanie twierdzeń",
      "bge-m3 - embeddingi (PL)",
      "DeepSeek-OCR - tekst ze zdjęć",
    ],
  },
  {
    label: "Dane i research",
    items: [
      "Lokalny korpus: 122 źródła, 29 domen",
      "Google Fact Check Tools",
      "Wikipedia - fallback",
      "Snapshot EUvsDisinfo",
    ],
  },
  {
    label: "Przechowywanie",
    items: [
      "Pliki JSON w data/ - domyślnie",
      "MySQL - opcjonalnie",
      "Redis - wyłącznie warstwa ulotna",
    ],
  },
];

const FLOW_STEPS = [
  {
    title: "Wejście",
    detail:
      "Tekst, publiczny link lub zdjęcie z tekstem trafia do wewnętrznego API frontendu. Kanał jest oznaczany jako web.",
  },
  {
    title: "OCR",
    detail:
      "Zdjęcie PNG, JPG lub WebP jest odczytywane przez DeepSeek-OCR. Obraz nie jest niezależnie weryfikowany - dalsza analiza pracuje na odczytanym tekście.",
  },
  {
    title: "Bramka Jev",
    detail:
      "Ocena polityczna materiału jest raportowana, ale nie blokuje weryfikacji. Bramka służy też do dopasowania twierdzeń.",
  },
  {
    title: "Ekstrakcja",
    detail:
      "DeepSeek v4.1 Flash wyciąga fakty i rozbija je na atomowe twierdzenia w układzie SPO: podmiot, orzeczenie, obiekt.",
  },
  {
    title: "Embeddingi i cache",
    detail:
      "bge-m3 liczy wektory i zawęża listę kandydatów. Cache sprawdza klucz dokładny, dopasowanie Jev i wpis czasowy.",
  },
  {
    title: "Research i dowody",
    detail:
      "System przeszukuje lokalny korpus, Google Fact Check Tools, Wikipedię oraz snapshot EUvsDisinfo i zbiera dowody.",
  },
  {
    title: "VerifyResponse",
    detail:
      "Powstaje odpowiedź z werdyktami twierdzeń, dowodami, ograniczeniami, kosztem i czasem przetwarzania.",
  },
  {
    title: "API backendu",
    detail:
      "Kontrakt wystawia POST /verify. Kanały WWW, API i bot korzystają z tej samej funkcji pipeline'u.",
  },
  {
    title: "Proxy frontendu",
    detail:
      "Przeglądarka woła własne /api/analyze. Trasa serwerowa Next.js przekazuje żądanie do backendu i mapuje odpowiedź.",
  },
  {
    title: "Interfejs wyniku",
    detail:
      "Frontend pokazuje werdykt, poziom pewności, ustalenia i linki do źródeł w sekcji „Wynik analizy”.",
  },
];

const REQUEST_FIELDS = [
  {
    field: "text?",
    type: "string",
    description: "Treść do sprawdzenia. Wysyłana zamiast linku.",
  },
  {
    field: "url?",
    type: "string",
    description: "Publiczny adres http/https artykułu, posta lub wideo.",
  },
  {
    field: "channel?",
    type: '"web" | "discord" | "api" | "sms"',
    description: "Kanał źródłowy żądania. Frontend wysyła „web”.",
  },
  {
    field: "image?",
    type: "string (base64)",
    description:
      "Zdjęcie jako base64 lub data URI. Backend odczytuje tekst przez OCR; limit to 8 MB po zdekodowaniu.",
  },
];

const RESPONSE_FIELDS = [
  {
    field: "status",
    type: "ok | error | needs_clarification | out_of_scope",
    description: "Wynik samego żądania, nie werdykt merytoryczny.",
  },
  {
    field: "summary",
    type: "string",
    description: "Krótkie podsumowanie w języku polskim.",
  },
  {
    field: "claims[]",
    type: "ClaimVerdict[]",
    description:
      "Twierdzenia z werdyktem, pewnością, siłą dowodów, uzasadnieniem i źródłami.",
  },
  {
    field: "limitations[]",
    type: "string[]",
    description: "Jawne ograniczenia analizy i brakujących danych.",
  },
  {
    field: "input, language, sessionId",
    type: "metadata",
    description: "Typ i podgląd wejścia, język odpowiedzi oraz identyfikator sesji.",
  },
  {
    field: "timingMs, costUsd, costBreakdown?",
    type: "number / object",
    description:
      "Czas i szacowany koszt. costBreakdown dzieli koszt na etapy, jeśli jest dostępny.",
  },
  {
    field: "models[], sourcesUsed[]",
    type: "string[]",
    description: "Użyte modele oraz źródła wykorzystane w analizie.",
  },
  {
    field: "disclaimer",
    type: "string",
    description: "Zastrzeżenie dołączane do odpowiedzi.",
  },
];

const CLAIM_FIELDS = [
  "id, claim",
  "verdict",
  "confidence (0..1)",
  "strength (high / medium / low)",
  "reasoning",
  "evidence[]",
  "limitations[]",
  "asOf",
  "cached",
];

const VERDICTS = [
  {
    id: "confirmed",
    label: "Potwierdzone",
    description: "Dowody wspierają twierdzenie w podanym kontekście czasowym.",
  },
  {
    id: "false",
    label: "Fałszywe",
    description: "Dowody przeczą twierdzeniu.",
  },
  {
    id: "misleading",
    label: "Wprowadzające w błąd",
    description:
      "Element może być prawdziwy, ale kontekst, zestawienie lub wniosek zniekształca obraz.",
  },
  {
    id: "insufficient_evidence",
    label: "Brak wystarczających dowodów",
    description:
      "System nie ma dość materiału, żeby rozstrzygnąć, i wstrzymuje się od werdyktu.",
  },
  {
    id: "not_verifiable",
    label: "Nie podlega weryfikacji",
    description:
      "Twierdzenie nie jest zdaniem faktograficznym, które da się sprawdzić w źródłach.",
  },
];

const INPUT_SUPPORT = [
  {
    input: "Tekst",
    support: "Tak",
    note: "Wklejony post, cytat lub fragment artykułu.",
    supported: true,
  },
  {
    input: "Link",
    support: "Tak",
    note: "Publiczny adres http/https.",
    supported: true,
  },
  {
    input: "Obraz PNG / JPG / WebP",
    support: "Tak (OCR)",
    note: "Tekst ze zdjęcia jest odczytywany przez OCR i trafia do dalszej analizy. Limit: 8 MB.",
    supported: true,
  },
  {
    input: "Wideo MP4",
    support: "Nie",
    note: "Brak transkrypcji (ASR). API zwraca czytelny błąd 415 zamiast zmyślonego wyniku.",
    supported: false,
  },
];

const GUARANTEES = [
  {
    title: "Cytowanie zamiast opinii",
    detail:
      "Każde twierdzenie dostaje dowody: tytuł, wydawcę, datę, URL, fragment i relację (wspiera, przeczy, kontekst).",
  },
  {
    title: "Kontekst czasowy",
    detail:
      "Wpisy cache mają validFrom i validUntil, a matcher filtruje je po asOf. Ten sam cytat może mieć różny werdykt w różnych oknach czasu.",
  },
  {
    title: "Pętla informacji",
    detail:
      "Twierdzenia bez rozstrzygnięcia trafiają do spraw moderacyjnych. Podobne pytanie jest dołączane do istniejącej sprawy, a przy trzecim zgłoszeniu system zapisuje alert.",
  },
  {
    title: "Jasny status i limity",
    detail:
      "Błąd techniczny i prośba o doprecyzowanie to osobne statusy, nigdy werdykt. Redis odpowiada za hot-cache, locki, rate limit i kolejkę rechecków.",
  },
];

const LIMITATIONS = [
  {
    title: "Brak ASR",
    detail:
      "Obrazy są odczytywane przez OCR, ale wideo (MP4) nie ma jeszcze transkrypcji. Frontend pokazuje wtedy komunikat, nie zmyślony wynik.",
  },
  {
    title: "Pokrycie korpusu",
    detail:
      "Lokalny korpus liczy 122 źródła w 29 domenach. To nie jest pełny internet; brak dowodu oznacza insufficient_evidence, nie fałsz.",
  },
  {
    title: "Budżet researchu",
    detail:
      "Liczba zapytań i twierdzeń w jednej analizie jest ograniczona kosztem i czasem. Szerszy research może wymagać więcej pracy.",
  },
  {
    title: "Aktualność i recheck",
    detail:
      "Cache ma okna ważności, ale automatyczny recheck po stronie schedulera nie jest jeszcze wpięty.",
  },
  {
    title: "Nie jest wyrokiem sądu",
    detail:
      "System pokazuje, co wynika z dostępnych źródeł, i oznacza miejsca, w których kończy się jego wiedza. Decyzję zawsze warto potwierdzić w linkach.",
  },
];

const EVAL_PLACEHOLDERS = [
  "Skuteczność werdyktów",
  "Pokrycie źródłowe",
  "Czas odpowiedzi",
  "Koszt na sprawdzenie",
];

export function Documentation() {
  return (
    <>
      <section
        aria-labelledby="docs-heading"
        className="border-b border-line bg-mist py-12 sm:py-16 lg:py-20"
      >
        <div className="shell">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-crimson">
            Dokumentacja techniczna
          </p>
          <h1
            id="docs-heading"
            className="mt-4 max-w-[16ch] text-[clamp(2.5rem,5vw,4.25rem)] font-bold leading-[1] tracking-[-0.04em] text-navy"
          >
            Jak działa PRAWDOWID
          </h1>
          <span className="accent-rule" aria-hidden="true" />

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
            PRAWDOWID sprawdza twierdzenia w źródłach: wyciąga z materiału
            atomowe fakty, szuka dowodów i oznacza, gdzie wiedza się kończy.
            Werdykt nie jest opinią modelu.
          </p>

          <dl className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3">
            {[
              ["Wejście", "Tekst, link i obraz"],
              ["Kontrakt", "POST /verify"],
              ["Status", "MVP"],
            ].map(([term, value]) => (
              <div key={term} className="bg-white p-4">
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {term}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-navy">{value}</dd>
              </div>
            ))}
          </dl>

          <nav aria-label="Spis treści" className="mt-8">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.06em] text-navy">
              {[
                ["#przeglad", "Przegląd"],
                ["#stos", "Stos technologiczny"],
                ["#przeplyw", "Przepływ żądania"],
                ["#api", "Kontrakt API"],
                ["#wejscia", "Wejścia"],
                ["#koszt", "Koszt"],
                ["#gwarancje", "Gwarancje i ograniczenia"],
                ["#ewaluacja", "Ewaluacja"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a className="hover:text-crimson" href={href}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <section
        id="przeglad"
        aria-labelledby="overview-heading"
        className="scroll-mt-20 bg-white py-14 sm:py-16"
      >
        <div className="shell">
          <SectionHeading
            id="overview-heading"
            eyebrow="01 - Zasada"
            title="Werdykt ze źródeł, nie z modelu"
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted sm:text-base">
              <p>
                Model językowy służy do odczytania materiału i rozbicia go na
                sprawdzalne twierdzenia. Nie decyduje sam, czy coś jest prawdą.
                Werdykt powstaje z dowodów: dokumentów urzędowych, materiałów
                fact-checkingowych i źródeł kontekstowych.
              </p>
              <p>
                Gdy dowody są zbyt słabe albo sprzeczne, system nie zgaduje.
                Zwraca werdykt <PolishCode>insufficient_evidence</PolishCode>{" "}
                albo <PolishCode>not_verifiable</PolishCode> i pokazuje
                ograniczenia. To celowe zachowanie, nie błąd.
              </p>
            </div>

            <aside className="border-l-4 border-crimson bg-mist p-6">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-crimson">
                Zasada nadrzędna
              </p>
              <p className="mt-3 text-lg font-semibold leading-snug text-navy">
                Brak dowodu nie jest dowodem fałszu. System wstrzymuje się od
                rozstrzygnięcia, zamiast dopowiadać.
              </p>
              <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                Pipeline wymaga dowodów dla rozstrzygnięcia. Gdy ich brakuje,
                zwraca jawny werdykt braku dowodów zamiast dopowiadać
                odpowiedź.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section
        id="stos"
        aria-labelledby="stack-heading"
        className="scroll-mt-20 border-y border-line bg-mist py-14 sm:py-16"
      >
        <div className="shell">
          <SectionHeading
            id="stack-heading"
            eyebrow="02 - Architektura"
            title="Stos technologiczny"
            description="Warstwy są rozdzielone: frontend nie zna wewnętrznego kontraktu backendu, a backend nie zależy od interfejsu WWW."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {TECH_STACK.map((group) => (
              <article
                key={group.label}
                className="border border-line bg-white p-5 sm:p-6"
              >
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-crimson">
                  {group.label}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm leading-snug text-navy"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-crimson"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="przeplyw"
        aria-labelledby="flow-heading"
        className="scroll-mt-20 bg-white py-14 sm:py-16"
      >
        <div className="shell">
          <SectionHeading
            id="flow-heading"
            eyebrow="03 - Pipeline"
            title="Przepływ żądania"
            description="Od wejścia użytkownika do werdyktu w interfejsie. Każdy etap ma jasny kontrakt i może zakończyć się jawnym ograniczeniem."
          />

          <ol className="mt-8 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FLOW_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative border border-line bg-white p-5 transition-colors hover:border-navy"
              >
                <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-crimson">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-base font-semibold text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="api"
        aria-labelledby="api-heading"
        className="scroll-mt-20 border-y border-line bg-mist py-14 sm:py-16"
      >
        <div className="shell">
          <SectionHeading
            id="api-heading"
            eyebrow="04 - Kontrakt"
            title="POST /verify"
            description="Backend przyjmuje tekst, link albo zdjęcie i zwraca ujednoliconą odpowiedź. Frontend nie woła backendu bezpośrednio - korzysta z własnego proxy."
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="border border-line bg-white p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-navy">
                Żądanie - pola wejściowe
              </h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Pola wejściowe kontraktu POST /verify
                  </caption>
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-[0.08em] text-muted">
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Pole
                      </th>
                      <th scope="col" className="py-2 pr-4 font-semibold">
                        Typ
                      </th>
                      <th scope="col" className="py-2 font-semibold">
                        Opis
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {REQUEST_FIELDS.map((row) => (
                      <tr key={row.field} className="border-b border-line/70">
                        <th
                          scope="row"
                          className="py-3 pr-4 align-top font-mono text-xs font-semibold text-navy"
                        >
                          {row.field}
                        </th>
                        <td className="py-3 pr-4 align-top font-mono text-[11px] text-muted">
                          {row.type}
                        </td>
                        <td className="py-3 align-top text-xs leading-relaxed text-muted">
                          {row.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <pre className="mt-5 overflow-x-auto bg-ink p-4 text-xs leading-relaxed text-white">
                <code>{`POST /verify
Content-Type: application/json

{ "text": "…", "channel": "web" }`}</code>
              </pre>
            </div>

            <div className="border border-line bg-white p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-navy">
                Odpowiedź - pola VerifyResponse
              </h3>
              <dl className="mt-4 divide-y divide-line">
                {RESPONSE_FIELDS.map((row) => (
                  <div key={row.field} className="py-3 first:pt-0 last:pb-0">
                    <dt className="font-mono text-xs font-semibold text-navy">
                      {row.field}
                    </dt>
                    <dd className="mt-1 text-xs leading-relaxed text-muted">
                      <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-crimson">
                        {row.type}
                      </span>
                      <span className="mx-2 text-line" aria-hidden="true">
                        /
                      </span>
                      {row.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="border border-line bg-white p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-navy">
                Klasa werdyktu twierdzenia
              </h3>
              <ul className="mt-4 space-y-3">
                {VERDICTS.map((verdict) => (
                  <li
                    key={verdict.id}
                    className="border-l-2 border-crimson pl-3"
                  >
                    <p className="text-sm font-semibold text-navy">
                      {verdict.label}{" "}
                      <span className="font-mono text-[10px] font-normal uppercase tracking-[0.04em] text-muted">
                        {verdict.id}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {verdict.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="border border-line bg-white p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-navy">
                  Status żądania to nie werdykt
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  <PolishCode>error</PolishCode> i{" "}
                  <PolishCode>needs_clarification</PolishCode> opisują problem z
                  żądaniem, a nie prawdziwość materiału. Frontend odrzuca każdy
                  status inny niż <PolishCode>ok</PolishCode> i pokazuje błąd
                  zamiast werdyktu.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Pola pojedynczego twierdzenia:{" "}
                  <span className="font-mono text-[11px] text-navy">
                    {CLAIM_FIELDS.join(" · ")}
                  </span>
                  .
                </p>
              </div>

              <div className="border border-line bg-navy p-5 text-white sm:p-6">
                <h3 className="text-sm font-semibold">Proxy frontendu</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/75">
                  Przeglądarka wysyła żądanie do{" "}
                  <span className="font-mono text-white">/api/analyze</span>.
                  Trasa serwerowa Next.js woła{" "}
                  <span className="font-mono text-white">POST /verify</span> pod
                  adresem <span className="font-mono text-white">BACKEND_API_URL</span>{" "}
                  i mapuje odpowiedź na mniejszy kontrakt UI.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/75">
                  Dzięki temu backend nie musi mieć CORS, a jego adres nie trafia
                  do przeglądarki.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="wejscia"
        aria-labelledby="inputs-heading"
        className="scroll-mt-20 bg-white py-14 sm:py-16"
      >
        <div className="shell">
          <SectionHeading
            id="inputs-heading"
            eyebrow="05 - Zakres"
            title="Co można sprawdzić"
            description="Zakres MVP jest jawny. Lepiej pokazać ograniczenie niż zasymulować analizę, której backend nie wykonuje."
          />

          <div className="mt-8 overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Obsługiwane typy materiałów wejściowych
              </caption>
              <thead className="bg-mist">
                <tr className="text-[10px] uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Wejście
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Obsługiwane
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Uwagi
                  </th>
                </tr>
              </thead>
              <tbody>
                {INPUT_SUPPORT.map((row) => (
                  <tr key={row.input} className="border-t border-line">
                    <th
                      scope="row"
                      className="px-4 py-4 align-top text-sm font-semibold text-navy"
                    >
                      {row.input}
                    </th>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={`inline-flex px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${
                          row.supported
                            ? "bg-navy text-white"
                            : "bg-mist text-crimson"
                        }`}
                      >
                        {row.support}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-xs leading-relaxed text-muted">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
            Zakładka „Plik” przyjmuje PNG, JPG i WebP do 8 MB. Tekst ze zdjęcia
            jest odczytywany przez backendowy OCR. Transkrypcja wideo nie jest
            jeszcze włączona - to jawne ograniczenie MVP, nie błąd integracji.
          </p>
        </div>
      </section>

      <section
        id="koszt"
        aria-labelledby="cost-heading"
        className="scroll-mt-20 border-y border-line bg-mist py-14 sm:py-16"
      >
        <div className="shell">
          <SectionHeading
            id="cost-heading"
            eyebrow="06 - Ekonomia"
            title="Koszt sprawdzenia"
            description="Wielkości pochodzą z szacunku backendu. Zależą od długości materiału, liczby twierdzeń i dostępności researchu - to nie jest rozliczenie."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="border border-line bg-white p-6">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-crimson">
                Jedno sprawdzenie
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                $0.0003-$0.001
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Gate, ekstrakcja i embeddingi. Research z Google jest darmowy w
                ramach limitu.
              </p>
            </div>
            <div className="border border-line bg-white p-6">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-crimson">
                1000 sprawdzeń
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                $0.3-$1
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Szacunek rzędu wielkości. Rzeczywisty koszt zależy od ruchu i
                długości materiałów.
              </p>
            </div>
          </div>

          <div className="mt-6 border border-line bg-white p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-navy">
              Podział kosztu według etapów
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Ekstrakcja", "DeepSeek - tokeny wejścia i wyjścia"],
                ["Bramka i matching", "Jev / RLCD - zużycie z odpowiedzi"],
                ["Embeddingi", "bge-m3 - szacunek na podstawie znaków"],
                ["Research", "Google Fact Check, Wikipedia, EUvsDisinfo"],
              ].map(([title, detail], index) => (
                <li key={title} className="border-t border-line pt-3">
                  <span className="font-mono text-[10px] font-semibold text-crimson">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-navy">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {detail}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
              Odpowiedź może zawierać <PolishCode>costBreakdown</PolishCode> z
              podziałem na etapy. Wartości są szacowane, a nie fakturowane.
            </p>
          </div>
        </div>
      </section>

      <section
        id="gwarancje"
        aria-labelledby="guarantees-heading"
        className="scroll-mt-20 bg-white py-14 sm:py-16"
      >
        <div className="shell">
          <SectionHeading
            id="guarantees-heading"
            eyebrow="07 - Zakres odpowiedzialności"
            title="Co system zapewnia - i czego nie zapewnia"
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Zapewnia
              </h3>
              <ul className="mt-4 space-y-3">
                {GUARANTEES.map((item) => (
                  <li
                    key={item.title}
                    className="border border-line bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-navy">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-crimson">
                Ograniczenia
              </h3>
              <ul className="mt-4 space-y-3">
                {LIMITATIONS.map((item) => (
                  <li
                    key={item.title}
                    className="border border-line bg-mist p-4"
                  >
                    <p className="text-sm font-semibold text-navy">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        id="ewaluacja"
        aria-labelledby="evaluation-heading"
        className="scroll-mt-20 bg-navy py-14 text-white sm:py-16"
      >
        <div className="shell">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
            08 - Pomiar
          </p>
          <h2
            id="evaluation-heading"
            className="mt-3 text-3xl font-bold text-white sm:text-4xl"
          >
            Statystyki i wyniki ewaluacji
          </h2>
          <span
            className="mt-4 block h-1 w-16 bg-crimson"
            aria-hidden="true"
          />

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/70">
            Ta sekcja jest zarezerwowana na zmierzone wyniki. Nie publikujemy
            tutaj liczb, dopóki nie zostaną rzetelnie policzone na stałym
            zbiorze testowym.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EVAL_PLACEHOLDERS.map((label) => (
              <div
                key={label}
                className="border border-dashed border-white/30 bg-white/5 p-5"
              >
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  W przygotowaniu
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-3xl border-t border-white/15 pt-4 text-xs leading-relaxed text-white/70">
            Dokładne metryki - m.in. skuteczność werdyktów, pokrycie źródeł,
            opóźnienie i koszt jednostkowy - zostaną dostarczone przez agenta
            ewaluacji po zakończeniu pomiarów.
          </p>
        </div>
      </section>
    </>
  );
}

export function DocumentationFooter() {
  return (
    <footer className="border-t border-line bg-white py-10 sm:py-12">
      <div className="shell flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-crimson">
            Zastrzeżenie
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {DISCLAIMER}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="btn btn-primary h-10 min-h-0 px-4 text-xs"
          >
            Wróć do analizy
          </a>
          <a
            href="/#o-nas"
            className="btn btn-primary btn-outline h-10 min-h-0 border border-navy px-4 text-xs"
          >
            O nas
          </a>
        </div>
      </div>

      <div className="shell mt-8 border-t border-line pt-4">
        <p className="text-xs text-muted">PRAWDOWID, Hackathon 2026.</p>
      </div>
    </footer>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-crimson">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
        {title}
      </h2>
      <span className="accent-rule" aria-hidden="true" />
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

function PolishCode({ children }: { children: string }) {
  return (
    <code className="bg-mist px-1.5 py-0.5 font-mono text-[11px] font-medium text-navy">
      {children}
    </code>
  );
}

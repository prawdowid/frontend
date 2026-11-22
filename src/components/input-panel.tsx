"use client";

import {
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import type { AnalysisInputType, AnalysisPayload } from "@/types/analysis";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 12_000;

const TABS: { id: AnalysisInputType; label: string }[] = [
  { id: "text", label: "Tekst" },
  { id: "link", label: "Link" },
  { id: "file", label: "Plik" },
];

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

interface InputPanelProps {
  isLoading: boolean;
  onSubmit: (payload: AnalysisPayload) => Promise<void>;
}

export function InputPanel({ isLoading, onSubmit }: InputPanelProps) {
  const [tab, setTab] = useState<AnalysisInputType>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function changeTab(nextTab: AnalysisInputType) {
    setTab(nextTab);
    setError(null);
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (isLoading) return;

    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();

    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;

    const nextTab = TABS[nextIndex];
    changeTab(nextTab.id);
    document.getElementById(`tab-${nextTab.id}`)?.focus();
  }

  function selectFile(nextFile: File | null) {
    if (isLoading) return;
    setError(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!isAllowedFile(nextFile)) {
      setError("Dozwolone pliki: PNG, JPG i WebP.");
      return;
    }

    if (nextFile.size > MAX_FILE_BYTES) {
      setError("Maksymalny rozmiar pliku to 8 MB.");
      return;
    }

    setFile(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let payload: AnalysisPayload;

    if (tab === "text") {
      const value = text.trim();
      if (!value) {
        setError("Wklej tekst do analizy.");
        return;
      }
      payload = { type: "text", text: value };
    } else if (tab === "link") {
      const value = url.trim();
      if (!isValidUrl(value)) {
        setError("Podaj poprawny adres URL.");
        return;
      }
      payload = { type: "link", url: value };
    } else {
      if (!file) {
        setError("Dodaj plik do analizy.");
        return;
      }
      payload = { type: "file", file };
    }

    await onSubmit(payload);
  }

  return (
    <section
      id="panel-heading"
      aria-label="Panel analizy"
      className="bg-white p-6 shadow-sm sm:p-8"
    >
      <p className="text-sm text-muted">
        Wybierz typ materiału i wyślij do analizy.
      </p>

      <div
        role="tablist"
        aria-label="Typ materiału"
        className="tabs tabs-boxed mt-6 grid grid-cols-3 p-1"
      >
        {TABS.map((item, index) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={active}
              aria-controls="analysis-input-panel"
              tabIndex={active ? 0 : -1}
              disabled={isLoading}
              onClick={() => changeTab(item.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`tab h-11 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs ${
                active ? "tab-active" : ""
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div
          role="tabpanel"
          id="analysis-input-panel"
          aria-labelledby={`tab-${tab}`}
          className="min-h-[232px] pt-6"
        >
          {tab === "text" && (
            <div>
              <div className="flex items-end justify-between gap-3">
                <label
                  htmlFor="analysis-text"
                  className="text-xs font-semibold uppercase tracking-[0.08em] text-navy"
                >
                  Tekst do sprawdzenia
                </label>
                <span className="text-xs tabular-nums text-muted">
                  {text.length}/{MAX_TEXT_LENGTH}
                </span>
              </div>
              <textarea
                id="analysis-text"
                name="text"
                rows={8}
                maxLength={MAX_TEXT_LENGTH}
                value={text}
                disabled={isLoading}
                onChange={(event) => {
                  setText(event.target.value);
                  setError(null);
                }}
                placeholder="Wklej post, cytat lub fragment artykułu..."
                className="field mt-2 min-h-[176px] resize-y py-3"
              />
            </div>
          )}

          {tab === "link" && (
            <div>
              <label
                htmlFor="analysis-url"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-navy"
              >
                Adres materiału
              </label>
              <input
                id="analysis-url"
                name="url"
                type="url"
                inputMode="url"
                value={url}
                disabled={isLoading}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError(null);
                }}
                placeholder="https://example.com/artykul"
                className="field mt-2 h-12"
              />
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Publiczny link do artykułu, posta lub wideo.
              </p>
            </div>
          )}

          {tab === "file" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy">
                Screen lub zdjęcie
              </p>
              <div
                className="dropzone mt-2 p-5 text-center"
                data-dragging={isDragging}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="sr-only"
                  disabled={isLoading}
                  onChange={(event) => {
                    selectFile(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />

                {file ? (
                  <div className="flex items-center gap-4 text-left">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectFile(null)}
                      disabled={isLoading}
                      className="shrink-0 text-xs font-semibold uppercase tracking-[0.06em] text-crimson hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Usuń
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-navy">
                      Przeciągnij plik tutaj
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      PNG, JPG, WebP. Maks. 8 MB.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="btn btn-primary btn-sm mt-4 h-9 min-h-0 px-4 text-xs"
                    >
                      Wybierz plik
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm text-crimson">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="btn btn-accent mt-6 h-12 min-h-0 w-full text-sm font-semibold"
        >
          {isLoading ? "Analizuję..." : "Wyślij"}
        </button>
      </form>
    </section>
  );
}

function isAllowedFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.has(extension);
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

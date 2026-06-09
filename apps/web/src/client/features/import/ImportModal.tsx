import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Music4,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { uploadTrack } from "../../../shared/api/tracks";
import { trackKeys } from "../../../shared/hooks/useTracks";
import { savesKeys } from "../../../shared/hooks/useLibrarySaves";
import { quotaKeys } from "../../../shared/hooks/useQuota";

const SUPPORTED_EXTS = new Set([
  "mp3",
  "flac",
  "wav",
  "m4a",
  "ogg",
  "aac",
  "opus",
]);
const MAX_FILE_BYTES = 50 * 1024 * 1024;

type ItemStatus = "pending" | "uploading" | "done" | "error" | "skipped";

interface Candidate {
  key: string;
  file: File;
  relPath: string;
  status: ItemStatus;
  error?: string;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [items, setItems] = useState<Candidate[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes so the next open is clean.
  useEffect(() => {
    if (!open) {
      setItems([]);
      setRunning(false);
      setIsDragging(false);
    }
  }, [open]);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const valid: Candidate[] = [];
    const seen = new Set(items.map((i) => `${i.file.name}:${i.file.size}`));
    for (const file of incoming) {
      const ext = extOf(file.name);
      if (!SUPPORTED_EXTS.has(ext)) continue;
      if (file.size > MAX_FILE_BYTES) continue;
      const key = `${file.name}:${file.size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // webkitRelativePath survives the folder picker — preserve it as a hint.
      const relPath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;
      valid.push({
        key: `${key}:${valid.length}`,
        file,
        relPath,
        status: "pending",
      });
    }
    if (valid.length === 0) return;
    setItems((prev) => [...prev, ...valid]);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  async function startUpload() {
    if (running) return;
    setRunning(true);
    const pending = items.filter((it) => it.status === "pending");
    let stopped = false;
    for (const cand of pending) {
      if (stopped) break;
      setItems((prev) =>
        prev.map((it) =>
          it.key === cand.key ? { ...it, status: "uploading" } : it,
        ),
      );
      try {
        await uploadTrack(cand.file);
        setItems((prev) =>
          prev.map((it) =>
            it.key === cand.key ? { ...it, status: "done" } : it,
          ),
        );
      } catch (err) {
        const ax = err as AxiosError<{ message?: string; code?: string }>;
        const status = ax.response?.status;
        const body = ax.response?.data;
        const code = body?.code;
        const msg = body?.message ?? ax.message;
        setItems((prev) =>
          prev.map((it) =>
            it.key === cand.key
              ? {
                  ...it,
                  status: status === 409 ? "skipped" : "error",
                  error: status === 409 ? undefined : msg,
                }
              : it,
          ),
        );
        // Quota exceeded — stop the loop so we don't fire N more 403s.
        // The axios interceptor already surfaced the upsell modal.
        if (code === "QUOTA_UPLOADS_EXCEEDED") {
          stopped = true;
        }
      }
    }
    setRunning(false);
    void qc.invalidateQueries({ queryKey: trackKeys.all });
    void qc.invalidateQueries({ queryKey: savesKeys.all });
    void qc.invalidateQueries({ queryKey: quotaKeys.all });
  }

  if (!open) return null;

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="fixed inset-0 z-[86] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-4">
            <div>
              <h2
                id="import-title"
                className="flex items-center gap-2 text-base font-semibold tracking-tight"
              >
                <Upload
                  className="h-4 w-4 text-[var(--color-primary)]"
                  strokeWidth={2.3}
                />
                {t("import.title", {
                  defaultValue: "Importar canciones",
                })}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {t("import.subtitle", {
                  defaultValue:
                    "Arrastrá archivos o elegí una carpeta. MP3, FLAC, WAV, M4A, OGG, AAC, OPUS.",
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close", { defaultValue: "Cerrar" })}
              className="rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>

          <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
                isDragging
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
              }`}
            >
              <Music4
                className="h-10 w-10 text-[var(--color-muted)]"
                strokeWidth={1.5}
              />
              <p className="text-sm text-[var(--color-muted)]">
                {t("import.dropHint", {
                  defaultValue: "Arrastrá tus archivos aquí",
                })}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => filesInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
                >
                  <Upload className="h-4 w-4" strokeWidth={2.2} />
                  {t("import.pickFiles", {
                    defaultValue: "Elegir archivos",
                  })}
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
                >
                  <FolderOpen className="h-4 w-4" strokeWidth={2.2} />
                  {t("import.pickFolder", {
                    defaultValue: "Escanear carpeta",
                  })}
                </button>
              </div>
              <input
                ref={filesInputRef}
                type="file"
                multiple
                accept="audio/*,.flac,.opus"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                // webkitdirectory is the de-facto cross-browser way to pick a
                // folder; non-Chromium browsers fall back to file picker.
                {...({ webkitdirectory: "true", directory: "true" } as Record<
                  string,
                  string
                >)}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {items.length > 0 ? (
              <ul className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] p-2">
                {items.map((it) => (
                  <li
                    key={it.key}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--color-surface-alt)]"
                  >
                    <ItemIcon status={it.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">
                        {it.relPath}
                      </p>
                      <p className="truncate text-xs text-[var(--color-muted)]">
                        {formatBytes(it.file.size)}
                        {it.status === "skipped"
                          ? ` · ${t("import.dupSkipped", { defaultValue: "ya existe en tu biblioteca" })}`
                          : null}
                        {it.error ? ` · ${it.error}` : null}
                      </p>
                    </div>
                    {it.status === "pending" && !running ? (
                      <button
                        type="button"
                        onClick={() => removeItem(it.key)}
                        aria-label={t("common.remove", {
                          defaultValue: "Quitar",
                        })}
                        className="rounded-lg p-1 text-[var(--color-muted)] transition hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] px-6 py-4">
            <p className="text-xs text-[var(--color-muted)]">
              {items.length === 0
                ? null
                : running
                  ? t("import.progress", {
                      defaultValue: "Subiendo… {{done}} / {{total}}",
                      done: doneCount,
                      total: items.length,
                    })
                  : t("import.ready", {
                      defaultValue: "{{count}} listas para subir",
                      count: pendingCount,
                    })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={running}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-muted)] disabled:opacity-60"
              >
                {t("common.close", { defaultValue: "Cerrar" })}
              </button>
              <button
                type="button"
                onClick={startUpload}
                disabled={running || pendingCount === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-page)] transition hover:scale-[1.02] disabled:opacity-50"
              >
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
                ) : (
                  <Upload className="h-4 w-4" strokeWidth={2.2} />
                )}
                {t("import.upload", {
                  defaultValue: "Subir {{count}}",
                  count: pendingCount,
                })}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

function ItemIcon({ status }: { status: ItemStatus }) {
  if (status === "uploading") {
    return (
      <Loader2
        className="h-4 w-4 animate-spin text-[var(--color-primary)]"
        strokeWidth={2.2}
      />
    );
  }
  if (status === "done") {
    return (
      <CheckCircle2
        className="h-4 w-4 text-[var(--color-primary)]"
        strokeWidth={2.3}
      />
    );
  }
  if (status === "error") {
    return <AlertCircle className="h-4 w-4 text-rose-400" strokeWidth={2.3} />;
  }
  if (status === "skipped") {
    return (
      <CheckCircle2
        className="h-4 w-4 text-[var(--color-muted)]"
        strokeWidth={2.3}
      />
    );
  }
  return (
    <Music4 className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={2.2} />
  );
}

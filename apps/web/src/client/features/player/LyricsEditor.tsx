import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { updateTrackLyrics } from "../../../shared/api/tracks";
import { parseLrc } from "../../../shared/utils/lrc";

type LyricsEditorProps = {
  trackId: string;
  initialLrc: string | null;
  initialText: string | null;
  open: boolean;
  onClose: () => void;
};

type Mode = "lrc" | "text";

function detectMode(value: string): Mode {
  // A single timestamp marker is enough to treat the upload as synced LRC.
  return /\[\d{1,2}:\d{1,2}/.test(value) ? "lrc" : "text";
}

/**
 * Modal editor for a track's lyrics. Accepts pasted text or .lrc/.txt file
 * upload. Detects the format heuristically (timestamp marker present → LRC)
 * and writes the appropriate column via the existing PATCH /library/tracks/:id.
 */
export default function LyricsEditor({
  trackId,
  initialLrc,
  initialText,
  open,
  onClose,
}: LyricsEditorProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = useState(initialLrc ?? initialText ?? "");
  const [mode, setMode] = useState<Mode>(initialLrc ? "lrc" : "text");

  // Reset state every time the modal opens for a (potentially new) track.
  useEffect(() => {
    if (!open) return;
    const next = initialLrc ?? initialText ?? "";
    setValue(next);
    setMode(initialLrc ? "lrc" : "text");
  }, [open, initialLrc, initialText]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const save = useMutation({
    mutationFn: async () => {
      const trimmed = value.trim();
      const isEmpty = trimmed.length === 0;
      const detected = isEmpty ? mode : detectMode(trimmed);
      await updateTrackLyrics(trackId, {
        lyricsLrc: detected === "lrc" && !isEmpty ? trimmed : null,
        lyricsText: detected === "text" && !isEmpty ? trimmed : null,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["track-lyrics", trackId] });
      onClose();
    },
  });

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setValue(text);
      setMode(detectMode(text));
    };
    reader.readAsText(file);
  }

  if (!open) return null;

  const previewLines = mode === "lrc" ? parseLrc(value) : [];
  const detectedMode = value.trim() ? detectMode(value) : mode;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[71] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {t("player.lyrics.title")}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                Pega la letra o sube un archivo .lrc / .txt. El formato se
                detecta automáticamente.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>

          <div className="flex flex-col gap-3 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${detectedMode === "lrc" ? "bg-[var(--color-accent)]" : "bg-[var(--color-muted)]"}`}
                />
                {detectedMode === "lrc"
                  ? `${previewLines.length} líneas sincronizadas`
                  : "Texto plano"}
              </span>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]">
                <Upload className="h-3.5 w-3.5" strokeWidth={2.3} />
                Subir archivo
                <input
                  type="file"
                  accept=".lrc,.txt,text/plain"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setMode(detectMode(e.target.value));
              }}
              placeholder={`[00:12.30] Primera línea sincronizada\n[00:15.80] Segunda línea\n\n— o pega solo texto plano —`}
              className="h-72 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 font-mono text-sm leading-6 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />

            {save.isError ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
              >
                No se pudo guardar. Intenta de nuevo.
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={save.isPending}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-muted)] disabled:opacity-60"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-page)] transition hover:scale-[1.02] disabled:opacity-60"
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
              ) : null}
              {t("common.save")}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Mic2, Pencil } from "lucide-react";

import { useLyrics } from "../../../shared/hooks/useLyrics";
import { usePlayerStore } from "../../stores/playStore";
import { getTrackLyrics } from "../../../shared/api/tracks";
import LyricsEditor from "./LyricsEditor";

type LyricsPanelProps = {
  trackId: string | null;
};

/**
 * Karaoke-style lyrics panel for the expanded player. When LRC timestamps
 * are present, highlights the active line and auto-scrolls it to the center
 * of the panel. Clicking a synced line seeks the audio engine to that point.
 */
export default function LyricsPanel({ trackId }: LyricsPanelProps) {
  const { t } = useTranslation();
  const { mode, lines, plainText, currentLineIndex, isLoading } =
    useLyrics(trackId);
  const seek = usePlayerStore((s) => s.seek);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Pull the raw payload so the editor can seed its textarea with the same
  // content the user already uploaded (avoids forcing them to re-type).
  const raw = useQuery({
    queryKey: ["track-lyrics", trackId],
    enabled: Boolean(trackId) && editorOpen,
    queryFn: () => getTrackLyrics(trackId as string),
  });

  useEffect(() => {
    if (mode !== "synced" || currentLineIndex < 0) return;
    const node = activeRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [mode, currentLineIndex]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div className="flex items-center gap-2 text-[var(--color-text)]">
          <Mic2
            className="h-4 w-4 text-[var(--color-primary)]"
            strokeWidth={2.3}
          />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">
            {t("player.lyrics.title")}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {mode === "plain" ? (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {t("player.lyrics.plainFallback")}
            </span>
          ) : null}
          {trackId ? (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
            >
              <Pencil className="h-3 w-3" strokeWidth={2.3} />
              Editar
            </button>
          ) : null}
        </div>
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-8 py-12 text-center"
      >
        {isLoading ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t("player.lyrics.loading")}
          </p>
        ) : mode === "none" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Mic2
              className="h-10 w-10 text-[var(--color-muted)]/40"
              strokeWidth={1.5}
            />
            <p className="max-w-xs text-sm leading-6 text-[var(--color-muted)]">
              {t("player.lyrics.empty")}
            </p>
            {trackId ? (
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20"
              >
                <Pencil className="h-3 w-3" strokeWidth={2.3} />
                Subir letra
              </button>
            ) : null}
          </div>
        ) : mode === "plain" ? (
          <pre className="whitespace-pre-wrap font-sans text-base leading-9 text-[var(--color-text)]/80">
            {plainText}
          </pre>
        ) : (
          <div className="flex flex-col gap-2">
            {lines.map((line, i) => {
              const isActive = i === currentLineIndex;
              const isPast = i < currentLineIndex;
              return (
                <button
                  key={`${line.timeMs}-${i}`}
                  ref={isActive ? activeRef : undefined}
                  type="button"
                  onClick={() => seek(line.timeMs)}
                  className={`block w-full rounded-lg px-3 py-1.5 text-center transition ${
                    isActive
                      ? "text-2xl font-semibold text-[var(--color-primary)]"
                      : isPast
                        ? "text-base font-medium text-[var(--color-muted)]/70 hover:text-[var(--color-text)]"
                        : "text-base font-medium text-[var(--color-text)]/55 hover:text-[var(--color-text)]"
                  }`}
                >
                  {line.text || "♪"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {trackId ? (
        <LyricsEditor
          trackId={trackId}
          initialLrc={raw.data?.lrc ?? null}
          initialText={raw.data?.text ?? null}
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
        />
      ) : null}
    </section>
  );
}

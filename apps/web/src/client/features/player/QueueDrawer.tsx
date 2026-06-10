import { useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  ListMusic,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "../../stores/playStore";

/**
 * Side panel showing what's queued up next. Mounted at the layout level
 * (always available) and revealed via `openQueueDrawer`. Lets the user:
 *  - See the current track plus everything queued after it
 *  - Skip directly to any item (double-click)
 *  - Reorder upcoming items with up/down arrows
 *  - Remove items one by one or clear the whole tail
 */
export default function QueueDrawer() {
  const isOpen = usePlayerStore((s) => s.queueDrawerOpen);
  const close = usePlayerStore((s) => s.closeQueueDrawer);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const { t } = useTranslation();

  // ESC to close.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const upcoming = queue.slice(queueIndex + 1);
  const totalAfter = upcoming.length;

  async function jumpTo(targetIndex: number) {
    // We move with the existing next/previous actions so the engine load
    // path is reused — avoids a custom "jumpTo" we'd have to keep in sync.
    const delta = targetIndex - queueIndex;
    if (delta === 0) return;
    const step = delta > 0 ? next : previous;
    for (let i = 0; i < Math.abs(delta); i++) await step();
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={close}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("queue.title", { defaultValue: "Cola de reproducción" })}
        className="fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-md flex-col border-l border-white/10 bg-[var(--color-page)] text-[var(--color-text)] shadow-[0_0_60px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <ListMusic className="h-5 w-5" strokeWidth={2.2} />
            <h2 className="text-base font-semibold tracking-tight">
              {t("queue.title", { defaultValue: "Cola de reproducción" })}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            aria-label={t("common.close", { defaultValue: "Cerrar" })}
          >
            <X className="h-4 w-4" strokeWidth={2.3} />
          </button>
        </header>

        {/* Now playing */}
        {currentTrack ? (
          <section className="border-b border-[var(--color-border)] px-6 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {t("queue.nowPlaying", { defaultValue: "Sonando ahora" })}
            </p>
            <div className="flex items-center gap-3">
              {currentTrack.cover ? (
                <img
                  src={currentTrack.cover}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-md bg-[var(--color-surface-alt)]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--color-primary)]">
                  {currentTrack.title}
                </p>
                <p className="truncate text-xs text-[var(--color-muted)]">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* Up next */}
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-6 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {t("queue.upNext", {
                defaultValue: "A continuación · {{count}}",
                count: totalAfter,
              })}
            </p>
            {totalAfter > 0 ? (
              <button
                type="button"
                onClick={clearQueue}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)] transition hover:text-[var(--color-accent)]"
              >
                <Trash2 className="h-3 w-3" strokeWidth={2.3} />
                {t("queue.clear", { defaultValue: "Vaciar" })}
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {totalAfter === 0 ? (
              <div className="mx-3 mt-4 rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center">
                <p className="text-xs text-[var(--color-muted)]">
                  {t("queue.empty", {
                    defaultValue:
                      "La cola está vacía. Usa el menú de un track para agregarlo aquí.",
                  })}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {upcoming.map((track, i) => {
                  const absoluteIndex = queueIndex + 1 + i;
                  const isFirst = i === 0;
                  const isLast = i === upcoming.length - 1;
                  return (
                    <li key={`${track.id}-${absoluteIndex}`}>
                      <div className="group flex items-center gap-2 rounded-md p-2 transition hover:bg-[var(--color-surface-alt)]">
                        <button
                          type="button"
                          onDoubleClick={() => void jumpTo(absoluteIndex)}
                          className="flex flex-1 items-center gap-3 text-left"
                          title={t("queue.doubleClickToPlay", {
                            defaultValue: "Doble click para reproducir",
                          })}
                        >
                          {track.cover ? (
                            <img
                              src={track.cover}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 shrink-0 rounded bg-[var(--color-surface-alt)]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[var(--color-text)]">
                              {track.title}
                            </p>
                            <p className="truncate text-[10px] text-[var(--color-muted)]">
                              {track.artist}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => void jumpTo(absoluteIndex)}
                            title={t("queue.playNow", {
                              defaultValue: "Reproducir ahora",
                            })}
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-[var(--color-primary)]/15 hover:text-[var(--color-primary)]"
                          >
                            <Play
                              className="h-3 w-3"
                              strokeWidth={2.4}
                              fill="currentColor"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              reorderQueue(absoluteIndex, absoluteIndex - 1)
                            }
                            disabled={isFirst}
                            title={t("queue.moveUp", { defaultValue: "Subir" })}
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronUp
                              className="h-3.5 w-3.5"
                              strokeWidth={2.4}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              reorderQueue(absoluteIndex, absoluteIndex + 1)
                            }
                            disabled={isLast}
                            title={t("queue.moveDown", {
                              defaultValue: "Bajar",
                            })}
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronDown
                              className="h-3.5 w-3.5"
                              strokeWidth={2.4}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromQueue(absoluteIndex)}
                            title={t("queue.remove", {
                              defaultValue: "Quitar de la cola",
                            })}
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-[var(--color-accent)]/15 hover:text-[var(--color-accent)]"
                          >
                            <X className="h-3 w-3" strokeWidth={2.6} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </aside>
    </>
  );
}

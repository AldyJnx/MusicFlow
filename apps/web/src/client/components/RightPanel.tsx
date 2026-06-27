import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "../stores/playStore";

const GRADS = [
  "linear-gradient(135deg,#7c5ce8,#e85cc0)",
  "linear-gradient(135deg,#4cf1a0,#3aa0ff)",
  "linear-gradient(135deg,#e85cc0,#ff8a5c)",
  "linear-gradient(135deg,#5c8cff,#7c5ce8)",
  "linear-gradient(135deg,#ff5c8a,#7c5ce8)",
  "linear-gradient(135deg,#4cf1a0,#7c5ce8)",
];
function gradOf(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return GRADS[h % GRADS.length];
}

function fmt(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Animated EQ bars (mirrors the pretesis "now playing" indicator). */
function EqBars({ color = "var(--color-accent)" }: { color?: string }) {
  return (
    <div className="flex h-[15px] items-end gap-[2.5px]">
      {[".7s", ".9s 0.2s", "1.1s 0.1s"].map((a, i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-[2px]"
          style={{
            height: "100%",
            background: color,
            transformOrigin: "bottom",
            animation: `eqbar ${a} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Persistent right panel — the pretesis queue/assistant column. Shows what's
 * playing now and what's coming up next, driven by the live player store.
 * Collapses to a 64px rail of cover thumbs.
 */
export default function RightPanel({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const [tab, setTab] = useState<"queue" | "chat">("queue");

  const upcoming = queue
    .slice(queueIndex + 1)
    .map((trk, i) => ({ trk, absIndex: queueIndex + 1 + i }));

  if (collapsed) {
    return (
      <div className="sticky top-0 z-10 hidden h-screen w-16 flex-none flex-col items-center gap-2.5 border-l border-[var(--color-line)] bg-[rgba(8,8,16,.4)] px-0 pb-3.5 pt-[58px] backdrop-blur-[var(--glass-blur)] lg:flex">
        <button
          type="button"
          onClick={onToggle}
          title={t("right.expand", { defaultValue: "Expandir panel" })}
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] border border-[var(--color-line)] bg-white/[0.03] text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => openAiPrompt()}
          title={t("right.assistant", { defaultValue: "Asistente IA" })}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] border border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
        >
          <Sparkles
            className="h-[17px] w-[17px]"
            fill="currentColor"
            stroke="none"
          />
        </button>
        <div className="my-0.5 h-px w-[26px] flex-none bg-[var(--color-line)]" />
        {currentTrack ? (
          <div
            className="relative h-[42px] w-[42px] flex-none rounded-[11px] border-2 border-[var(--color-accent)] shadow-[0_4px_12px_-4px_rgba(0,0,0,.6)]"
            style={{ background: gradOf(currentTrack.id) }}
            title={currentTrack.title}
          >
            {currentTrack.cover ? (
              <img
                src={currentTrack.cover}
                alt=""
                className="h-full w-full rounded-[9px] object-cover"
              />
            ) : null}
          </div>
        ) : null}
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto pt-0.5">
          {upcoming.slice(0, 12).map(({ trk, absIndex }) => (
            <button
              key={trk.id + absIndex}
              type="button"
              onClick={() => void playTrackList(queue, absIndex)}
              title={trk.title}
              className="h-[42px] w-[42px] flex-none rounded-[11px] shadow-[0_4px_12px_-4px_rgba(0,0,0,.6)] transition hover:scale-105"
              style={{ background: gradOf(trk.id) }}
            >
              {trk.cover ? (
                <img
                  src={trk.cover}
                  alt=""
                  className="h-full w-full rounded-[11px] object-cover"
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="sticky top-0 z-10 hidden h-screen w-[322px] flex-none flex-col border-l border-[var(--color-line)] bg-[rgba(8,8,16,.4)] backdrop-blur-[var(--glass-blur)] lg:flex">
      <header className="flex h-[62px] flex-none items-center gap-2 border-b border-[var(--color-line)] px-3">
        <button
          type="button"
          onClick={onToggle}
          title={t("right.collapse", { defaultValue: "Plegar panel" })}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] border border-[var(--color-line)] bg-white/[0.03] text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
        {(["queue", "chat"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => (id === "chat" ? openAiPrompt() : setTab(id))}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
              tab === id
                ? "bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] text-[var(--color-text)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {id === "queue"
              ? t("right.queue", { defaultValue: "Cola" })
              : t("right.assistant", { defaultValue: "Asistente IA" })}
          </button>
        ))}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3.5">
        <span
          className="mb-1.5 text-[var(--color-muted)]"
          style={{ font: "700 9.5px var(--font-mono)", letterSpacing: ".16em" }}
        >
          {t("right.nowPlaying", { defaultValue: "REPRODUCIENDO AHORA" })}
        </span>

        {currentTrack ? (
          <div className="mb-2.5 flex items-center gap-3 rounded-[14px] border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] p-2.5">
            <div
              className="h-[46px] w-[46px] flex-none overflow-hidden rounded-[11px] shadow-[0_4px_12px_-4px_rgba(0,0,0,.6)]"
              style={{ background: gradOf(currentTrack.id) }}
            >
              {currentTrack.cover ? (
                <img
                  src={currentTrack.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-bold">
                {currentTrack.title}
              </div>
              <div className="truncate text-[11.5px] font-medium text-[var(--color-muted)]">
                {currentTrack.artist}
              </div>
            </div>
            <EqBars />
          </div>
        ) : (
          <div className="mb-2.5 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-glass)] p-4 text-center text-xs text-[var(--color-muted)]">
            {t("right.idle", { defaultValue: "Nada en reproducción" })}
          </div>
        )}

        <span
          className="mb-1 text-[var(--color-muted)]"
          style={{ font: "700 9.5px var(--font-mono)", letterSpacing: ".16em" }}
        >
          {t("right.upNext", { defaultValue: "A CONTINUACIÓN" })} ·{" "}
          {upcoming.length}
        </span>

        {upcoming.length === 0 ? (
          <p className="px-1 py-2 text-xs text-[var(--color-muted)]">
            {t("right.queueEmpty", { defaultValue: "La cola está vacía." })}
          </p>
        ) : (
          upcoming.map(({ trk, absIndex }) => (
            <button
              key={trk.id + absIndex}
              type="button"
              onClick={() => void playTrackList(queue, absIndex)}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.05]"
            >
              <div
                className="h-10 w-10 flex-none overflow-hidden rounded-[10px] shadow-[0_4px_12px_-4px_rgba(0,0,0,.6)]"
                style={{ background: gradOf(trk.id) }}
              >
                {trk.cover ? (
                  <img
                    src={trk.cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">
                  {trk.title}
                </div>
                <div className="truncate text-[11px] font-medium text-[var(--color-muted)]">
                  {trk.artist}
                </div>
              </div>
              <span
                className="text-[var(--color-muted)]"
                style={{ font: "600 11px var(--font-mono)" }}
              >
                {fmt(trk.durationMs)}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

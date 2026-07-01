import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, SendHorizontal, Sparkles, X } from "lucide-react";

import { usePlayerStore } from "../../stores/playStore";
import { useEqualizer } from "../../../shared/hooks/useEqualizer";
import {
  acceptSuggestion,
  provideFeedback,
  suggestEQ,
  type AISuggestResponse,
  type EQSuggestion,
} from "../../../shared/api/ai-agent";
import { useInvalidateQuota } from "../../../shared/hooks/useQuota";

const SHORTCUT_CHIPS = [
  { id: "warmer", label: "Más cálido", prompt: "Quiero un sonido más cálido" },
  {
    id: "brighter",
    label: "Más brillante",
    prompt: "Hazlo más brillante en los agudos",
  },
  { id: "punch", label: "Más punch", prompt: "Dale más punch a los bajos" },
  {
    id: "vocal",
    label: "Para vocal",
    prompt: "Realza la voz humana sin perder cuerpo",
  },
] as const;

function EQBars({ bands }: { bands: number[] }) {
  return (
    <div
      className="flex h-12 items-end gap-[3px]"
      aria-label="Curva propuesta por la IA"
    >
      {bands.map((gain, i) => {
        const heightPct = Math.max(6, (Math.abs(gain) / 15) * 100);
        const isPositive = gain >= 0;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${heightPct}%`,
              backgroundColor: isPositive
                ? "var(--color-primary)"
                : "var(--color-accent)",
              opacity: gain === 0 ? 0.25 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Quick prompt modal triggered from the persistent player.
 * Sends the current track as context, previews the suggested EQ curve and
 * lets the user Apply / Discard without leaving the player. For deeper
 * conversation, a link drops them into the full /ai-mixer page.
 */
export default function AIQuickPrompt() {
  const navigate = useNavigate();

  const isOpen = usePlayerStore((s) => s.aiPromptOpen);
  const close = usePlayerStore((s) => s.closeAiPrompt);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const { setBands, setEffects } = useEqualizer();
  const invalidateQuota = useInvalidateQuota();

  const [input, setInput] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<EQSuggestion | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInput("");
      setRequestId(null);
      setSuggestion(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const suggestMutation = useMutation({
    mutationFn: (prompt: string) =>
      suggestEQ({ prompt, trackId: currentTrack?.id }),
    onSuccess: (data: AISuggestResponse) => {
      setRequestId(data.requestId);
      setSuggestion(data.suggestion);
      void invalidateQuota();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => {
      if (!requestId) {
        return Promise.reject(new Error("missing requestId"));
      }
      // With a track, apply to that song's scope; with nothing playing, apply
      // the suggestion to the global EQ so the panel still works anywhere.
      return currentTrack
        ? acceptSuggestion(requestId, "TRACK", currentTrack.id)
        : acceptSuggestion(requestId, "GLOBAL");
    },
    onSuccess: () => {
      if (!suggestion) return;
      setBands(suggestion.bands, 250);
      setEffects({
        bassBoost: suggestion.bassBoost,
        virtualizer: suggestion.virtualizer,
        loudness: suggestion.loudness,
        reverbPreset: suggestion.reverbPreset,
        reverbAmount: suggestion.reverbAmount,
      });
      close();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!requestId) return Promise.resolve(null);
      return provideFeedback(requestId, "BAD");
    },
    onSettled: () => {
      setSuggestion(null);
      setRequestId(null);
    },
  });

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || suggestMutation.isPending) return;
    suggestMutation.mutate(trimmed);
  }

  function openFullAgent() {
    close();
    setExpanded(false);
    const id = currentTrack?.id;
    navigate(id ? `/ai-mixer?trackId=${id}` : "/ai-mixer");
  }

  if (!isOpen) return null;

  const isWaitingForSuggestion = suggestMutation.isPending;
  const isApplying = acceptMutation.isPending;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={close}
        className="fixed inset-0 z-[60] bg-[rgba(4,4,10,.55)] backdrop-blur-[14px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sugerencia rápida del agente IA"
        className="fixed inset-0 z-[61] flex items-center justify-center p-4"
        onClick={close}
        style={{ animation: "fadeUp .25s ease both" }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] text-[var(--color-text)] shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-[var(--glass-blur)]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] px-6 py-5">
            <div className="min-w-0 flex items-center gap-3">
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] text-white shadow-[0_6px_16px_-4px_var(--color-primary)]"
                style={{
                  background:
                    "linear-gradient(145deg,var(--color-primary),var(--color-accent))",
                }}
              >
                <Sparkles
                  className="h-[18px] w-[18px]"
                  fill="currentColor"
                  stroke="none"
                />
              </span>
              <div className="min-w-0">
                <h2
                  className="text-sm font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Asistente de sonido
                </h2>
                <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                  {currentTrack ? (
                    <>
                      Ajusta el EQ de{" "}
                      <span className="text-[var(--color-accent)]">
                        {currentTrack.title}
                      </span>
                    </>
                  ) : (
                    "Ajusta el sonido global de tu música"
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="flex-none rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
            >
              <X className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 px-6 py-5">
            {suggestion ? (
              <article className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-white/[0.02] p-4">
                <p
                  className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Curva propuesta
                </p>
                <div className="mt-3 rounded-lg bg-[var(--color-surface-alt)] px-3 py-2">
                  <EQBars bands={suggestion.bands} />
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text)]">
                  {suggestion.explanation}
                </p>
                {suggestion.segments && suggestion.segments.length > 0 ? (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Incluye {suggestion.segments.length} sugerencia
                    {suggestion.segments.length === 1 ? "" : "s"} por segmento.
                  </p>
                ) : null}
              </article>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isWaitingForSuggestion || isApplying}
                placeholder="Ej: Hazlo más cálido para escuchar de noche"
                aria-label="Prompt para el agente IA"
                className="flex-1 bg-transparent py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isWaitingForSuggestion || isApplying}
                aria-label="Enviar prompt"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-[0_8px_18px_-6px_var(--color-primary)] transition hover:brightness-110 disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(145deg,var(--color-primary),var(--color-accent))",
                }}
              >
                {isWaitingForSuggestion ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
                ) : (
                  <SendHorizontal className="h-4 w-4" strokeWidth={2.2} />
                )}
              </button>
            </form>

            {!suggestion ? (
              <div className="flex flex-wrap gap-2">
                {SHORTCUT_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setInput(chip.prompt)}
                    disabled={isWaitingForSuggestion}
                    className="rounded-full border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition hover:border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] hover:text-[var(--color-accent)] disabled:opacity-60"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            ) : null}

            {suggestMutation.isError ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
              >
                No se pudo obtener una sugerencia. Intenta de nuevo en un
                momento.
              </p>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] px-6 py-4">
            <button
              type="button"
              onClick={openFullAgent}
              className="text-xs font-medium text-[var(--color-muted)] underline-offset-4 transition hover:text-[var(--color-text)] hover:underline"
            >
              Conversación completa →
            </button>

            {suggestion ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => rejectMutation.mutate()}
                  disabled={isApplying || rejectMutation.isPending}
                  className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:border-rose-400/40 hover:text-[var(--color-text)] disabled:opacity-60"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => acceptMutation.mutate()}
                  disabled={isApplying}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-[0_10px_22px_-6px_var(--color-primary)] transition hover:brightness-110 disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
                  }}
                >
                  {isApplying ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      strokeWidth={2.2}
                    />
                  ) : null}
                  Aplicar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

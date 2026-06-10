import { useRef, useState } from "react";
import {
  Loader2,
  SendHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import ClientLayout from "../../layout/ClientLayout";
import PremiumLockedPage from "../billing/PremiumLockedPage";
import { usePremiumGate } from "../../../shared/hooks/usePremiumGate";
import {
  acceptSuggestion,
  provideFeedback,
  suggestEQ,
} from "../../../shared/api/ai-agent";
import type {
  AISuggestResponse,
  EQSuggestion,
  SuggestedSegment,
} from "../../../shared/api/ai-agent";
import { useInvalidateQuota } from "../../../shared/hooks/useQuota";

// TODO: history sidebar

// ── Types ──────────────────────────────────────────────────────────────────

type MessageBase = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type UserMessage = MessageBase & { role: "user" };

type AssistantMessage = MessageBase & {
  role: "assistant";
  requestId?: string;
  suggestion?: EQSuggestion;
  /** whether the suggestion card has been dismissed locally */
  dismissed?: boolean;
  /** whether the user has already given feedback */
  feedbackGiven?: boolean;
};

type ChatMessage = UserMessage | AssistantMessage;

// ── Constants ──────────────────────────────────────────────────────────────

const WELCOME_CONTENT =
  "Hola. Soy tu asistente de audio IA. Puedo ajustar la ecualización, profundidad y espacialidad de tu música en tiempo real. ¿Qué buscas hoy?";

const SHORTCUT_CHIPS = [
  { id: 1, label: "Más cálido", prompt: "Quiero un sonido más cálido" },
  {
    id: 2,
    label: "Más brillante",
    prompt: "Hazlo más brillante en los agudos",
  },
  {
    id: 3,
    label: "Cinemático",
    prompt: "Dame un sonido cinemático con cuerpo",
  },
  { id: 4, label: "Club", prompt: "Boost de bajos estilo club" },
  { id: 5, label: "Para vocal", prompt: "Realza la voz humana" },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function msToTimecode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function buildEffectsSummary(suggestion: EQSuggestion): string {
  const parts: string[] = [];
  if (suggestion.bassBoost > 0) parts.push(`Bass +${suggestion.bassBoost}`);
  if (suggestion.virtualizer > 0)
    parts.push(`Virtualizer ${suggestion.virtualizer}`);
  if (suggestion.loudness > 0) parts.push(`Loudness ${suggestion.loudness}`);
  if (suggestion.reverbPreset !== "NONE") {
    parts.push(`Reverb ${suggestion.reverbPreset} ${suggestion.reverbAmount}`);
  }
  return parts.join(" · ");
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EQBars({ bands }: { bands: number[] }) {
  return (
    <div className="flex h-16 items-end gap-1">
      {bands.map((gain, i) => {
        const heightPct = Math.max(4, (Math.abs(gain) / 15) * 100);
        const isPositive = gain >= 0;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${heightPct}%`,
              backgroundColor: isPositive ? "#22d3ee" : "#f59e0b",
              opacity: gain === 0 ? 0.25 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

function SegmentList({ segments }: { segments: SuggestedSegment[] }) {
  if (segments.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-1">
      {segments.map((seg, i) => (
        <p key={i} className="text-xs text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-text)]">
            Segmento [{seg.label}]:
          </span>{" "}
          {msToTimecode(seg.startMs)}–{msToTimecode(seg.endMs)}
        </p>
      ))}
    </div>
  );
}

type SuggestionCardProps = {
  requestId: string;
  suggestion: EQSuggestion;
  onDismiss: () => void;
  onAccepted: () => void;
  onFeedbackGiven: () => void;
  feedbackGiven: boolean;
};

function SuggestionCard({
  requestId,
  suggestion,
  onDismiss,
  onAccepted,
  onFeedbackGiven,
  feedbackGiven,
}: SuggestionCardProps) {
  const acceptMutation = useMutation({
    mutationFn: () => acceptSuggestion(requestId, "GLOBAL"),
    onSuccess: () => onAccepted(),
  });

  const feedbackMutation = useMutation({
    mutationFn: (fb: "GOOD" | "BAD") => provideFeedback(requestId, fb),
    onSuccess: () => onFeedbackGiven(),
  });

  const effectsSummary = buildEffectsSummary(suggestion);

  return (
    <article className="mt-3 rounded-[22px] border border-[var(--color-primary)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-page)_100%)] p-5 shadow-[0_0_28px_rgba(59,130,246,0.18)]">
      {/* EQ bar visualisation */}
      <div className="rounded-2xl bg-[var(--color-surface-alt)] px-4 pb-3 pt-2">
        <EQBars bands={suggestion.bands} />
      </div>

      {/* Effects summary */}
      {effectsSummary ? (
        <p className="mt-3 text-xs font-medium text-[var(--color-muted)]">
          {effectsSummary}
        </p>
      ) : null}

      {/* Segments */}
      {suggestion.segments && suggestion.segments.length > 0 ? (
        <SegmentList segments={suggestion.segments} />
      ) : null}

      {/* Action buttons */}
      {acceptMutation.isSuccess ? (
        feedbackGiven ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Gracias por tu feedback.
          </p>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <p className="text-sm text-[var(--color-muted)]">¿Útil?</p>
            <button
              type="button"
              disabled={feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate("GOOD")}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
            >
              <ThumbsUp className="h-4 w-4" strokeWidth={1.9} />
            </button>
            <button
              type="button"
              disabled={feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate("BAD")}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
            >
              <ThumbsDown className="h-4 w-4" strokeWidth={1.9} />
            </button>
          </div>
        )
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
            className="flex-1 rounded-xl bg-[linear-gradient(90deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)] transition hover:brightness-110 disabled:opacity-60"
          >
            {acceptMutation.isPending ? "Aplicando…" : "Aplicar"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            Descartar
          </button>
        </div>
      )}
    </article>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Agent() {
  const { isPremium } = usePremiumGate();
  if (!isPremium) {
    return (
      <ClientLayout>
        <PremiumLockedPage feature="ai" />
      </ClientLayout>
    );
  }
  return <AgentContent />;
}

function AgentContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", content: WELCOME_CONTENT },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const invalidateQuota = useInvalidateQuota();

  const suggestMutation = useMutation({
    mutationFn: (prompt: string) => suggestEQ({ prompt }),
    onSuccess: (data: AISuggestResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: "assistant",
          content: data.suggestion.explanation,
          requestId: data.requestId,
          suggestion: data.suggestion,
          dismissed: false,
          feedbackGiven: false,
        },
      ]);
      void invalidateQuota();
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: "assistant",
          content:
            "Lo siento, el agente está temporalmente indisponible (mock activo si no hay API key).",
        },
      ]);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    },
  });

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || suggestMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, role: "user", content: trimmed },
    ]);
    setInput("");
    suggestMutation.mutate(trimmed);
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      60,
    );
  }

  function dismissCard(messageId: number) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.role === "assistant"
          ? { ...m, dismissed: true }
          : m,
      ),
    );
  }

  function markAccepted(_messageId: number) {
    // Card will show feedback buttons after acceptMutation.isSuccess — no extra state needed here
  }

  function markFeedbackGiven(messageId: number) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.role === "assistant"
          ? { ...m, feedbackGiven: true }
          : m,
      ),
    );
  }

  return (
    <ClientLayout>
      <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--color-secondary),transparent_24%),linear-gradient(180deg,var(--color-page)_0%,var(--color-page)_100%)] text-[var(--color-text)]">
        {/* Header */}
        <div className="shrink-0 border-b border-[var(--color-border)] px-8 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Agente IA
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            Pídele al agente que ajuste tu EQ en lenguaje natural
          </p>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const isAssistant = message.role === "assistant";
              const assistantMsg = isAssistant
                ? (message as AssistantMessage)
                : null;

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 ${isUser ? "justify-end" : ""}`}
                >
                  {/* Avatar — AI */}
                  {isAssistant ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-[0_0_20px_rgba(59,130,246,0.18)]">
                      <Sparkles className="h-4 w-4" strokeWidth={1.9} />
                    </div>
                  ) : null}

                  <div className="flex flex-col">
                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-5 py-4 text-[15px] leading-7 shadow-[0_12px_28px_rgba(0,0,0,0.18)] ${
                        isAssistant
                          ? "max-w-4xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                          : "max-w-3xl border border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-text)] shadow-[0_16px_28px_rgba(18,55,110,0.22)]"
                      }`}
                    >
                      {message.content}
                    </div>

                    {/* Suggestion card (AI messages only) */}
                    {assistantMsg?.suggestion &&
                    !assistantMsg.dismissed &&
                    assistantMsg.requestId ? (
                      <SuggestionCard
                        requestId={assistantMsg.requestId}
                        suggestion={assistantMsg.suggestion}
                        feedbackGiven={assistantMsg.feedbackGiven ?? false}
                        onDismiss={() => dismissCard(message.id)}
                        onAccepted={() => markAccepted(message.id)}
                        onFeedbackGiven={() => markFeedbackGiven(message.id)}
                      />
                    ) : null}
                  </div>

                  {/* Avatar — User */}
                  {isUser ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-primary)] bg-[var(--color-secondary)] text-xs font-semibold text-[var(--color-text)]">
                      🎙
                    </div>
                  ) : null}
                </div>
              );
            })}

            {/* Shortcut chips — always visible below conversation */}
            <div className="flex flex-wrap gap-3">
              {SHORTCUT_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setInput(chip.prompt)}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
                >
                  <span className="text-[var(--color-primary)]">✦</span>
                  <span className="ml-2">{chip.label}</span>
                </button>
              ))}
            </div>

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="shrink-0 bg-[linear-gradient(180deg,var(--color-page)_0%,var(--color-page)_100%)] px-8 pb-10 pt-3">
          <form
            className="mx-auto max-w-5xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex items-center gap-3">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Quiero más bajos y sonido profundo..."
                className="flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
              />

              <button
                type="submit"
                disabled={suggestMutation.isPending || !input.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(180deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)] transition hover:brightness-110 disabled:opacity-50"
              >
                {suggestMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.1} />
                ) : (
                  <SendHorizontal className="h-5 w-5" strokeWidth={2.1} />
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </ClientLayout>
  );
}

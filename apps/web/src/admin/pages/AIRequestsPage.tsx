import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, RefreshCw, Search, ChevronDown, CheckCircle2 } from "lucide-react";
import AdminLayout from "../layout/AdminLayout";
import {
  getAiFeedbackStats,
  getRecentAiRequests,
} from "../../shared/api/admin";
import type { AdminAIRequest, FeedbackValue } from "../../shared/api/admin";

// ─── Types ───────────────────────────────────────────────────────────────────

type FeedbackFilter = FeedbackValue | "ALL" | "NONE";

interface EQSuggestion {
  bands: number[];
  bassBoost?: number;
  virtualizer?: number;
  loudness?: number;
  reverbPreset?: string;
  reverbAmount?: number;
  explanation?: string;
  segments?: Array<{
    label: string;
    startMs: number;
    endMs: number;
    bands: number[];
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  const HH = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${HH}:${min}`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function parseEQ(response: unknown): EQSuggestion | null {
  if (!response || typeof response !== "object") return null;
  const r = response as Record<string, unknown>;
  if (!Array.isArray(r.bands)) return null;
  return r as unknown as EQSuggestion;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${colorClass ?? "text-[var(--color-text)]"}`}
      >
        {value}
      </p>
    </div>
  );
}

function FeedbackBadge({
  feedback,
  wasAccepted,
}: {
  feedback: FeedbackValue | null;
  wasAccepted: boolean;
}) {
  if (feedback === "GOOD") {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
          👍 Good
        </span>
        {wasAccepted && (
          <CheckCircle2
            className="h-3.5 w-3.5 text-emerald-400"
            strokeWidth={2.5}
          />
        )}
      </span>
    );
  }
  if (feedback === "BAD") {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-400">
          👎 Bad
        </span>
        {wasAccepted && (
          <CheckCircle2
            className="h-3.5 w-3.5 text-emerald-400"
            strokeWidth={2.5}
          />
        )}
      </span>
    );
  }
  if (feedback === "NEUTRAL") {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs font-semibold text-[var(--color-muted)]">
          〰 Neutral
        </span>
        {wasAccepted && (
          <CheckCircle2
            className="h-3.5 w-3.5 text-emerald-400"
            strokeWidth={2.5}
          />
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-[var(--color-muted)]">—</span>
      {wasAccepted && (
        <CheckCircle2
          className="h-3.5 w-3.5 text-emerald-400"
          strokeWidth={2.5}
        />
      )}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-[var(--color-border)]">
          {Array.from({ length: 10 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-[var(--color-border)]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── EQ Bars ─────────────────────────────────────────────────────────────────

function EQBars({ bands }: { bands: number[] }) {
  const MAX_HEIGHT = 48; // px for 15 dB
  return (
    <div className="flex items-end gap-0.5" style={{ height: MAX_HEIGHT + 4 }}>
      {bands.map((gain, i) => {
        const h = Math.max(2, (Math.abs(gain) / 15) * MAX_HEIGHT);
        const positive = gain >= 0;
        return (
          <div
            key={i}
            title={`Band ${i + 1}: ${gain > 0 ? "+" : ""}${gain} dB`}
            style={{
              height: h,
              width: 10,
              backgroundColor: positive ? "#22d3ee" : "#f59e0b",
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  request,
  onClose,
}: {
  request: AdminAIRequest;
  onClose: () => void;
}) {
  const eq = parseEQ(request.response);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-[var(--color-page)] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-page)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Detalle del Request
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            <span>{formatDate(request.createdAt)}</span>
            <span>·</span>
            <span>
              {request.user.username} ({request.user.email})
            </span>
            {request.track && (
              <>
                <span>·</span>
                <span>
                  {request.track.title} — {request.track.artist}
                </span>
              </>
            )}
          </div>

          {/* Prompt */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Prompt
            </h3>
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-sm text-[var(--color-text)]">
              {request.prompt}
            </pre>
          </section>

          {/* Context */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Contexto
            </h3>
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-all rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-xs text-[var(--color-muted)]">
              {JSON.stringify(request.context, null, 2)}
            </pre>
          </section>

          {/* EQ Suggestion */}
          {eq && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Sugerencia EQ
              </h3>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                {/* EQ bars */}
                <div className="mb-4">
                  <p className="mb-2 text-xs text-[var(--color-muted)]">
                    Bandas (10) — Cyan = boost, Amber = cut
                  </p>
                  <EQBars
                    bands={
                      eq.bands.length === 10 ? eq.bands : Array(10).fill(0)
                    }
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-[var(--color-muted)]">
                    {[
                      "32",
                      "64",
                      "125",
                      "250",
                      "500",
                      "1k",
                      "2k",
                      "4k",
                      "8k",
                      "16k",
                    ].map((f) => (
                      <span key={f}>{f}</span>
                    ))}
                  </div>
                </div>

                {/* Effects summary */}
                <div className="flex flex-wrap gap-2">
                  {eq.bassBoost !== undefined && eq.bassBoost !== 0 && (
                    <span className="rounded-lg bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
                      Bass Boost: {eq.bassBoost}
                    </span>
                  )}
                  {eq.virtualizer !== undefined && eq.virtualizer !== 0 && (
                    <span className="rounded-lg bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
                      Virtualizer: {eq.virtualizer}
                    </span>
                  )}
                  {eq.loudness !== undefined && eq.loudness !== 0 && (
                    <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                      Loudness: {eq.loudness}
                    </span>
                  )}
                  {eq.reverbPreset && (
                    <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400">
                      Reverb: {eq.reverbPreset}{" "}
                      {eq.reverbAmount !== undefined
                        ? `(${eq.reverbAmount})`
                        : ""}
                    </span>
                  )}
                </div>

                {/* Segments */}
                {eq.segments && eq.segments.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">
                      Segmentos
                    </p>
                    <ul className="flex flex-col gap-2">
                      {eq.segments.map((seg, i) => (
                        <li
                          key={i}
                          className="rounded-lg border border-[var(--color-border)] p-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[var(--color-text)]">
                              {seg.label}
                            </span>
                            <span className="text-[var(--color-muted)]">
                              {(seg.startMs / 1000).toFixed(1)}s –{" "}
                              {(seg.endMs / 1000).toFixed(1)}s
                            </span>
                          </div>
                          {Array.isArray(seg.bands) &&
                            seg.bands.length === 10 && (
                              <div className="mt-2">
                                <EQBars bands={seg.bands} />
                              </div>
                            )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Raw response if not parseable as EQ */}
          {!eq && request.response != null && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Respuesta (raw)
              </h3>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-all rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-xs text-[var(--color-muted)]">
                {JSON.stringify(request.response, null, 2)}
              </pre>
            </section>
          )}

          {/* Explanation */}
          {request.explanation && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Explicación
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text)]">
                {request.explanation}
              </p>
            </section>
          )}

          {/* Feedback */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Feedback
            </h3>
            <div className="flex items-center gap-3">
              <FeedbackBadge
                feedback={request.feedback}
                wasAccepted={request.wasAccepted}
              />
              {request.wasAccepted && (
                <span className="text-xs text-[var(--color-muted)]">
                  Sugerencia aceptada
                </span>
              )}
            </div>
            {request.feedbackComment && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                "{request.feedbackComment}"
              </p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIRequestsPage() {
  const [limit, setLimit] = useState(20);
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminAIRequest | null>(null);

  const feedbackQ = useQuery({
    queryKey: ["admin", "ai-feedback"],
    queryFn: getAiFeedbackStats,
    staleTime: 30_000,
  });

  const requestsQ = useQuery({
    queryKey: ["admin", "ai-requests", { limit }],
    queryFn: () => getRecentAiRequests(limit),
    staleTime: 30_000,
  });

  const stats = feedbackQ.data;
  const satisfactionRate = stats?.satisfactionRate ?? 0;

  const satisfactionColor =
    satisfactionRate >= 70
      ? "text-emerald-400"
      : satisfactionRate >= 40
        ? "text-amber-400"
        : "text-rose-400";

  // Client-side filtering
  const filtered = (requestsQ.data ?? []).filter((req) => {
    const matchFeedback =
      feedbackFilter === "ALL"
        ? true
        : feedbackFilter === "NONE"
          ? req.feedback === null
          : req.feedback === feedbackFilter;

    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      req.prompt.toLowerCase().includes(q) ||
      req.user.email.toLowerCase().includes(q) ||
      req.user.username.toLowerCase().includes(q);

    return matchFeedback && matchSearch;
  });

  const handleClose = useCallback(() => setSelected(null), []);

  const LIMIT_OPTIONS = [10, 20, 50, 100] as const;
  const FEEDBACK_CHIPS: { label: string; value: FeedbackFilter }[] = [
    { label: "All", value: "ALL" },
    { label: "👍 Good", value: "GOOD" },
    { label: "👎 Bad", value: "BAD" },
    { label: "〰 Neutral", value: "NEUTRAL" },
    { label: "Sin feedback", value: "NONE" },
  ];

  return (
    <AdminLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
          {/* ── Header ── */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Requests del Agente IA
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Auditoría de prompts, sugerencias y feedback.
            </p>
          </div>

          {/* ── Stats row ── */}
          {feedbackQ.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl bg-[var(--color-surface-alt)]"
                />
              ))}
            </div>
          ) : feedbackQ.isError ? (
            <p className="text-sm text-rose-400">
              Error cargando estadísticas.
            </p>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Total" value={stats.total} />
              <StatCard
                label="Satisfacción"
                value={`${satisfactionRate.toFixed(1)}%`}
                colorClass={satisfactionColor}
              />
              <StatCard
                label="👍 Good"
                value={stats.good}
                colorClass="text-emerald-400"
              />
              <StatCard
                label="👎 Bad"
                value={stats.bad}
                colorClass="text-rose-400"
              />
            </div>
          ) : null}

          {/* ── Filter toolbar ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Limit selector */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] py-2 pl-3 pr-8 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                {LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} por página
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            </div>

            {/* Feedback chips */}
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setFeedbackFilter(chip.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    feedbackFilter === chip.value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative ml-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="Buscar por prompt o usuario…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* ── Error banner ── */}
          {requestsQ.isError && (
            <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              <span>Error al cargar los requests.</span>
              <button
                type="button"
                onClick={() => requestsQ.refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </button>
            </div>
          )}

          {/* ── Table ── */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left">
                    {[
                      "Creado",
                      "Usuario",
                      "Track",
                      "Prompt",
                      "Modelo",
                      "Tokens",
                      "Costo",
                      "Tiempo",
                      "Feedback",
                      "Acciones",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requestsQ.isLoading ? (
                    <SkeletonRows />
                  ) : !requestsQ.isError && filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-[var(--color-muted)]"
                      >
                        No hay requests todavía. Empieza a usar el agente IA.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-[var(--color-border)] transition hover:bg-[var(--color-page)]/50"
                      >
                        {/* Created */}
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-muted)]">
                          {formatDate(req.createdAt)}
                        </td>

                        {/* Usuario */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--color-text)]">
                            {req.user.username}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {req.user.email}
                          </p>
                        </td>

                        {/* Track */}
                        <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                          {req.track
                            ? `${req.track.title} — ${req.track.artist}`
                            : "—"}
                        </td>

                        {/* Prompt */}
                        <td className="px-4 py-3">
                          <span
                            title={req.prompt}
                            className="cursor-help text-[var(--color-text)]"
                          >
                            {truncate(req.prompt, 80)}
                          </span>
                        </td>

                        {/* Modelo */}
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
                            {req.modelUsed}
                          </span>
                        </td>

                        {/* Tokens */}
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-muted)]">
                          {req.tokensInput} ↑ {req.tokensOutput} ↓
                        </td>

                        {/* Costo */}
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-muted)]">
                          ${Number(req.costUsd).toFixed(5)}
                        </td>

                        {/* Tiempo */}
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-muted)]">
                          {req.responseTimeMs}ms
                        </td>

                        {/* Feedback */}
                        <td className="px-4 py-3">
                          <FeedbackBadge
                            feedback={req.feedback}
                            wasAccepted={req.wasAccepted}
                          />
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelected(req)}
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Row count */}
            {!requestsQ.isLoading && !requestsQ.isError && requestsQ.data && (
              <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)]">
                Mostrando {filtered.length} de {requestsQ.data.length} requests
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Detail Modal ── */}
      {selected && <DetailModal request={selected} onClose={handleClose} />}
    </AdminLayout>
  );
}

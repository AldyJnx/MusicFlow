import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  BarElement,
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import {
  getAiCosts,
  listAiRequests,
  listAllAiRequests,
} from "../../shared/api/admin";
import type {
  AdminAIRequest,
  AICostsReport,
  AiUsageScope,
} from "../../shared/api/admin";
import { exportExcel } from "../../shared/utils/exportExcel";

const PAGE_SIZE = 10;

const SCOPE_LABELS: Record<AiUsageScope, string> = {
  all: "Todos",
  user: "Usuario",
  admin: "Admin",
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

const PERIODS = ["day", "month", "year"] as const;
type Period = (typeof PERIODS)[number];

const FULFILMENT_LABELS: Record<
  AiUsageScope,
  { rate: string; accepted: string; rejected: string }
> = {
  user: {
    rate: "peticiones cumplidas",
    accepted: "aceptadas",
    rejected: "no aceptadas",
  },
  admin: {
    rate: "propuestas aplicadas",
    accepted: "aplicadas",
    rejected: "descartadas o pendientes",
  },
  all: {
    rate: "peticiones cumplidas",
    accepted: "aceptadas",
    rejected: "no aceptadas",
  },
};

const PURPOSE_LABELS = {
  GLOBAL: "Sugerencias IA",
  PLAYLIST: "Playlists",
  TRACK: "Canciones",
  SEGMENT: "Segmentos",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncate(value: string, max = 80) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

import { generateAiReportPdf } from "../../shared/utils/generateAiReportPdf";

function CostSummary({
  report,
  scope,
  onScopeChange,
}: {
  report: AICostsReport;
  scope: AiUsageScope;
  onScopeChange: (scope: AiUsageScope) => void;
}) {
  return (
    <AICostDashboard
      report={report}
      scope={scope}
      onScopeChange={onScopeChange}
    />
  );
}

export function PurposeChart({ report }: { report: AICostsReport }) {
  if (!report.byPurpose.length) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          Usuarios por finalidad de IA
        </p>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          Aún no hay solicitudes de IA.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        Usuarios por finalidad de IA
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        Usuarios únicos que usan el modelo en cada finalidad.
      </p>
      <div className="mt-3 h-56">
        <Bar
          data={{
            labels: report.byPurpose.map(
              (item) => PURPOSE_LABELS[item.purpose],
            ),
            datasets: [
              {
                label: "Usuarios únicos",
                data: report.byPurpose.map((item) => item.users),
                backgroundColor: "rgba(99, 102, 241, 0.7)",
                borderRadius: 8,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  afterLabel: (context) =>
                    `${report.byPurpose[context.dataIndex]?.requests ?? 0} solicitudes`,
                },
              },
            },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 } },
              x: { grid: { display: false } },
            },
          }}
        />
      </div>
    </section>
  );
}

function PdfExportButton({ report }: { report: AICostsReport }) {
  const [isExporting, setIsExporting] = useState(false);

  async function downloadReport() {
    setIsExporting(true);
    try {
      const blob = await generateAiReportPdf(report);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte-estadistico-peticiones-ia-musicflow.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void downloadReport()}
      disabled={isExporting}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] disabled:opacity-40"
    >
      <Download className="h-4 w-4" />
      {isExporting ? "Generando PDF…" : "Exportar PDF"}
    </button>
  );
}

/** Compares the consumption of end users, administrators and both together. */
function ScopeComparison({ report }: { report: AICostsReport }) {
  const activeScope = report.scope ?? "all";
  if (!report.sources) return null;
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
      {(["user", "admin", "all"] as const).map((key) => {
        const source = report.sources[key];
        const active = activeScope === key;
        return (
          <div
            key={key}
            className={`rounded-xl border p-3 ${
              active
                ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                : "border-[var(--color-border)]"
            }`}
          >
            <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {SCOPE_LABELS[key]}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {source.requests.toLocaleString("es-PE")} peticiones
            </dd>
            <dd className="text-xs text-[var(--color-muted)]">
              {source.tokensInput.toLocaleString("es-PE")} entrada ·{" "}
              {source.tokensOutput.toLocaleString("es-PE")} salida
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function AIActivityCharts({
  report,
  scope,
  onScopeChange,
}: {
  report: AICostsReport;
  scope: AiUsageScope;
  onScopeChange: (scope: AiUsageScope) => void;
}) {
  const [period, setPeriod] = useState<Period>("day");
  // An already-open admin tab can hold the pre-analytics response in cache.
  // Treat it as an empty series until the new backend response arrives.
  const points = report.activity?.[period] ?? [];
  const labels = points.map((p) =>
    new Intl.DateTimeFormat(
      "es-PE",
      period === "year"
        ? { year: "numeric" }
        : period === "month"
          ? { month: "short", year: "numeric" }
          : { day: "2-digit", month: "short" },
    ).format(new Date(p.date)),
  );
  const fulfilled = points.reduce((sum, p) => sum + p.fulfilled, 0);
  const unfulfilled = points.reduce((sum, p) => sum + p.unfulfilled, 0);
  const rate =
    fulfilled + unfulfilled
      ? Math.round((fulfilled / (fulfilled + unfulfilled)) * 100)
      : 0;
  const fulfilment = FULFILMENT_LABELS[scope];
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Analítica de Peticiones IA
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Datos reales de tokens, volumen y aceptación. Consumo de{" "}
            {SCOPE_LABELS[scope].toLowerCase()}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PdfExportButton report={report} />
          <div
            className="inline-flex rounded-lg border border-[var(--color-border)] p-1"
            role="group"
            aria-label="Consumo por tipo de usuario"
          >
            {(["user", "admin", "all"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onScopeChange(value)}
                aria-pressed={scope === value}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${scope === value ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]" : "text-[var(--color-muted)]"}`}
              >
                {SCOPE_LABELS[value]}
              </button>
            ))}
          </div>
          <div
            className="inline-flex rounded-lg border border-[var(--color-border)] p-1"
            role="group"
            aria-label="Periodo de la analítica"
          >
            {PERIODS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${period === value ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]" : "text-[var(--color-muted)]"}`}
              >
                {value === "day" ? "Día" : value === "month" ? "Mes" : "Año"}
              </button>
            ))}
          </div>
        </div>
      </div>
      {points.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">
          Aún no hay peticiones IA registradas.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="h-72">
            <Bar
              data={{
                labels,
                datasets: [
                  {
                    label: "Tokens entrada",
                    data: points.map((p) => p.tokensInput),
                    backgroundColor: "rgba(99,102,241,.75)",
                    borderRadius: 6,
                  },
                  {
                    label: "Tokens salida",
                    data: points.map((p) => p.tokensOutput),
                    backgroundColor: "rgba(34,211,238,.75)",
                    borderRadius: 6,
                  },
                  {
                    label: "Peticiones",
                    data: points.map((p) => p.requests),
                    backgroundColor: "rgba(244,114,182,.7)",
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true },
                },
                plugins: { legend: { labels: { color: "#a8b0c8" } } },
              }}
            />
          </div>
          <div className="flex min-h-72 flex-col justify-center">
            <div className="h-48">
              <Doughnut
                data={{
                  labels: [
                    FULFILMENT_LABELS[scope].accepted,
                    FULFILMENT_LABELS[scope].rejected,
                  ],
                  datasets: [
                    {
                      data: [fulfilled, unfulfilled],
                      backgroundColor: [
                        "rgba(52,211,153,.8)",
                        "rgba(251,113,133,.8)",
                      ],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "#a8b0c8" },
                    },
                  },
                }}
              />
            </div>
            <p className="mt-3 text-center text-sm font-semibold">
              {rate}% de {fulfilment.rate}
            </p>
            <p className="text-center text-xs text-[var(--color-muted)]">
              {fulfilled} {fulfilment.accepted} · {unfulfilled}{" "}
              {fulfilment.rejected}
            </p>
          </div>
        </div>
      )}
      <ScopeComparison report={report} />
    </section>
  );
}

function AICostDashboard({
  report,
  scope,
  onScopeChange,
}: {
  report: AICostsReport;
  scope: AiUsageScope;
  onScopeChange: (scope: AiUsageScope) => void;
}) {
  const modelLabels = report.byModel.map((item) => item.model);
  const scopeSubtitle =
    scope === "user"
      ? "Consumo del asistente de usuarios (Claude Haiku)."
      : scope === "admin"
        ? "Consumo del asistente y tareas NVIDIA de administración."
        : "Consumo acumulado de usuarios (Haiku) y administración (NVIDIA).";

  return (
    <>
      <AIActivityCharts
        report={report}
        scope={scope}
        onScopeChange={onScopeChange}
      />
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          Tokens consumidos por modelo
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {scopeSubtitle}
        </p>
        {report.byModel.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">
            Aún no hay consumo registrado para{" "}
            {SCOPE_LABELS[scope].toLowerCase()}.
          </p>
        ) : (
          <div className="mt-3 h-64">
            <Bar
              data={{
                labels: modelLabels,
                datasets: [
                  {
                    label: "Tokens de entrada",
                    data: report.byModel.map((item) => item.tokensInput),
                    backgroundColor: "rgba(99,102,241,.75)",
                    borderRadius: 6,
                  },
                  {
                    label: "Tokens de salida",
                    data: report.byModel.map((item) => item.tokensOutput),
                    backgroundColor: "rgba(34,211,238,.75)",
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true },
                },
                plugins: {
                  legend: { labels: { color: "#a8b0c8" } },
                  tooltip: {
                    callbacks: {
                      afterBody: (items) => {
                        const model = report.byModel[items[0]?.dataIndex ?? 0];
                        if (!model) return "";
                        return [
                          `${model.requests} peticiones · ${(
                            model.tokensInput + model.tokensOutput
                          ).toLocaleString("es-PE")} tokens`,
                          `(${model.tokensInput.toLocaleString("es-PE")} entrada / ${model.tokensOutput.toLocaleString("es-PE")} salida)`,
                        ];
                      },
                    },
                  },
                },
              }}
            />
          </div>
        )}
      </section>
    </>
  );
}

function RequestDetail({
  request,
  onClose,
}: {
  request: AdminAIRequest;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-[var(--color-page)] shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-page)] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Detalle de solicitud
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              {request.user.username} · {formatDate(request.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            aria-label="Cerrar detalle"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-5 p-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Prompt
            </h3>
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-sm text-[var(--color-text)]">
              {request.prompt}
            </pre>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Contexto
            </h3>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-xs text-[var(--color-muted)]">
              {JSON.stringify(request.context, null, 2)}
            </pre>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Respuesta
            </h3>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-xs text-[var(--color-muted)]">
              {JSON.stringify(request.response, null, 2)}
            </pre>
          </section>
          {request.explanation ? (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Explicación
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text)]">
                {request.explanation}
              </p>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export default function AIRequestsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<AiUsageScope>("all");
  const [isExporting, setIsExporting] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const [selected, setSelected] = useState<AdminAIRequest | null>(null);
  useEffect(() => setPage(0), [deferredSearch]);
  const costsQ = useQuery({
    // v3 splits the report per consumer and adds the NVIDIA catalog runs.
    queryKey: ["admin", "ai-costs-v3", 30, scope],
    queryFn: () => getAiCosts(30, scope),
    staleTime: 60_000,
  });
  const isCurrentScopeReport = costsQ.data?.scope === scope;
  const changeScope = useCallback((nextScope: AiUsageScope) => {
    setScope((currentScope) =>
      currentScope === nextScope ? currentScope : nextScope,
    );
  }, []);
  const requestsQ = useQuery({
    queryKey: ["admin", "ai-requests", page, deferredSearch],
    queryFn: () =>
      listAiRequests({
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
        search: deferredSearch || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const closeDetail = useCallback(() => setSelected(null), []);
  const total = requestsQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requests = requestsQ.data?.requests ?? [];

  async function exportRequests() {
    setIsExporting(true);
    try {
      const rows = await listAllAiRequests(deferredSearch || undefined);
      exportExcel(
        "analisis-peticiones-ia",
        [
          { label: "Fecha", value: (request) => formatDate(request.createdAt) },
          { label: "Usuario", value: (request) => request.user.username },
          { label: "Correo", value: (request) => request.user.email },
          {
            label: "Canción",
            value: (request) =>
              request.track
                ? `${request.track.title} — ${request.track.artist}`
                : "",
          },
          { label: "Prompt", value: (request) => request.prompt },
          { label: "Modelo", value: (request) => request.modelUsed },
          { label: "Tokens entrada", value: (request) => request.tokensInput },
          { label: "Tokens salida", value: (request) => request.tokensOutput },
          { label: "Costo USD", value: (request) => request.costUsd },
          { label: "Tiempo ms", value: (request) => request.responseTimeMs },
          {
            label: "Aceptada",
            value: (request) => (request.wasAccepted ? "Sí" : "No"),
          },
        ],
        rows,
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">
              Solicitudes del agente IA
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Auditoría de prompts y sugerencias. La búsqueda y paginación se
              procesan en el servidor.
            </p>
          </header>
          {costsQ.data && isCurrentScopeReport ? (
            <CostSummary
              key={scope}
              report={costsQ.data}
              scope={scope}
              onScopeChange={changeScope}
            />
          ) : costsQ.isPending || !isCurrentScopeReport ? (
            <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-surface-alt)]" />
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => void exportRequests()}
              disabled={isExporting || total === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-semibold hover:border-[var(--color-primary)] disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exportando…" : "Exportar Excel"}
            </button>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar prompt o usuario…"
                className="w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </label>
          </div>
          {requestsQ.isError ? (
            <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              <span>No se pudieron cargar las solicitudes.</span>
              <button
                type="button"
                onClick={() => requestsQ.refetch()}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </button>
            </div>
          ) : null}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
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
                      "Acciones",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requestsQ.isPending
                    ? Array.from({ length: PAGE_SIZE }).map((_, index) => (
                        <tr
                          key={index}
                          className="border-b border-[var(--color-border)]"
                        >
                          <td colSpan={9} className="px-4 py-3">
                            <div className="h-4 animate-pulse rounded bg-[var(--color-border)]" />
                          </td>
                        </tr>
                      ))
                    : null}
                  {!requestsQ.isPending && requests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-[var(--color-muted)]"
                      >
                        No hay solicitudes que coincidan.
                      </td>
                    </tr>
                  ) : null}
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-page)]/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-muted)]">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{request.user.username}</p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {request.user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                        {request.track
                          ? `${request.track.title} — ${request.track.artist}`
                          : "—"}
                      </td>
                      <td className="max-w-xs px-4 py-3" title={request.prompt}>
                        {truncate(request.prompt)}
                      </td>
                      <td className="px-4 py-3 text-xs">{request.modelUsed}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {request.tokensInput} ↑ {request.tokensOutput} ↓
                      </td>
                      <td className="px-4 py-3 text-xs">
                        ${Number(request.costUsd).toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {request.responseTimeMs} ms
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelected(request)}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted)]">
              <span>
                {total === 0
                  ? "Sin resultados"
                  : `Mostrando ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0 || requestsQ.isFetching}
                  className="rounded-lg border border-[var(--color-border)] p-1.5 disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages - 1, current + 1))
                  }
                  disabled={page >= totalPages - 1 || requestsQ.isFetching}
                  className="rounded-lg border border-[var(--color-border)] p-1.5 disabled:opacity-40"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </footer>
          </div>
        </div>
      </section>
      {selected ? (
        <RequestDetail request={selected} onClose={closeDetail} />
      ) : null}
    </>
  );
}

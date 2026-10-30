import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import {
  Eye,
  Headphones,
  Heart,
  Music2,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { getArtistDashboard } from "../../shared/api/artist-portal";
import { useArtistPortal } from "../context/ArtistPortalContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: number;
  delta: number;
  icon: typeof Users;
}) {
  const positive = delta >= 0;
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--color-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-black">
            {value.toLocaleString("es-PE")}
          </p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p
        className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-400" : "text-rose-400"}`}
      >
        {positive ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}
        {`${positive ? "+" : ""}${delta} frente a los 30 días previos`}
      </p>
    </article>
  );
}

export default function ArtistDashboardPage() {
  const { selected } = useArtistPortal();
  const { data, isLoading } = useQuery({
    queryKey: ["artist-portal", selected.artist.id, "dashboard"],
    queryFn: () => getArtistDashboard(selected.artist.id),
    staleTime: 60_000,
  });
  const chartData = useMemo(
    () => ({
      labels: data?.series.map((point) => point.date.slice(5)) ?? [],
      datasets: [
        {
          label: "Reproducciones",
          data: data?.series.map((point) => point.plays) ?? [],
          borderColor: "#fbbf24",
          backgroundColor: "rgba(251,191,36,.08)",
          tension: 0.35,
          pointRadius: 0,
        },
        {
          label: "Oyentes",
          data: data?.series.map((point) => point.listeners) ?? [],
          borderColor: "#35d7ff",
          backgroundColor: "rgba(53,215,255,.14)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        },
        {
          label: "Vistas de perfil",
          data: data?.series.map((point) => point.profileViews) ?? [],
          borderColor: "#a78bfa",
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    }),
    [data],
  );
  if (isLoading || !data)
    return (
      <main className="p-8 text-[var(--color-muted)]">
        Cargando analítica real...
      </main>
    );
  const { totals, comparison, topTracks } = data;
  return (
    <main className="min-h-full px-6 py-10 text-[var(--color-text)] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-[.22em] text-[var(--color-primary)]">
          MusicFlow for Artists
        </p>
        <h1 className="mt-2 text-3xl font-black">
          Hola, {selected.artist.name}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Resumen de los últimos 30 días, calculado con actividad real de
          MusicFlow.
        </p>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Oyentes frecuentes"
            value={totals.frequentListeners}
            delta={comparison.listeners}
            icon={Headphones}
          />
          <MetricCard
            label="Nuevos oyentes"
            value={totals.newListeners}
            delta={comparison.listeners}
            icon={Users}
          />
          <MetricCard
            label="Vistas de perfil"
            value={totals.profileViews}
            delta={comparison.profileViews}
            icon={Eye}
          />
          <MetricCard
            label="Seguidores"
            value={totals.followers}
            delta={comparison.followers}
            icon={Heart}
          />
        </section>
        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,.85fr)]">
          <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5 sm:p-6">
            <h2 className="font-bold">Audiencia y descubrimiento</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Reproducciones, oyentes y visitas únicas diarias.
            </p>
            <div className="mt-6 h-64">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { intersect: false, mode: "index" },
                  plugins: {
                    legend: {
                      labels: { color: "#a5a2bd", usePointStyle: true },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: "#8c89a8", maxTicksLimit: 6 },
                      grid: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { color: "#8c89a8", precision: 0 },
                      grid: { color: "rgba(255,255,255,.06)" },
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-4 sm:grid-cols-3">
              <p className="text-sm text-[var(--color-muted)]">
                Oyentes fieles{" "}
                <strong className="ml-1 text-[var(--color-text)]">
                  {totals.loyalListeners}
                </strong>
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Reproducciones{" "}
                <strong className="ml-1 text-[var(--color-text)]">
                  {totals.plays}
                </strong>
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Canciones{" "}
                <strong className="ml-1 text-[var(--color-text)]">
                  {data.artist._count.tracks}
                </strong>
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Conversión perfil → oyente{" "}
                <strong className="ml-1 text-[var(--color-text)]">
                  {totals.profileViews
                    ? `${Math.round((totals.listeners / totals.profileViews) * 100)}%`
                    : "—"}
                </strong>
              </p>
            </div>
          </article>
          <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5 sm:p-6">
            <h2 className="font-bold">Canciones destacadas</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Más reproducidas este mes.
            </p>
            <div className="mt-5 space-y-3">
              {topTracks.map((track, index) => (
                <div key={track.id} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-black text-[var(--color-muted)]">
                    {index + 1}
                  </span>
                  <div className="h-11 w-11 overflow-hidden rounded-lg bg-[var(--color-page)]">
                    {track.coverArt ? (
                      <img
                        src={track.coverArt}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Music2 className="m-3 h-5 w-5 text-[var(--color-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{track.title}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {track.plays.toLocaleString("es-PE")} reproducciones
                    </p>
                  </div>
                  <span
                    title={
                      track.trend === "UP"
                        ? `+${track.delta} frente a los 30 días previos`
                        : track.trend === "DOWN"
                          ? `${track.delta} frente a los 30 días previos`
                          : "Sin cambio frente a los 30 días previos"
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${
                      track.trend === "UP"
                        ? "bg-emerald-400/15 text-emerald-400"
                        : track.trend === "DOWN"
                          ? "bg-rose-400/15 text-rose-400"
                          : "bg-white/10 text-[var(--color-muted)]"
                    }`}
                  >
                    {track.trend === "UP" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : track.trend === "DOWN" ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {track.trend === "STABLE"
                      ? "En espera"
                      : `${track.delta > 0 ? "+" : ""}${track.delta}`}
                  </span>
                </div>
              ))}
              {!topTracks.length ? (
                <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                  Aún no hay reproducciones en este periodo.
                </p>
              ) : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

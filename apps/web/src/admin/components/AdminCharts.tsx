import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

import type {
  AIFeedbackStats,
  CatalogDistribution,
  UserGrowth,
} from "../../shared/api/admin";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const GRID_COLOR = "rgba(148, 163, 184, 0.14)";
const TEXT_COLOR = "#94a3b8";
const tooltip = {
  backgroundColor: "#101827",
  titleColor: "#f8fafc",
  bodyColor: "#cbd5e1",
  borderColor: "rgba(45, 212, 191, 0.35)",
  borderWidth: 1,
  padding: 10,
  displayColors: false,
};

function labelDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function UserGrowthChart({ growth }: { growth: UserGrowth }) {
  const labels = growth.series.map((point) => labelDate(point.date));
  const values = growth.series.map((point) => point.count);

  return (
    <div
      className="h-56"
      role="img"
      aria-label="Crecimiento diario de usuarios"
    >
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Nuevos usuarios",
              data: values,
              borderColor: "#22d3ee",
              backgroundColor: "rgba(34, 211, 238, 0.16)",
              fill: true,
              tension: 0.42,
              pointRadius: 0,
              pointHoverRadius: 4,
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: { legend: { display: false }, tooltip },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: TEXT_COLOR,
                maxTicksLimit: 6,
                font: { size: 10 },
              },
              border: { display: false },
            },
            y: {
              beginAtZero: true,
              grid: { color: GRID_COLOR },
              ticks: { color: TEXT_COLOR, precision: 0, font: { size: 10 } },
              border: { display: false },
            },
          },
        }}
      />
    </div>
  );
}

export function FeedbackChart({ stats }: { stats: AIFeedbackStats }) {
  return (
    <div
      className="h-44"
      role="img"
      aria-label="Distribución del feedback de IA"
    >
      <Doughnut
        data={{
          labels: ["Positivo", "Neutro", "Negativo"],
          datasets: [
            {
              data: [stats.good, stats.neutral, stats.bad],
              backgroundColor: ["#34d399", "#94a3b8", "#fb7185"],
              borderColor: "#111827",
              borderWidth: 4,
              hoverOffset: 5,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: TEXT_COLOR, boxWidth: 10, padding: 16 },
            },
            tooltip,
          },
        }}
      />
    </div>
  );
}

export function CatalogChart({ catalog }: { catalog: CatalogDistribution }) {
  const buckets = catalog.byGenre.slice(0, 6);

  return (
    <div
      className="h-56"
      role="img"
      aria-label="Canciones del catálogo por género"
    >
      <Bar
        data={{
          labels: buckets.map((bucket) => bucket.label || "Sin género"),
          datasets: [
            {
              label: "Canciones",
              data: buckets.map((bucket) => bucket.count),
              backgroundColor: "rgba(139, 92, 246, 0.78)",
              borderColor: "#a78bfa",
              borderWidth: 1,
              borderRadius: 7,
              maxBarThickness: 38,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: TEXT_COLOR, maxRotation: 0, font: { size: 10 } },
              border: { display: false },
            },
            y: {
              beginAtZero: true,
              grid: { color: GRID_COLOR },
              ticks: { color: TEXT_COLOR, precision: 0, font: { size: 10 } },
              border: { display: false },
            },
          },
        }}
      />
    </div>
  );
}

export function MusicRankingChart({
  labels,
  values,
  color = "#22d3ee",
  ariaLabel,
}: {
  labels: string[];
  values: number[];
  color?: string;
  ariaLabel: string;
}) {
  return (
    <div className="h-56" role="img" aria-label={ariaLabel}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: `${color}bb`,
              borderColor: color,
              borderWidth: 1,
              borderRadius: 6,
              maxBarThickness: 24,
            },
          ],
        }}
        options={{
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: GRID_COLOR },
              ticks: { color: TEXT_COLOR, precision: 0 },
              border: { display: false },
            },
            y: {
              grid: { display: false },
              ticks: { color: TEXT_COLOR, font: { size: 10 } },
              border: { display: false },
            },
          },
        }}
      />
    </div>
  );
}

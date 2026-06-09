import { useMemo, useState } from "react";
import {
  Disc3,
  ListMusic,
  Music3,
  RotateCcw,
  Scissors,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import ClientLayout from "../../layout/ClientLayout";
import { useEqualizer } from "../../../shared/hooks/useEqualizer";
import { usePlayerStore } from "../../stores/playStore";
import type { EQPreset, ReverbPreset } from "../../../shared/api/equalizer";

const FREQUENCIES = [
  31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;

const REVERB_PRESETS: ReverbPreset[] = [
  "NONE",
  "SMALL_ROOM",
  "MEDIUM_ROOM",
  "LARGE_ROOM",
  "SMALL_HALL",
  "LARGE_HALL",
  "CATHEDRAL",
  "PLATE",
  "SPRING",
];

type ScopeId = "global" | "playlist" | "track" | "segment";

const SCOPES: { id: ScopeId; icon: typeof Disc3 }[] = [
  { id: "global", icon: Disc3 },
  { id: "playlist", icon: ListMusic },
  { id: "track", icon: Music3 },
  { id: "segment", icon: Scissors },
];

function formatHz(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : `${hz}`;
}

function formatDb(db: number): string {
  return db > 0 ? `+${db}` : `${db}`;
}

function isPresetActive(preset: EQPreset, bands: number[]): boolean {
  if (preset.bands.length !== bands.length) return false;
  return preset.bands.every(
    (b, i) => Math.round(b) === Math.round(bands[i] ?? 0),
  );
}

/** SVG response curve — visual feedback of how the 10 bands shape the spectrum. */
function ResponseCurve({ bands }: { bands: number[] }) {
  const width = 320;
  const height = 80;
  const padX = 6;
  const usable = width - padX * 2;

  // Convert dB (-15..15) → y coordinate (height..0 inverted)
  const toY = (db: number) => height / 2 - (db / 15) * (height / 2 - 6);

  const points = bands.map((db, i) => {
    const x = padX + (i / (bands.length - 1)) * usable;
    const y = toY(db);
    return `${x},${y.toFixed(2)}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `M ${padX},${height} L ${points.join(" L ")} L ${padX + usable},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-20 w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--color-primary)"
            stopOpacity="0.35"
          />
          <stop
            offset="100%"
            stopColor="var(--color-primary)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      {/* 0 dB baseline */}
      <line
        x1={padX}
        x2={padX + usable}
        y1={height / 2}
        y2={height / 2}
        stroke="var(--color-border)"
        strokeDasharray="3 4"
      />
      <path d={areaPath} fill="url(#curve-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {bands.map((_, i) => {
        const [x, y] = points[i].split(",").map(Number);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2.5}
            fill="var(--color-primary)"
            stroke="var(--color-surface)"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

function ScopeTabs({
  active,
  onSelect,
}: {
  active: ScopeId;
  onSelect: (id: ScopeId) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SCOPES.map(({ id, icon: Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              isActive
                ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                isActive
                  ? "bg-[var(--color-primary)] text-[var(--color-page)]"
                  : "bg-[var(--color-surface-alt)] text-[var(--color-muted)] group-hover:text-[var(--color-text)]"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.3} />
            </span>
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold ${
                  isActive
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-text)]"
                }`}
              >
                {t(`eq.scope.${id}`)}
              </p>
              <p className="truncate text-[10px] text-[var(--color-muted)]">
                {t(`eq.scope.${id}Desc`)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EffectSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-muted)]">
          {label}
        </span>
        <span className="text-xs font-semibold text-[var(--color-primary)] tabular-nums">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-border)] accent-[var(--color-primary)]"
      />
    </div>
  );
}

export default function Equalizer() {
  const { t } = useTranslation();
  const {
    bands,
    setBand,
    effects,
    setEffects,
    presets,
    presetsLoading,
    applyPreset,
    reset,
  } = useEqualizer();
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const [scope, setScope] = useState<ScopeId>("global");

  const safeBands = useMemo(
    () => Array.from({ length: 10 }, (_, i) => Math.round(bands[i] ?? 0)),
    [bands],
  );

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
          {/* MAIN COLUMN */}
          <div className="flex flex-col gap-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
                  {t("eq.title")}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-[var(--color-muted)]">
                  {t("eq.subtitle")}
                </p>
              </div>

              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
                {t("eq.reset")}
              </button>
            </div>

            {/* Scope tabs */}
            <ScopeTabs active={scope} onSelect={setScope} />

            {/* Response curve */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {t("eq.curve")}
                </h2>
                <span className="rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                  {t(`eq.scope.${scope}`)}
                </span>
              </div>
              <ResponseCurve bands={safeBands} />
            </div>

            {/* Presets */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {t("eq.presets")}
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {presetsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-[var(--color-surface-alt)]"
                    />
                  ))
                ) : presets.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    {t("eq.noPresets")}
                  </p>
                ) : (
                  presets.map((preset) => {
                    const active = isPresetActive(preset, safeBands);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          active
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 10-band sliders */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {t("eq.bands")}
              </h2>
              <div className="flex items-end justify-around gap-1">
                {FREQUENCIES.map((hz, i) => {
                  const db = safeBands[i];
                  return (
                    <div
                      key={hz}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          db > 0
                            ? "text-[var(--color-primary)]"
                            : db < 0
                              ? "text-rose-400"
                              : "text-[var(--color-muted)]"
                        }`}
                      >
                        {formatDb(db)}
                      </span>

                      <div className="flex h-44 items-center justify-center">
                        <input
                          type="range"
                          min={-15}
                          max={15}
                          step={1}
                          value={db}
                          onChange={(e) => setBand(i, Number(e.target.value))}
                          style={{
                            writingMode:
                              "vertical-lr" as React.CSSProperties["writingMode"],
                            direction: "rtl",
                            height: "160px",
                            width: "28px",
                            cursor: "pointer",
                            appearance:
                              "slider-vertical" as React.CSSProperties["appearance"],
                            WebkitAppearance:
                              "slider-vertical" as React.CSSProperties["WebkitAppearance"],
                            accentColor: "var(--color-primary)",
                          }}
                        />
                      </div>

                      <span className="text-[10px] font-medium text-[var(--color-muted)]">
                        {formatHz(hz)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Effects */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {t("eq.effects")}
              </h2>

              <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                <EffectSlider
                  label={t("eq.bassBoost")}
                  value={effects.bassBoost}
                  onChange={(v) => setEffects({ bassBoost: v })}
                />
                <EffectSlider
                  label={t("eq.virtualizer")}
                  value={effects.virtualizer}
                  onChange={(v) => setEffects({ virtualizer: v })}
                />
                <EffectSlider
                  label={t("eq.loudness")}
                  value={effects.loudness}
                  onChange={(v) => setEffects({ loudness: v })}
                />
              </div>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
                <div className="flex flex-col gap-2 sm:w-52">
                  <span className="text-xs font-medium text-[var(--color-muted)]">
                    {t("eq.reverbPreset")}
                  </span>
                  <select
                    value={effects.reverbPreset}
                    onChange={(e) =>
                      setEffects({
                        reverbPreset: e.target.value as ReverbPreset,
                      })
                    }
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  >
                    {REVERB_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {t(`eq.reverb.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-muted)]">
                      {t("eq.reverbAmount")}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-primary)] tabular-nums">
                      {effects.reverbAmount}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={effects.reverbAmount}
                    onChange={(e) =>
                      setEffects({ reverbAmount: Number(e.target.value) })
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-border)] accent-[var(--color-primary)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AI side panel */}
          <aside className="flex flex-col gap-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2">
              <span className="relative">
                <span className="absolute inset-0 -m-1 animate-ping rounded-full bg-[var(--color-accent)]/40" />
                <Sparkles
                  className="relative h-4 w-4 text-[var(--color-accent)]"
                  strokeWidth={2.3}
                />
              </span>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]">
                  {t("eq.ai.title")}
                </h3>
                <p className="text-[10px] text-[var(--color-muted)]">
                  {t("eq.ai.subtitle")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openAiPrompt}
              disabled={!currentTrack}
              className="group relative overflow-hidden rounded-2xl border border-[var(--color-accent)]/40 bg-[linear-gradient(135deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] p-5 text-left text-white shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="text-base font-semibold tracking-tight">
                {t("player.ai.quickPrompt")}
              </p>
              <p className="mt-1 text-xs text-white/80">
                {currentTrack ? currentTrack.title : t("player.lyrics.empty")}
              </p>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            </button>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Atajos
              </p>
              <div className="flex flex-wrap gap-2">
                {(["warmer", "brighter", "punch", "vocal"] as const).map(
                  (k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={openAiPrompt}
                      disabled={!currentTrack}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t(`player.ai.chips.${k}`)}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="mt-auto rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 p-4">
              <p className="text-[11px] leading-5 text-[var(--color-muted)]">
                Las sugerencias se aplican al alcance activo (
                {t(`eq.scope.${scope}`).toLowerCase()}). No son destructivas —
                siempre puedes descartar.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </ClientLayout>
  );
}

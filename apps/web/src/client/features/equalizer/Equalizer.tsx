import { RotateCcw, SlidersHorizontal } from "lucide-react";
import ClientLayout from "../../layout/ClientLayout";
import { useEqualizer } from "../../../shared/hooks/useEqualizer";
import type { EQPreset, ReverbPreset } from "../../../shared/api/equalizer";

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQUENCIES = [
  31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;

const REVERB_LABELS: Record<ReverbPreset, string> = {
  NONE: "Ninguno",
  SMALL_ROOM: "Sala Pequeña",
  MEDIUM_ROOM: "Sala Mediana",
  LARGE_ROOM: "Sala Grande",
  SMALL_HALL: "Auditorio Pequeño",
  LARGE_HALL: "Auditorio Grande",
  CATHEDRAL: "Catedral",
  PLATE: "Plato",
  SPRING: "Resorte",
};

const REVERB_OPTIONS = Object.entries(REVERB_LABELS) as [
  ReverbPreset,
  string,
][];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHz(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : `${hz}`;
}

function formatDb(db: number): string {
  if (db > 0) return `+${db}`;
  return `${db}`;
}

/**
 * Best-effort comparison: a preset is "active" when every band value matches
 * the current bands (integer comparison after rounding).
 */
function isPresetActive(preset: EQPreset, bands: number[]): boolean {
  if (preset.bands.length !== bands.length) return false;
  return preset.bands.every(
    (b, i) => Math.round(b) === Math.round(bands[i] ?? 0),
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonChips() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-8 w-24 animate-pulse rounded-full bg-[var(--color-surface-alt)]"
        />
      ))}
    </>
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
        <span className="text-xs font-semibold text-[var(--color-primary)]">
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function Equalizer() {
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

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          {/* ── Header ── */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[var(--color-primary)]">
                <SlidersHorizontal className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                Ecualizador
              </h1>
            </div>

            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
              Reset
            </button>
          </div>

          {/* ── Presets row ── */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Presets
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {presetsLoading ? (
                <SkeletonChips />
              ) : presets.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">
                  Sin presets guardados.
                </p>
              ) : (
                presets.map((preset) => {
                  const active = isPresetActive(preset, bands);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        active
                          ? "border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── 10-band EQ sliders ── */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Bandas de Frecuencia
            </h2>
            <div className="flex items-end justify-around gap-1">
              {FREQUENCIES.map((hz, i) => {
                const db = Math.round(bands[i] ?? 0);
                return (
                  <div
                    key={hz}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    {/* dB readout */}
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

                    {/* Vertical slider */}
                    <div className="flex h-44 items-center justify-center">
                      <input
                        type="range"
                        min={-15}
                        max={15}
                        step={1}
                        value={db}
                        orient="vertical"
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

                    {/* Frequency label */}
                    <span className="text-[10px] font-medium text-[var(--color-muted)]">
                      {formatHz(hz)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Effects row ── */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Efectos
            </h2>

            {/* Horizontal sliders */}
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
              <EffectSlider
                label="Realce de Graves (Bass Boost)"
                value={effects.bassBoost}
                onChange={(v) => setEffects({ bassBoost: v })}
              />
              <EffectSlider
                label="Virtualizador"
                value={effects.virtualizer}
                onChange={(v) => setEffects({ virtualizer: v })}
              />
              <EffectSlider
                label="Loudness"
                value={effects.loudness}
                onChange={(v) => setEffects({ loudness: v })}
              />
            </div>

            {/* Reverb row */}
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              {/* Reverb preset select */}
              <div className="flex flex-col gap-2 sm:w-52">
                <span className="text-xs font-medium text-[var(--color-muted)]">
                  Preset de Reverb
                </span>
                <select
                  value={effects.reverbPreset}
                  onChange={(e) =>
                    setEffects({ reverbPreset: e.target.value as ReverbPreset })
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                >
                  {REVERB_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reverb amount slider */}
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-muted)]">
                    Cantidad de Reverb
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-primary)]">
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
      </section>
    </ClientLayout>
  );
}

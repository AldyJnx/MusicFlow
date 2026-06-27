import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Save, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import ClientLayout from "../../layout/ClientLayout";
import EqCascade from "./EqCascade";
import { useEqualizer } from "../../../shared/hooks/useEqualizer";
import { useEqCascade } from "../../../shared/hooks/useEqCascade";
import { usePlayerStore } from "../../stores/playStore";
import { upsertConfig } from "../../../shared/api/equalizer";
import type {
  EQPreset,
  EQScopeType,
  ReverbPreset,
} from "../../../shared/api/equalizer";

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
    setBands,
    effects,
    setEffects,
    presets,
    presetsLoading,
    applyPreset,
    reset,
    syncFromEngine,
  } = useEqualizer();
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queryClient = useQueryClient();

  const [scope, setScope] = useState<ScopeId>("global");

  const safeBands = useMemo(
    () => Array.from({ length: 10 }, (_, i) => Math.round(bands[i] ?? 0)),
    [bands],
  );

  // Live cascade — the saved config per scope + the current playback context.
  const { configs, context } = useEqCascade();

  // The saved config for the scope being edited (segments aren't edited here —
  // they live in the segment timeline, so segment scope loads nothing).
  const selectedConfig =
    scope === "global"
      ? configs.global
      : scope === "playlist"
        ? configs.playlist
        : scope === "track"
          ? configs.track
          : null;

  // Load a scope's *saved* curve into the editor when it has one. We never
  // reset to flat for a scope without a saved config — the editor keeps the
  // current live curve (shared across every EQ surface) so switching scope or
  // reopening the page never wrongly shows "equilibrado". To start a scope
  // from flat, use Restablecer.
  const loadedKeyRef = useRef<string>("");
  useEffect(() => {
    const key = `${scope}:${selectedConfig?.id ?? "none"}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    if (selectedConfig) {
      setBands(selectedConfig.bands, 250);
      setEffects({
        bassBoost: selectedConfig.bassBoost,
        virtualizer: selectedConfig.virtualizer,
        loudness: selectedConfig.loudness,
        reverbPreset: selectedConfig.reverbPreset,
        reverbAmount: selectedConfig.reverbAmount,
      });
    }
  }, [scope, selectedConfig, setBands, setEffects]);

  // On first mount, mirror the live audio engine into the editor so the
  // sliders reflect what's actually playing (never a stale flat curve).
  useEffect(() => {
    syncFromEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the editor's current curve to the selected scope.
  const saveMutation = useMutation({
    mutationFn: () => {
      const scopeType: EQScopeType =
        scope === "playlist"
          ? "PLAYLIST"
          : scope === "track"
            ? "TRACK"
            : "GLOBAL";
      const scopeId =
        scope === "playlist"
          ? (context.playlistId ?? undefined)
          : scope === "track"
            ? (context.trackId ?? undefined)
            : undefined;
      return upsertConfig({
        scopeType,
        scopeId,
        bands: safeBands,
        bassBoost: effects.bassBoost,
        virtualizer: effects.virtualizer,
        loudness: effects.loudness,
        reverbPreset: effects.reverbPreset,
        reverbAmount: effects.reverbAmount,
      });
    },
    onSuccess: (saved) => {
      // Don't let the load effect re-flat the editor after the refetch.
      loadedKeyRef.current = `${scope}:${saved.id}`;
      void queryClient.invalidateQueries({ queryKey: ["eq", "config"] });
      void queryClient.invalidateQueries({ queryKey: ["eq", "resolve"] });
    },
  });

  // Segment EQ is authored in the segment timeline, not here. Playlist/track
  // scopes need a live context to attach the config to.
  const canSave =
    scope === "global" ||
    (scope === "playlist" && !!context.playlistId) ||
    (scope === "track" && !!context.trackId);

  return (
    <ClientLayout>
      <section className="min-h-screen w-full px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {/* MAIN COLUMN */}
          <div className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-surface)_86%,transparent)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-[var(--glass-blur)] sm:p-8">
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {t("eq.reset")}
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={!canSave || saveMutation.isPending}
                  title={
                    canSave
                      ? undefined
                      : scope === "segment"
                        ? t("eq.saveSegmentHint", {
                            defaultValue:
                              "Los segmentos se editan en el Estudio",
                          })
                        : t("eq.saveNoContext", {
                            defaultValue:
                              "Reproduce una canción/lista para guardar en este nivel",
                          })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {saveMutation.isPending
                    ? t("eq.saving", { defaultValue: "Guardando…" })
                    : saveMutation.isSuccess
                      ? t("eq.saved", { defaultValue: "Guardado" })
                      : t("eq.save", { defaultValue: "Guardar" })}
                </button>
              </div>
            </div>

            {/* Now-playing context strip (pretesis "song/playlist context") */}
            <div
              className="flex items-center gap-3.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-glass)] p-3 px-4"
              style={{ backdropFilter: "blur(16px)" }}
            >
              <div
                className="h-12 w-12 flex-none overflow-hidden rounded-xl shadow-[0_6px_18px_-6px_rgba(0,0,0,.7)]"
                style={{
                  background:
                    "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
                }}
              >
                {currentTrack?.cover ? (
                  <img
                    src={currentTrack.cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="mb-0.5 text-[var(--color-accent)]"
                  style={{
                    font: "700 9.5px var(--font-mono)",
                    letterSpacing: ".16em",
                  }}
                >
                  {currentTrack
                    ? t("eq.context.playing", {
                        defaultValue: "EN REPRODUCCIÓN",
                      })
                    : t("eq.context.idle", {
                        defaultValue: "SIN REPRODUCCIÓN",
                      })}
                </p>
                <p
                  className="truncate text-[17px] font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {currentTrack
                    ? currentTrack.title
                    : t("eq.context.idleTitle", {
                        defaultValue: "Reproduce una canción para ecualizar",
                      })}
                </p>
              </div>
              {currentTrack ? (
                <span className="flex-none text-[12.5px] font-semibold text-[var(--color-muted)]">
                  {currentTrack.artist}
                </span>
              ) : null}
            </div>

            {/* Cascade — Global → Playlist → Pista → Segmento (live context) */}
            <EqCascade active={scope} onSelect={setScope} />

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

          {/* AI quick row (pretesis) */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_6%,transparent),color-mix(in_srgb,var(--color-accent)_2%,transparent))] p-4">
            <button
              type="button"
              onClick={openAiPrompt}
              className="flex items-center gap-3 text-left"
            >
              <span
                className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-white shadow-[0_6px_16px_-4px_var(--color-primary)]"
                style={{
                  background:
                    "linear-gradient(145deg,var(--color-primary),var(--color-accent))",
                }}
              >
                <Sparkles
                  className="h-[17px] w-[17px]"
                  fill="currentColor"
                  stroke="none"
                />
              </span>
              <span className="flex-1 text-[13.5px] font-medium text-[var(--color-muted)]">
                {t("eq.ai.placeholder", {
                  defaultValue: "Describe cómo quieres que suene…",
                })}{" "}
                <span className="font-bold text-[var(--color-accent)]">
                  {t("eq.ai.open", { defaultValue: "abrir asistente →" })}
                </span>
              </span>
            </button>
            <div className="flex flex-wrap gap-2">
              {(["warmer", "brighter", "punch", "vocal"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={openAiPrompt}
                  className="rounded-full border border-[var(--color-line)] bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition hover:scale-105 hover:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)] hover:text-[var(--color-accent)]"
                >
                  {t(`player.ai.chips.${k}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ClientLayout>
  );
}

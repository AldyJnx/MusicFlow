import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Save, SlidersHorizontal, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usePlayerStore } from "../../stores/playStore";
import { useEqualizer } from "../../../shared/hooks/useEqualizer";
import { getAudioEngine } from "../../../audio/engine";
import type { EQSegment as EngineSegment } from "../../../audio/segments";
import { updateSegment } from "../../../shared/api/segments";

const FREQUENCIES = [
  31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;

function formatHz(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : `${hz}`;
}

function formatDb(db: number): string {
  if (db > 0) return `+${db}`;
  return `${db}`;
}

/**
 * Lateral drawer for quick EQ tweaks without leaving the persistent player.
 * Live-affects the audio engine via `useEqualizer`. If the playhead is inside
 * a segment, "Guardar" persists the current bands + effects to that segment
 * via PATCH /equalizer/segments/:id.
 */
export default function EqDrawer() {
  const isOpen = usePlayerStore((s) => s.eqDrawerOpen);
  const close = usePlayerStore((s) => s.closeEqDrawer);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const { bands, effects, setBand, reset } = useEqualizer();
  const qc = useQueryClient();

  const [activeSegment, setActiveSegment] = useState<EngineSegment | null>(
    null,
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // PATCH the currently-active segment with the drawer's live bands + effects.
  // We do NOT touch start/end/transition here — that belongs to the segments
  // page. The drawer is only for "tweak the EQ while listening".
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeSegment) throw new Error("no-active-segment");
      return updateSegment(activeSegment.id, {
        eqConfig: {
          bands: bands.slice(0, 10),
          bassBoost: effects.bassBoost,
          virtualizer: effects.virtualizer,
          loudness: effects.loudness,
          reverbPreset: effects.reverbPreset,
          reverbAmount: effects.reverbAmount,
        },
      });
    },
    onSuccess: () => {
      setSavedAt(Date.now());
      // Refresh the segments list for the current track so the persisted
      // EQ shows up in the editor and the segment scheduler re-applies it.
      if (currentTrack) {
        void qc.invalidateQueries({
          queryKey: ["segments", currentTrack.id],
        });
      }
    },
  });

  // Auto-clear the "Guardado" toast after 1.8s.
  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 1800);
    return () => clearTimeout(t);
  }, [savedAt]);

  // Track which engine segment is active so we can label the drawer.
  useEffect(() => {
    if (!isOpen) return;
    const engine = getAudioEngine();
    const unsubscribe = engine.segments.onSegmentChange(setActiveSegment);
    return unsubscribe;
  }, [isOpen]);

  // ESC to close.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen || !currentTrack) return null;

  const segmentLabel = activeSegment?.label ?? null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Editor rápido de ecualización"
        className="fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-md flex-col border-l border-white/10 bg-[#0a1626] text-white shadow-[0_0_60px_rgba(0,0,0,0.4)]"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[#14e3f7]">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2.2} />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
                Ecualizador
              </h2>
            </div>
            <p className="mt-1 truncate text-base font-medium text-white">
              {currentTrack.title}
            </p>
            <p className="mt-0.5 text-xs text-[#9fb6df]">
              {segmentLabel ? (
                <>
                  Editando segmento{" "}
                  <span className="font-semibold text-[#14e3f7]">
                    {segmentLabel}
                  </span>
                </>
              ) : (
                <>EQ de track · sin segmento activo</>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Cerrar editor de EQ"
            className="rounded-lg p-2 text-[#9fb6df] transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#14e3f7]/60"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </header>

        {/* Bands */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="flex items-end justify-around gap-1">
            {FREQUENCIES.map((hz, i) => {
              const db = Math.round(bands[i] ?? 0);
              return (
                <div
                  key={hz}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      db > 0
                        ? "text-[#14e3f7]"
                        : db < 0
                          ? "text-rose-400"
                          : "text-[#9fb6df]"
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
                      aria-label={`Banda ${formatHz(hz)} Hz`}
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
                        accentColor: "#14e3f7",
                      }}
                    />
                  </div>

                  <span className="text-[10px] font-medium text-[#6b83a9]">
                    {formatHz(hz)}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-5 text-[#9fb6df]">
            {activeSegment
              ? "Guardar aplica las bandas al segmento activo en backend."
              : "Sin segmento activo: los cambios solo afectan al audio. Crea uno en la página de Segmentos para persistir."}
          </p>

          {saveMutation.isError && (
            <p className="mt-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              No se pudo guardar:{" "}
              {(saveMutation.error as Error)?.message ?? "error"}
            </p>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-medium text-[#b4c2da] transition hover:border-[#14e3f7]/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#14e3f7]/40"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
            Reset
          </button>

          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="text-[11px] font-semibold text-emerald-300">
                Guardado
              </span>
            )}

            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={!activeSegment || saveMutation.isPending}
              title={
                activeSegment
                  ? "Persistir bandas al segmento"
                  : "Sin segmento activo"
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#14e3f7]/40 bg-[#14e3f7]/10 px-4 text-sm font-semibold text-[#14e3f7] transition hover:bg-[#14e3f7]/20 disabled:opacity-40"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Guardar
            </button>

            <button
              type="button"
              onClick={close}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[linear-gradient(90deg,#386cf9_0%,#18c4e6_100%)] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.2)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#14e3f7]/60"
            >
              Listo
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}

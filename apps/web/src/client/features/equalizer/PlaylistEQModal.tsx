import { Loader2, Sliders, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  getConfigByScope,
  listPresets,
  upsertConfig,
} from "../../../shared/api/equalizer";

interface PlaylistEQModalProps {
  open: boolean;
  onClose: () => void;
  playlistId: string;
  playlistName: string;
}

export default function PlaylistEQModal({
  open,
  onClose,
  playlistId,
  playlistName,
}: PlaylistEQModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedPresetId, setSelectedPresetId] = useState<string | "none">(
    "none",
  );

  const presetsQ = useQuery({
    queryKey: ["eq", "presets"],
    queryFn: listPresets,
    enabled: open,
  });

  const currentCfgQ = useQuery({
    queryKey: ["eq", "config", "PLAYLIST", playlistId],
    queryFn: () => getConfigByScope("PLAYLIST", playlistId),
    enabled: open,
  });

  useEffect(() => {
    if (currentCfgQ.data?.presetId) {
      setSelectedPresetId(currentCfgQ.data.presetId);
    } else if (currentCfgQ.isSuccess) {
      setSelectedPresetId("none");
    }
  }, [currentCfgQ.data, currentCfgQ.isSuccess]);

  const save = useMutation({
    mutationFn: () =>
      upsertConfig({
        scopeType: "PLAYLIST",
        scopeId: playlistId,
        presetId: selectedPresetId === "none" ? undefined : selectedPresetId,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["eq", "config", "PLAYLIST", playlistId],
      });
      // Also force the auto-apply hook to re-resolve for any tracks the
      // player is currently going through that belong to this playlist.
      void qc.invalidateQueries({ queryKey: ["eq"] });
      onClose();
    },
  });

  if (!open) return null;

  const presets = presetsQ.data ?? [];

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[81] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <Sliders
                  className="h-4 w-4 text-[var(--color-primary)]"
                  strokeWidth={2.3}
                />
                {t("playlists.eq.title", {
                  defaultValue: "EQ para esta playlist",
                })}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {playlistName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close", { defaultValue: "Cerrar" })}
              className="rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>

          <div className="flex flex-col gap-3 px-6 py-5">
            <p className="text-xs text-[var(--color-muted)]">
              {t("playlists.eq.hint", {
                defaultValue:
                  "Cuando reproduzcas desde esta playlist, el EQ se aplicará automáticamente a cada track.",
              })}
            </p>

            <label className="flex flex-col gap-2 text-xs">
              <span className="font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                {t("playlists.eq.preset", { defaultValue: "Preset" })}
              </span>
              <select
                value={selectedPresetId}
                onChange={(e) =>
                  setSelectedPresetId(e.currentTarget.value as string)
                }
                disabled={presetsQ.isLoading}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="none">
                  {t("playlists.eq.noPreset", {
                    defaultValue: "Sin preset (usa el EQ global)",
                  })}
                </option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.isGlobal ? " ★" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={save.isPending}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-muted)] disabled:opacity-60"
            >
              {t("common.cancel", { defaultValue: "Cancelar" })}
            </button>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || currentCfgQ.isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-page)] transition hover:scale-[1.02] disabled:opacity-50"
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
              ) : null}
              {t("common.save", { defaultValue: "Guardar" })}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

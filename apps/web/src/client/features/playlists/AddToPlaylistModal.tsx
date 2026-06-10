import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, ListMusic, Loader2, Plus, X } from "lucide-react";

import {
  addTrackToPlaylist,
  createPlaylist,
  listPlaylists,
  type Playlist,
} from "../../../shared/api/playlists";

interface AddToPlaylistModalProps {
  open: boolean;
  onClose: () => void;
  /** Track being added. Null while the modal is closed. */
  trackId: string | null;
  trackTitle?: string;
}

/**
 * Lets the user drop a track into one of their playlists. Lists existing
 * playlists, lets them create a new one inline, and adds the track to the
 * chosen list. Mirrors the visual language of PlaylistsPage's CreateModal.
 */
export default function AddToPlaylistModal({
  open,
  onClose,
  trackId,
  trackTitle,
}: AddToPlaylistModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  // Id of the playlist that just received the track — drives the ✓ flash.
  const [addedTo, setAddedTo] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["playlists"],
    queryFn: listPlaylists,
    staleTime: 30_000,
    enabled: open,
  });

  const add = useMutation({
    mutationFn: (playlistId: string) => {
      if (!trackId) throw new Error("missing track");
      return addTrackToPlaylist(playlistId, trackId);
    },
    onSuccess: (_data, playlistId) => {
      void qc.invalidateQueries({ queryKey: ["playlists"] });
      setAddedTo(playlistId);
    },
  });

  const create = useMutation({
    mutationFn: () => createPlaylist({ name: newName.trim() }),
    onSuccess: async (playlist: Playlist) => {
      await qc.invalidateQueries({ queryKey: ["playlists"] });
      setNewName("");
      setCreating(false);
      add.mutate(playlist.id);
    },
  });

  if (!open) return null;

  const playlists = listQ.data ?? [];

  function handleClose() {
    setNewName("");
    setCreating(false);
    setAddedTo(null);
    add.reset();
    create.reset();
    onClose();
  }

  const busy = add.isPending || create.isPending;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[71] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">
                {t("playlists.addTo.title", {
                  defaultValue: "Agregar a una playlist",
                })}
              </h2>
              {trackTitle ? (
                <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                  {trackTitle}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label={t("common.close", { defaultValue: "Cerrar" })}
              className="rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>

          <div className="flex flex-col gap-1 overflow-y-auto px-3 py-3">
            {listQ.isPending ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--color-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
                {t("playlists.loadingShort", { defaultValue: "Cargando…" })}
              </div>
            ) : listQ.isError ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">
                {t("playlists.loadError", {
                  defaultValue: "No se pudieron cargar las playlists.",
                })}
              </p>
            ) : playlists.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">
                {t("playlists.addTo.empty", {
                  defaultValue:
                    "Aún no tenés playlists. Creá una para empezar.",
                })}
              </p>
            ) : (
              playlists.map((p) => {
                const justAdded = addedTo === p.id;
                const pending = add.isPending && add.variables === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={busy || justAdded}
                    onClick={() => add.mutate(p.id)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--color-surface-alt)]">
                      {p.coverArt ? (
                        <img
                          src={p.coverArt}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ListMusic
                          className="h-5 w-5 text-[var(--color-muted)]"
                          strokeWidth={1.8}
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--color-text)]">
                        {p.name}
                      </span>
                      <span className="block text-xs text-[var(--color-muted)]">
                        {t("playlists.trackCount", {
                          count: p._count?.tracks ?? 0,
                        })}
                      </span>
                    </span>
                    {justAdded ? (
                      <Check
                        className="h-5 w-5 shrink-0 text-[var(--color-primary)]"
                        strokeWidth={2.4}
                      />
                    ) : pending ? (
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin text-[var(--color-muted)]"
                        strokeWidth={2.2}
                      />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {add.isError ? (
            <p
              role="alert"
              className="mx-6 mb-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
            >
              {t("playlists.addTo.error", {
                defaultValue:
                  "No se pudo agregar. Puede que la canción ya esté en esa playlist.",
              })}
            </p>
          ) : null}

          <footer className="border-t border-[var(--color-border)] px-3 py-3">
            {creating ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      newName.trim() &&
                      !create.isPending
                    )
                      create.mutate();
                    if (e.key === "Escape") setCreating(false);
                  }}
                  maxLength={80}
                  placeholder={t("playlists.fields.namePlaceholder", {
                    defaultValue: "Nombre de la playlist",
                  })}
                  autoFocus
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => create.mutate()}
                  disabled={!newName.trim() || create.isPending}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-contrast)] transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {create.isPending ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      strokeWidth={2.2}
                    />
                  ) : null}
                  {t("playlists.addTo.createAndAdd", {
                    defaultValue: "Crear",
                  })}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--color-primary)]/50">
                  <Plus className="h-5 w-5" strokeWidth={2.2} />
                </span>
                {t("playlists.addTo.newPlaylist", {
                  defaultValue: "Nueva playlist",
                })}
              </button>
            )}
          </footer>
        </div>
      </div>
    </>
  );
}

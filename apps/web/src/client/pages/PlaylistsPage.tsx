import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Loader2,
  ListMusic,
  Plus,
  Sliders,
  Trash2,
  X,
} from "lucide-react";

import ClientLayout from "../layout/ClientLayout";
import {
  createPlaylist,
  deletePlaylist,
  listPlaylists,
  type Playlist,
} from "../../shared/api/playlists";
import {
  useLatestSavedCoverQuery,
  useSavedTracksQuery,
} from "../../shared/hooks/useLibrarySaves";
import { getConfigByScope } from "../../shared/api/equalizer";
import PlaylistEQModal from "../features/equalizer/PlaylistEQModal";

function CreateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createPlaylist({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["playlists"] });
      setName("");
      setDescription("");
      onClose();
    },
  });

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[71] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight">
              {t("playlists.createTitle")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>

          <div className="flex flex-col gap-4 px-6 py-5">
            <label className="flex flex-col gap-1.5 text-xs text-[var(--color-text)]">
              <span className="font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                {t("playlists.fields.name")}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                maxLength={80}
                placeholder={t("playlists.fields.namePlaceholder")}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                autoFocus
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-[var(--color-text)]">
              <span className="font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                {t("playlists.fields.description")}
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                maxLength={240}
                rows={3}
                placeholder={t("playlists.fields.descriptionPlaceholder")}
                className="resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </label>

            {create.isError ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
              >
                {t("playlists.createError")}
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={create.isPending}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-muted)] disabled:opacity-60"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={!name.trim() || create.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-contrast)] transition hover:scale-[1.02] disabled:opacity-50"
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
              ) : null}
              {t("playlists.create")}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

/**
 * Virtual "Me gustan" card — always first in the playlists grid, never
 * deletable. Backed by /library/saves: a saved track is a "liked song".
 */
function LikedSongsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const savedQ = useSavedTracksQuery({ take: 1 });
  const coverQ = useLatestSavedCoverQuery();
  const count = savedQ.data?.total ?? 0;
  const cover = coverQ.data?.coverArt ?? null;

  return (
    <article
      onClick={() => navigate("/library?scope=mylibrary")}
      className="group flex cursor-pointer flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-primary)]/40 bg-[var(--color-surface)] p-4 transition duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-cta-start)] to-[var(--color-cta-end)]">
        {cover ? (
          <>
            <img
              src={cover}
              alt={t("playlists.liked.name", { defaultValue: "Me gustan" })}
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            {/* Dark overlay so the heart icon stays readable on bright covers. */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/55" />
            <Heart
              className="relative h-16 w-16 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]"
              strokeWidth={2}
              fill="currentColor"
            />
          </>
        ) : (
          <Heart
            className="h-20 w-20 text-white/95"
            strokeWidth={1.5}
            fill="currentColor"
          />
        )}
      </div>

      <div className="flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-[var(--color-text)]">
            {t("playlists.liked.name", { defaultValue: "Me gustan" })}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {savedQ.isLoading ? "…" : t("playlists.trackCount", { count })}
          </p>
        </div>
        <span
          aria-label={t("playlists.liked.systemBadge", {
            defaultValue: "Lista del sistema",
          })}
          className="inline-flex items-center rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)]"
        >
          ♥
        </span>
      </div>
    </article>
  );
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [eqOpen, setEqOpen] = useState(false);

  const remove = useMutation({
    mutationFn: () => deletePlaylist(playlist.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  // Tiny lookup so the card can show "🎚 EQ activo" when the playlist has
  // a config set. Stays cached 60s and isn't critical — UI works without it.
  const cfgQ = useQuery({
    queryKey: ["eq", "config", "PLAYLIST", playlist.id],
    queryFn: () => getConfigByScope("PLAYLIST", playlist.id),
    staleTime: 60_000,
  });
  const hasEqConfig = Boolean(cfgQ.data);

  const trackCount = playlist._count?.tracks ?? 0;

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/playlists/${playlist.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/playlists/${playlist.id}`);
          }
        }}
        className="group flex cursor-pointer flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
      >
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-surface-alt)]">
          {playlist.coverArt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={playlist.coverArt}
              alt={playlist.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <ListMusic
              className="h-14 w-14 text-[var(--color-muted)]/60"
              strokeWidth={1.5}
            />
          )}
          {hasEqConfig ? (
            <span
              aria-label={t("playlists.eq.activeBadge", {
                defaultValue: "EQ configurado",
              })}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/40 bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] backdrop-blur"
            >
              <Sliders className="h-3 w-3" strokeWidth={2.4} />
              EQ
            </span>
          ) : null}
        </div>

        <div className="flex items-start justify-between gap-2 px-1">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-[var(--color-text)]">
              {playlist.name}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {t("playlists.trackCount", { count: trackCount })}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEqOpen(true);
              }}
              aria-label={t("playlists.eq.openAria", {
                defaultValue: "Configurar EQ de la playlist",
              })}
              className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
            >
              <Sliders className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(t("playlists.deleteConfirm", { name: playlist.name }))
                ) {
                  remove.mutate();
                }
              }}
              disabled={remove.isPending}
              aria-label={t("playlists.delete")}
              className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
            >
              {remove.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
              ) : (
                <Trash2 className="h-4 w-4" strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>
      </article>

      <PlaylistEQModal
        open={eqOpen}
        onClose={() => setEqOpen(false)}
        playlistId={playlist.id}
        playlistName={playlist.name}
      />
    </>
  );
}

export default function PlaylistsPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);

  const listQ = useQuery({
    queryKey: ["playlists"],
    queryFn: listPlaylists,
    staleTime: 30_000,
  });

  const playlists = listQ.data ?? [];

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto max-w-7xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-page)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[var(--color-text)] sm:text-[38px]">
                {t("playlists.title")}
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-[var(--color-muted)] sm:text-base">
                {t("playlists.subtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-[linear-gradient(180deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)] transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              {t("playlists.create")}
            </button>
          </div>

          <div className="mt-8">
            {listQ.isPending ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <div className="aspect-square w-full rounded-2xl bg-[var(--color-surface-alt)]" />
                    <div className="mt-3 h-4 w-3/4 rounded bg-[var(--color-surface-alt)]" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-surface-alt)]" />
                  </div>
                ))}
              </div>
            ) : listQ.isError ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="text-sm text-[var(--color-muted)]">
                  {t("playlists.loadError")}
                </p>
                <button
                  type="button"
                  onClick={() => listQ.refetch()}
                  className="rounded-xl border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
                >
                  {t("playlists.retry")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <LikedSongsCard />
                {playlists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
                {playlists.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex aspect-[5/6] flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-transparent p-4 text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                  >
                    <Plus className="h-8 w-8" strokeWidth={1.5} />
                    <span className="text-sm font-semibold">
                      {t("playlists.create")}
                    </span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </ClientLayout>
  );
}

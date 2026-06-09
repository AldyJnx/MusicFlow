import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, ListMusic, Plus, Trash2, X } from "lucide-react";

import ClientLayout from "../layout/ClientLayout";
import {
  createPlaylist,
  deletePlaylist,
  listPlaylists,
  type Playlist,
} from "../../shared/api/playlists";

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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-page)] transition hover:scale-[1.02] disabled:opacity-50"
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

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const remove = useMutation({
    mutationFn: () => deletePlaylist(playlist.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const trackCount = playlist._count?.tracks ?? 0;

  return (
    <article className="group flex flex-col gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]">
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
        <button
          type="button"
          onClick={() => {
            if (
              confirm(t("playlists.deleteConfirm", { name: playlist.name }))
            ) {
              remove.mutate();
            }
          }}
          disabled={remove.isPending}
          aria-label={t("playlists.delete")}
          className="rounded-lg p-1.5 text-[var(--color-muted)] opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 disabled:opacity-40"
        >
          {remove.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
          ) : (
            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
          )}
        </button>
      </div>
    </article>
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
        <div className="mx-auto max-w-7xl rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-page)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
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
                    className="animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
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
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--color-border)] py-20 text-center">
                <ListMusic
                  className="h-12 w-12 text-[var(--color-muted)]/40"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-base font-semibold text-[var(--color-text)]">
                    {t("playlists.emptyTitle")}
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-[var(--color-muted)]">
                    {t("playlists.emptyHint")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.2} />
                  {t("playlists.create")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {playlists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </ClientLayout>
  );
}

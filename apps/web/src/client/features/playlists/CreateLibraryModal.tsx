import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
  type Playlist,
} from "../../../shared/api/playlists";

export default function CreateLibraryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: () =>
      createPlaylist({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setName("");
      setDescription("");
      onClose();
    },
  });
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          Crear biblioteca
        </h2>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
          maxLength={120}
          className="mt-4 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-[var(--color-text)]"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descripción (opcional)"
          maxLength={500}
          className="mt-3 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-[var(--color-text)]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim() || create.isPending}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-2 font-semibold text-[var(--color-primary-contrast)]"
          >
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditLibraryModal({
  playlist,
  onClose,
  onDeleted,
  startDelete = false,
}: {
  playlist: Playlist | null;
  onClose: () => void;
  onDeleted: (playlistId: string) => void;
  startDelete?: boolean;
}) {
  if (!playlist) return null;

  return (
    <EditLibraryDialog
      key={`${playlist.id}-${startDelete ? "delete" : "rename"}`}
      playlist={playlist}
      onClose={onClose}
      onDeleted={onDeleted}
      startDelete={startDelete}
    />
  );
}

function EditLibraryDialog({
  playlist,
  onClose,
  onDeleted,
  startDelete,
}: {
  playlist: Playlist;
  onClose: () => void;
  onDeleted: (playlistId: string) => void;
  startDelete: boolean;
}) {
  const [name, setName] = useState(playlist.name);
  const [confirmingDelete, setConfirmingDelete] = useState(startDelete);
  const queryClient = useQueryClient();

  const rename = useMutation({
    mutationFn: () => updatePlaylist(playlist.id, { name: name.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      onClose();
    },
  });
  const remove = useMutation({
    mutationFn: () => deletePlaylist(playlist.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      const deletedId = playlist.id;
      onClose();
      onDeleted(deletedId);
    },
  });

  const trimmedName = name.trim();
  const nameChanged = trimmedName !== playlist.name.trim();

  if (confirmingDelete) {
    return (
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
        role="presentation"
      >
        <section
          className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-library-title"
          aria-describedby="delete-library-description"
        >
          <h2
            id="delete-library-title"
            className="text-lg font-bold text-[var(--color-text)]"
          >
            Eliminar biblioteca
          </h2>
          <p
            id="delete-library-description"
            className="mt-2 text-sm leading-6 text-[var(--color-muted)]"
          >
            ¿Estás seguro de que deseas eliminar “{playlist.name}”? Esta acción
            no se puede deshacer.
          </p>
          {remove.isError ? (
            <p className="mt-3 text-sm text-red-400">
              No se pudo eliminar la biblioteca. Inténtalo de nuevo.
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={remove.isPending}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)] disabled:opacity-50"
            >
              No
            </button>
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-wait disabled:opacity-50"
            >
              {remove.isPending ? "Eliminando…" : "Sí, eliminar"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <form
        className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmedName && nameChanged) rename.mutate();
        }}
      >
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          Editar biblioteca
        </h2>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
          maxLength={120}
          className="mt-4 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-[var(--color-text)]"
        />
        {rename.isError || remove.isError ? (
          <p className="mt-2 text-sm text-red-400">
            No se pudo guardar el cambio. Inténtalo de nuevo.
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-lg px-2 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            Eliminar biblioteca
          </button>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="px-2 py-2">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!trimmedName || !nameChanged || rename.isPending}
              className="rounded-lg bg-[var(--color-primary)] px-3 py-2 font-semibold text-[var(--color-primary-contrast)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

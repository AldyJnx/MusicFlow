import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import {
  createCatalogGenre,
  deleteCatalogGenre,
  listAdminCatalogGenres,
  updateCatalogGenre,
} from "../../shared/api/admin";
import { showActionNotice } from "../../shared/ui/ActionNotice";

const GENRES_KEY = ["admin", "catalog-genres"] as const;
const GENRES_PER_PAGE = 4;

function normalizeGenreName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "";
  return `${name[0].toLocaleUpperCase("es-PE")}${name.slice(1)}`;
}

function getVisiblePages(totalPages: number, currentPage: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  return [
    ...new Set([
      0,
      1,
      2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      totalPages - 1,
    ]),
  ]
    .filter((page) => page >= 0 && page < totalPages)
    .sort((left, right) => left - right);
}

export default function GenresPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGenre, setNewGenre] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [genrePendingDeletion, setGenrePendingDeletion] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const genresQuery = useQuery({
    queryKey: GENRES_KEY,
    queryFn: listAdminCatalogGenres,
    staleTime: 30_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: GENRES_KEY });
  const createMutation = useMutation({
    mutationFn: () => createCatalogGenre(normalizeGenreName(newGenre)),
    onSuccess: () => {
      setNewGenre("");
      setIsCreateOpen(false);
      void refresh();
      showActionNotice("Género creado con éxito.");
    },
    onError: () => showActionNotice("No se pudo crear el género.", "error"),
  });
  const updateMutation = useMutation({
    mutationFn: () =>
      updateCatalogGenre(editingId!, normalizeGenreName(editingName)),
    onSuccess: () => {
      setEditingId(null);
      setEditingName("");
      void refresh();
      showActionNotice("Género actualizado en el catálogo.");
    },
    onError: () =>
      showActionNotice("No se pudo actualizar el género.", "error"),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCatalogGenre,
    onSuccess: () => {
      setGenrePendingDeletion(null);
      void refresh();
      showActionNotice("Género eliminado correctamente.");
    },
    onError: () => showActionNotice("No se pudo eliminar el género.", "error"),
  });

  const genres = useMemo(() => {
    const needle = deferredQuery.trim().toLocaleLowerCase();
    return (genresQuery.data ?? []).filter((genre) =>
      genre.name.toLocaleLowerCase().includes(needle),
    );
  }, [deferredQuery, genresQuery.data]);
  const totalPages = Math.max(1, Math.ceil(genres.length / GENRES_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleGenres = genres.slice(
    safePage * GENRES_PER_PAGE,
    safePage * GENRES_PER_PAGE + GENRES_PER_PAGE,
  );
  const visiblePages = getVisiblePages(totalPages, safePage);

  return (
    <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Géneros musicales
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Gestiona el vocabulario musical disponible para clasificar artistas
            y canciones.
          </p>
        </header>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-[var(--color-primary-contrast)] disabled:opacity-45"
          >
            <Plus className="h-4 w-4" />
            Agregar género
          </button>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar género…"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pr-4 pl-10 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        {genresQuery.isPending ? (
          <div className="flex items-center gap-2 py-10 text-sm text-[var(--color-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando géneros…
          </div>
        ) : genresQuery.isError ? (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            No se pudieron cargar los géneros.
          </p>
        ) : genres.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
            No hay géneros que coincidan.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleGenres.map((genre) => {
              const isEditing = editingId === genre.id;
              const unchanged = normalizeGenreName(editingName) === genre.name;
              return (
                <article
                  key={genre.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4"
                >
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        value={editingName}
                        onChange={(event) =>
                          setEditingName(normalizeGenreName(event.target.value))
                        }
                        maxLength={60}
                        className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={
                          unchanged ||
                          !normalizeGenreName(editingName) ||
                          updateMutation.isPending
                        }
                        onClick={() => updateMutation.mutate()}
                        className="rounded-lg bg-[var(--color-primary)] px-3 text-xs font-bold text-[var(--color-primary-contrast)] disabled:opacity-45"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-muted)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">{genre.name}</h2>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {genre.artistCount} artista
                          {genre.artistCount === 1 ? "" : "s"} asociado
                          {genre.artistCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${genre.name}`}
                          onClick={() => {
                            setEditingId(genre.id);
                            setEditingName(genre.name);
                          }}
                          className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-page)] hover:text-[var(--color-primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${genre.name}`}
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            setGenrePendingDeletion({
                              id: genre.id,
                              name: genre.name,
                            })
                          }
                          className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {genres.length > GENRES_PER_PAGE ? (
          <nav
            aria-label="Paginación de géneros"
            className="flex flex-wrap items-center justify-center gap-1.5"
          >
            {visiblePages.map((pageNumber, index) => {
              const previousPage = visiblePages[index - 1];
              const showEllipsis =
                previousPage !== undefined && pageNumber - previousPage > 1;
              return (
                <span
                  key={pageNumber}
                  className="inline-flex items-center gap-1.5"
                >
                  {showEllipsis ? (
                    <span className="px-1 text-sm text-[var(--color-muted)]">
                      …
                    </span>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Ir a la página ${pageNumber + 1}`}
                    aria-current={safePage === pageNumber ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                    className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      safePage === pageNumber
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                        : "border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {pageNumber + 1}
                  </button>
                </span>
              );
            })}
          </nav>
        ) : null}
      </div>

      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => !createMutation.isPending && setIsCreateOpen(false)}
        >
          <form
            className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-genre-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              if (normalizeGenreName(newGenre)) createMutation.mutate();
            }}
          >
            <h2 id="new-genre-title" className="text-lg font-bold">
              Agregar género musical
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              La primera letra se guardará en mayúscula.
            </p>
            <label className="mt-4 block text-sm font-semibold">
              Nombre del género
              <input
                value={newGenre}
                onChange={(event) =>
                  setNewGenre(normalizeGenreName(event.target.value))
                }
                maxLength={60}
                autoFocus
                placeholder="Ej. Salsa"
                className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  !normalizeGenreName(newGenre) || createMutation.isPending
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary-contrast)] disabled:opacity-45"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Guardar género
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {genrePendingDeletion ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() =>
            !deleteMutation.isPending && setGenrePendingDeletion(null)
          }
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-genre-title"
            className="w-full max-w-md rounded-2xl border border-rose-400/30 bg-[var(--color-surface)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-genre-title" className="text-lg font-bold">
              ¿Eliminar género?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              ¿Estás seguro de eliminar{" "}
              <strong>{genrePendingDeletion.name}</strong>? Se quitará de
              artistas y canciones asociadas.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGenrePendingDeletion(null)}
                disabled={deleteMutation.isPending}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)]"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(genrePendingDeletion.id)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-45"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Sí, eliminar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

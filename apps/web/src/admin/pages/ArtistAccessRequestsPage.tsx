import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Search,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  listArtistAccessRequests,
  reviewArtistAccessRequest,
  type ArtistAccessRequestSort,
} from "../../shared/api/admin";

const pageSize = 6;

const sortOptions: Array<{ value: ArtistAccessRequestSort; label: string }> = [
  { value: "RECENT", label: "Más recientes" },
  { value: "OLDEST", label: "Más antiguas" },
  { value: "USERNAME_ASC", label: "Usuario: A-Z" },
  { value: "USERNAME_DESC", label: "Usuario: Z-A" },
];

export default function ArtistAccessRequestsPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ArtistAccessRequestSort>("RECENT");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "artist-access-requests", page, sort, deferredSearch],
    queryFn: () =>
      listArtistAccessRequests({
        page,
        pageSize,
        sort,
        q: deferredSearch || undefined,
      }),
  });
  const items = data?.items ?? [];

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, sort]);
  const review = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
    }) => reviewArtistAccessRequest(id, status),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["admin", "artist-access-requests"],
      }),
  });
  return (
    <main className="min-h-screen p-6 text-[var(--color-text)] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
          Verificación
        </p>
        <h1 className="mt-2 text-3xl font-black">Acceso de artistas</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Aprueba únicamente cuando los enlaces y documentos confirman que la
          cuenta representa al artista.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
            <Search className="h-4 w-4 text-[var(--color-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre de usuario"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-muted)]"
            />
          </label>
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as ArtistAccessRequestSort)
            }
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-3 text-sm outline-none"
            aria-label="Orden de solicitudes"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-8 space-y-4">
          {isLoading ? (
            <p>Cargando...</p>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">{item.artist.name}</h2>
                    <p className="text-sm text-[var(--color-muted)]">
                      Solicita {item.user.username} · {item.user.email}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold">
                    {item.status}
                  </span>
                </div>
                {item.evidence ? (
                  <p className="mt-4 whitespace-pre-wrap rounded-xl bg-black/10 p-4 text-sm">
                    {item.evidence}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.evidenceLinks.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/30 px-3 py-2 text-sm text-cyan-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {(() => {
                        try {
                          return new URL(link).hostname;
                        } catch {
                          return "Enlace oficial";
                        }
                      })()}
                    </a>
                  ))}
                  {item.documentUrl ? (
                    <details className="w-full rounded-xl border border-amber-300/30 bg-black/10 p-3 text-amber-100">
                      <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                        <FileText className="h-4 w-4" />
                        Previsualizar {item.documentName ?? "PDF de evidencia"}
                      </summary>
                      <iframe
                        title={`Evidencia de ${item.user.username}`}
                        src={item.documentUrl}
                        className="mt-3 h-[420px] w-full rounded-lg bg-white"
                      />
                      <a
                        href={item.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm text-amber-200 underline"
                      >
                        Abrir PDF en otra pestaña
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </details>
                  ) : null}
                </div>
                {item.status === "PENDING" ? (
                  <div className="mt-4 flex gap-3">
                    <button
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({ id: item.id, status: "APPROVED" })
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 font-bold text-slate-950"
                    >
                      <BadgeCheck className="h-4 w-4" />
                      Aprobar
                    </button>
                    <button
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({ id: item.id, status: "REJECTED" })
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 px-4 py-2 font-bold text-rose-300"
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
        {!isLoading && !items.length ? (
          <div className="mt-12 grid place-items-center rounded-3xl border border-dashed border-[var(--color-border)] py-16 text-[var(--color-muted)]">
            <UserRoundCheck className="mb-3 h-8 w-8" />
            No hay solicitudes para este filtro.
          </div>
        ) : null}
        {data && data.totalPages > 1 ? (
          <nav
            className="mt-6 flex items-center justify-between"
            aria-label="Paginación de solicitudes"
          >
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <p className="text-sm text-[var(--color-muted)]">
              Página {data.page} de {data.totalPages} · {data.total} solicitudes
            </p>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-40"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        ) : null}
      </div>
    </main>
  );
}

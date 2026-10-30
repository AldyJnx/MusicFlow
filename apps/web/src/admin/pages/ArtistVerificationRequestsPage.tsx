import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import {
  listArtistVerificationRequests,
  reviewArtistVerificationRequest,
  type ArtistAccessRequestSort,
} from "../../shared/api/admin";

const pageSize = 6;

export default function ArtistVerificationRequestsPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ArtistAccessRequestSort>("RECENT");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "artist-verification-requests",
      page,
      sort,
      deferredSearch,
    ],
    queryFn: () =>
      listArtistVerificationRequests({
        page,
        pageSize,
        sort,
        q: deferredSearch || undefined,
      }),
  });
  useEffect(() => setPage(1), [deferredSearch, sort]);
  const review = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
    }) => reviewArtistVerificationRequest(id, status),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["admin", "artist-verification-requests"],
      }),
  });
  return (
    <main className="min-h-screen p-6 text-[var(--color-text)] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
          Artistas
        </p>
        <h1 className="mt-2 text-3xl font-black">
          Solicitudes de verificación
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Aprobar agrega el sello público al perfil; rechazar lo mantiene sin
          verificar.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
            <Search className="h-4 w-4 text-[var(--color-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por usuario"
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </label>
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as ArtistAccessRequestSort)
            }
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-3 text-sm"
          >
            <option value="RECENT">Más recientes</option>
            <option value="OLDEST">Más antiguas</option>
            <option value="USERNAME_ASC">Usuario: A-Z</option>
            <option value="USERNAME_DESC">Usuario: Z-A</option>
          </select>
        </div>
        <div className="mt-8 space-y-4">
          {isLoading ? (
            <p>Cargando...</p>
          ) : (
            data?.items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                      {item.artist.name}
                      {item.artist.isVerified ? (
                        <BadgeCheck className="h-5 w-5 text-[var(--color-primary)]" />
                      ) : null}
                    </h2>
                    <p className="text-sm text-[var(--color-muted)]">
                      Solicita {item.requester.username} ·{" "}
                      {item.requester.email}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold">
                    {item.status}
                  </span>
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
                      Aprobar sello
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
        {!isLoading && !data?.items.length ? (
          <p className="mt-12 text-center text-[var(--color-muted)]">
            No hay solicitudes para este filtro.
          </p>
        ) : null}
        {data && data.totalPages > 1 ? (
          <nav className="mt-6 flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <p className="text-sm text-[var(--color-muted)]">
              Página {data.page} de {data.totalPages}
            </p>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-2 disabled:opacity-40"
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

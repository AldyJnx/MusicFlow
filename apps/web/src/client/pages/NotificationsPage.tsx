import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Search } from "lucide-react";

import ClientLayout from "../layout/ClientLayout";
import {
  getMyNotifications,
  markMyNotificationsRead,
} from "../../shared/api/auth";

type NotificationOrder = "RECENT" | "OLDEST" | "TITLE_ASC" | "TITLE_DESC";

export default function NotificationsPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [sort, setSort] = useState<NotificationOrder>("RECENT");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ["user-notifications", page, sort, deferredQuery],
    queryFn: () =>
      getMyNotifications({
        page,
        pageSize: 5,
        sort,
        q: deferredQuery,
      }),
  });
  const { mutate: markAsRead, isPending: isMarkingAsRead } = useMutation({
    mutationFn: () => markMyNotificationsRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] }),
  });

  useEffect(() => {
    if ((notifications.data?.unreadCount ?? 0) > 0 && !isMarkingAsRead) {
      markAsRead();
    }
  }, [isMarkingAsRead, markAsRead, notifications.data?.unreadCount]);

  return (
    <ClientLayout>
      <section className="min-h-screen w-full px-6 py-8 text-[var(--color-text)] xl:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
              <Bell className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--color-primary)]">
                Actividad
              </p>
              <h1 className="mt-1 text-3xl font-black">Notificaciones</h1>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Novedades de los artistas que sigues en MusicFlow.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_210px]">
            <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
              <Search className="h-4 w-4 text-[var(--color-muted)]" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar notificación"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </label>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as NotificationOrder);
                setPage(1);
              }}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-3 text-sm"
            >
              <option value="RECENT">Reciente</option>
              <option value="OLDEST">Antigua</option>
              <option value="TITLE_ASC">A-Z</option>
              <option value="TITLE_DESC">Z-A</option>
            </select>
          </div>

          <div className="mt-5 space-y-3">
            {notifications.data?.items.map((notification) => (
              <article
                key={notification.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5"
              >
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-black">{notification.title}</h2>
                      <time className="text-xs text-[var(--color-muted)]">
                        {new Intl.DateTimeFormat("es-PE", {
                          dateStyle: "medium",
                        }).format(new Date(notification.createdAt))}
                      </time>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {!notifications.isLoading && !notifications.data?.items.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted)]">
                Aún no hay novedades de artistas que sigues.
              </div>
            ) : null}
          </div>

          {notifications.data && notifications.data.totalPages > 1 ? (
            <NumberPagination
              page={page}
              totalPages={notifications.data.totalPages}
              onChange={setPage}
            />
          ) : null}
        </div>
      </section>
    </ClientLayout>
  );
}

function NumberPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages =
    totalPages <= 4
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : [1, 2, 3, totalPages];
  return (
    <nav
      aria-label="Paginación de notificaciones"
      className="mt-6 flex items-center gap-2"
    >
      {pages.map((item, index) => (
        <span key={item} className="contents">
          {index === pages.length - 1 && item - pages[index - 1] > 1 ? (
            <span className="px-1 text-sm text-[var(--color-muted)]">…</span>
          ) : null}
          <button
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={`grid h-9 min-w-9 place-items-center rounded-lg border text-sm font-bold ${
              item === page
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                : "border-[var(--color-border)]"
            }`}
          >
            {item}
          </button>
        </span>
      ))}
    </nav>
  );
}

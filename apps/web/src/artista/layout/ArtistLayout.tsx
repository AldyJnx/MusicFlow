import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, UserRound, X } from "lucide-react";

import Sidebar from "../../shared/ui/navigation/Sidebar";
import { sidebarArtist } from "../components/navigation/sidebarArtist";
import {
  ArtistPortalProvider,
  useArtistPortal,
} from "../context/ArtistPortalContext";
import { useAuthStore } from "../../shared/stores/authStore";
import {
  getArtistPortalNotifications,
  markArtistPortalNotificationsRead,
} from "../../shared/api/artist-portal";
import { usePreferences } from "../../shared/hooks/usePreferences";

function ArtistShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { memberships, selected, selectArtist } = useArtistPortal();
  const clear = useAuthStore((state) => state.clear);
  const navigate = useNavigate();
  const { sidebarPosition } = usePreferences();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();
  const notificationKey = [
    "artist-portal",
    selected.artist.id,
    "notifications",
  ] as const;
  const notifications = useQuery({
    queryKey: notificationKey,
    queryFn: () => getArtistPortalNotifications(selected.artist.id),
    enabled: true,
    staleTime: 60_000,
  });
  const markNotificationsRead = useMutation({
    mutationFn: () => markArtistPortalNotificationsRead(selected.artist.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKey });
      const previous =
        queryClient.getQueryData<typeof notifications.data>(notificationKey);
      queryClient.setQueryData<typeof notifications.data>(
        notificationKey,
        (data) =>
          data
            ? {
                ...data,
                unreadCount: 0,
                items: data.items.map((notification) => ({
                  ...notification,
                  read: true,
                })),
              }
            : data,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKey, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKey }),
  });
  const toggleNotifications = () => {
    setNotificationsOpen((open) => {
      if (!open) markNotificationsRead.mutate();
      return !open;
    });
  };
  const avatar = selected.artist.imageUrl;
  return (
    <div
      className={`flex min-h-screen bg-[var(--color-page)] text-[var(--color-text)] ${sidebarPosition === "right" ? "flex-row-reverse" : ""}`}
    >
      <Sidebar
        title="MusicFlow"
        version="for Artists"
        items={sidebarArtist}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        footer={
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary)]/20 text-sm font-black">
                  {selected.artist.name.slice(0, 1)}
                </span>
              )}
              {collapsed ? null : (
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {selected.artist.name}
                </span>
              )}
            </summary>
            <div className="mb-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1 shadow-xl">
              <button
                onClick={() => navigate("/artist-dashboard/profile")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/5"
              >
                <UserRound className="h-4 w-4" />
                Mi Perfil
              </button>
              <button
                onClick={clear}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </details>
        }
      />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-page)]/90 px-6 backdrop-blur-xl">
          <select
            value={selected.artist.id}
            onChange={(event) => selectArtist(event.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-bold"
          >
            {memberships.map((item) => (
              <option key={item.id} value={item.artist.id}>
                {item.artist.name} · {item.role}
              </option>
            ))}
          </select>
          <div className="relative">
            <button
              aria-label="Notificaciones"
              onClick={toggleNotifications}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {notifications.data?.unreadCount ? (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1 py-0.5 text-[10px] font-black text-[var(--color-primary-contrast)]">
                  {notifications.data.unreadCount > 9
                    ? "+9"
                    : notifications.data.unreadCount}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <section className="absolute right-0 top-12 z-50 w-[min(92vw,25rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 shadow-2xl">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-black">Notificaciones</h2>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Cerrar notificaciones"
                    className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-white/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {notifications.isLoading ? (
                    <p className="text-sm text-[var(--color-muted)]">
                      Analizando actividad reciente…
                    </p>
                  ) : null}
                  {notifications.data?.items.map((notification) => (
                    <article
                      key={notification.id}
                      className="rounded-xl border border-[var(--color-border)] p-3"
                    >
                      <p className="text-sm font-bold">{notification.title}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {notification.message}
                      </p>
                    </article>
                  ))}
                  {notifications.data && !notifications.data.items.length ? (
                    <p className="py-5 text-center text-sm text-[var(--color-muted)]">
                      Todavía no hay cambios de audiencia que notificar.
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </header>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function ArtistLayout() {
  return (
    <ArtistPortalProvider>
      <ArtistShell />
    </ArtistPortalProvider>
  );
}

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, Line } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Download,
  Disc3,
  FilePenLine,
  FilePlus2,
  Power,
  Palette,
  PanelLeft,
  Music2,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import {
  createArtistPortalAlbum,
  createArtistPortalMusic,
  deactivateArtistPortalMusic,
  deleteArtistPortalAlbum,
  deleteArtistPortalMusic,
  downloadArtistPortalMusicExcel,
  getArtistAnalytics,
  getArtistMusic,
  getArtistPortalAlbums,
  getArtistPortalNotifications,
  getArtistTeam,
  requestArtistVerification,
  updateArtistPortalAlbum,
  updateArtistPortalAlbumCover,
  updateArtistPortalMusic,
  updateArtistPortalProfile,
  updateArtistPortalProfileImage,
  getArtistPortalLyrics,
  markArtistPortalNotificationsRead,
  type ArtistPortalAlbum,
  type ArtistPortalTrack,
} from "../../shared/api/artist-portal";
import { useArtistPortal } from "../context/ArtistPortalContext";
import { APP_THEMES } from "../../shared/utils/theme";
import { usePreferences } from "../../shared/hooks/usePreferences";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
);

type View =
  | "music"
  | "albums"
  | "analytics"
  | "notifications"
  | "team"
  | "settings"
  | "profile";
type MusicOrder = "TRENDING_DESC" | "TRENDING_ASC" | "TITLE_ASC" | "TITLE_DESC";
type AlbumOrder = "RECENT_DESC" | "RECENT_ASC" | "TITLE_ASC" | "TITLE_DESC";

export default function ArtistWorkspacePage({ view }: { view: View }) {
  const { selected } = useArtistPortal();
  const artistId = selected.artist.id;
  const analytics = useQuery({
    queryKey: ["artist-portal", artistId, "analytics"],
    queryFn: () => getArtistAnalytics(artistId),
    enabled: view === "analytics",
  });
  const team = useQuery({
    queryKey: ["artist-portal", artistId, "team"],
    queryFn: () => getArtistTeam(artistId),
    enabled: view === "team",
  });
  const config = {
    music: [
      Disc3,
      "Música",
      "Todas tus canciones publicadas, sin agrupar por álbum.",
    ],
    albums: [
      Disc3,
      "Álbumes",
      "Gestiona los álbumes publicados y crea nuevos lanzamientos.",
    ],
    analytics: [
      BarChart3,
      "Analítica",
      "Desglose real de audiencia, escucha y rendimiento.",
    ],
    notifications: [
      Bell,
      "Notificaciones",
      "Actividad reciente y cambios de audiencia de tu catálogo.",
    ],
    team: [Users, "Equipo", "Personas con acceso verificado a este perfil."],
    settings: [
      Settings,
      "Configuración",
      "Información pública administrable por propietarios y managers.",
    ],
    profile: [
      Settings,
      "Perfil de artista",
      "Gestiona la información pública que aparece en tu perfil de artista.",
    ],
  } as const;
  const [Icon, title, description] = config[view];
  return (
    <main className="min-h-full px-6 py-10 sm:px-8">
      <div
        className={`mx-auto ${view === "profile" ? "max-w-[90rem]" : "max-w-6xl"}`}
      >
        <Icon className="h-8 w-8 text-[var(--color-primary)]" />
        <h1 className="mt-4 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
        {view === "music" ? (
          <MusicGallery
            artistId={artistId}
            canManage={selected.role !== "ANALYST"}
          />
        ) : null}
        {view === "albums" ? (
          <AlbumsGallery
            artistId={artistId}
            canManage={selected.role !== "ANALYST"}
          />
        ) : null}
        {view === "analytics" && analytics.data ? (
          <AnalyticsView analytics={analytics.data} />
        ) : null}
        {view === "notifications" ? (
          <ArtistNotificationsView artistId={artistId} />
        ) : null}
        {view === "team" && team.data ? (
          <div className="mt-8 space-y-3">
            {team.data.map((member) => (
              <article
                key={member.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] p-4"
              >
                <div>
                  <p className="font-bold">{member.user.username}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {member.user.email}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-primary)]/15 px-3 py-1 text-xs font-black text-[var(--color-primary)]">
                  {member.role}
                </span>
              </article>
            ))}
          </div>
        ) : null}
        {view === "profile" ? (
          <SettingsEditor
            key={artistId}
            artistId={artistId}
            initialName={selected.artist.name}
            initialBio={selected.artist.bio ?? ""}
            initialImage={selected.artist.imageUrl ?? null}
            isVerified={selected.artist.isVerified === true}
          />
        ) : null}
        {view === "settings" ? <ArtistPreferences /> : null}
      </div>
    </main>
  );
}

function ArtistNotificationsView({ artistId }: { artistId: string }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const [sort, setSort] = useState<
    "RECENT" | "OLDEST" | "TITLE_ASC" | "TITLE_DESC"
  >("RECENT");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const notificationKey = ["artist-portal", artistId, "notifications"] as const;
  const notifications = useQuery({
    queryKey: notificationKey,
    queryFn: () => getArtistPortalNotifications(artistId),
    staleTime: 60_000,
  });
  const { mutate: markAsRead, isPending: isMarkingAsRead } = useMutation({
    mutationFn: () => markArtistPortalNotificationsRead(artistId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationKey }),
  });

  useEffect(() => {
    if ((notifications.data?.unreadCount ?? 0) > 0 && !isMarkingAsRead) {
      markAsRead();
    }
  }, [isMarkingAsRead, markAsRead, notifications.data?.unreadCount]);

  const filteredItems = useMemo(() => {
    const items = (notifications.data?.items ?? []).filter((notification) =>
      deferredQuery
        ? `${notification.title} ${notification.message}`
            .toLocaleLowerCase()
            .includes(deferredQuery)
        : true,
    );
    return items.sort((first, second) => {
      if (sort === "OLDEST") {
        return (
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime()
        );
      }
      if (sort === "TITLE_ASC") return first.title.localeCompare(second.title);
      if (sort === "TITLE_DESC") return second.title.localeCompare(first.title);
      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }, [deferredQuery, notifications.data?.items, sort]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / 5));
  const visibleItems = filteredItems.slice((page - 1) * 5, page * 5);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (notifications.isLoading) {
    return (
      <p className="mt-8 text-sm text-[var(--color-muted)]">
        Cargando notificaciones…
      </p>
    );
  }

  if (!notifications.data?.items.length) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
        Todavía no hay cambios de audiencia que notificar.
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_210px]">
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
            setSort(
              event.target.value as
                | "RECENT"
                | "OLDEST"
                | "TITLE_ASC"
                | "TITLE_DESC",
            );
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
        {visibleItems.map((notification) => (
          <article
            key={notification.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
              <div>
                <p className="font-bold">{notification.title}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {notification.message}
                </p>
              </div>
            </div>
          </article>
        ))}
        {!visibleItems.length ? (
          <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
            No encontramos notificaciones con esa búsqueda.
          </p>
        ) : null}
      </div>
      {totalPages > 1 ? (
        <ArtistNotificationPagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
        />
      ) : null}
    </section>
  );
}

function ArtistNotificationPagination({
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
    <nav aria-label="Paginación de notificaciones" className="mt-6 flex gap-2">
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

function MusicGallery({
  artistId,
  canManage,
}: {
  artistId: string;
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const [order, setOrder] = useState<MusicOrder>("TRENDING_DESC");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ArtistPortalTrack | null>(null);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const client = useQueryClient();
  const queryKey = [
    "artist-portal",
    artistId,
    "music",
    page,
    deferredQuery,
    order,
  ];
  const music = useQuery({
    queryKey,
    queryFn: () =>
      getArtistMusic(artistId, {
        page,
        pageSize: 8,
        sort: order,
        q: deferredQuery,
      }),
  });
  const refresh = () =>
    client.invalidateQueries({
      queryKey: ["artist-portal", artistId, "music"],
    });
  const create = useMutation({
    mutationFn: (payload: {
      title?: string;
      file: File;
      albumId?: string;
      lyricsUrl?: string;
      lyricsLrc?: string;
    }) => createArtistPortalMusic(artistId, payload),
    onSuccess: () => {
      setShowCreate(false);
      setNotice({
        tone: "success",
        message: "Canción publicada correctamente.",
      });
      refresh();
    },
    onError: () =>
      setNotice({
        tone: "error",
        message:
          "No se pudo publicar la canción. Revisa los datos e inténtalo de nuevo.",
      }),
  });
  const edit = useMutation({
    mutationFn: (payload: {
      trackId: string;
      title?: string;
      fileUrlRemote?: string;
      albumId?: string | null;
      lyricsUrl?: string;
      lyricsLrc?: string;
    }) => updateArtistPortalMusic(artistId, payload.trackId, payload),
    onSuccess: () => {
      setEditing(null);
      setNotice({
        tone: "success",
        message: "Cambios de la canción guardados.",
      });
      refresh();
    },
    onError: () =>
      setNotice({
        tone: "error",
        message: "No se pudieron guardar los cambios de la canción.",
      }),
  });
  const handleExport = async () => {
    setExporting(true);
    setNotice(null);
    try {
      await downloadArtistPortalMusicExcel(artistId, {
        sort: order,
        q: deferredQuery,
      });
      setNotice({
        tone: "success",
        message: "Archivo Excel descargado correctamente.",
      });
    } catch {
      setNotice({
        tone: "error",
        message: "No se pudo exportar el listado. Inténtalo de nuevo.",
      });
    } finally {
      setExporting(false);
    }
  };
  const deactivate = useMutation({
    mutationFn: (trackId: string) =>
      deactivateArtistPortalMusic(artistId, trackId),
    onSuccess: () => {
      setNotice({
        tone: "success",
        message: "Canción suspendida correctamente.",
      });
      refresh();
    },
    onError: () =>
      setNotice({ tone: "error", message: "No se pudo suspender la canción." }),
  });
  const remove = useMutation({
    mutationFn: (trackId: string) => deleteArtistPortalMusic(artistId, trackId),
    onSuccess: () => {
      setNotice({
        tone: "success",
        message: "Canción eliminada correctamente.",
      });
      refresh();
    },
    onError: () =>
      setNotice({ tone: "error", message: "No se pudo eliminar la canción." }),
  });
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          Gestiona lanzamientos, visibilidad y archivos de tu catálogo.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-bold hover:border-[var(--color-primary)]"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-bold text-[var(--color-primary-contrast)]"
            >
              <FilePlus2 className="h-4 w-4" />
              Nueva Musica
            </button>
          ) : null}
        </div>
      </div>
      {notice ? (
        <TopNotice {...notice} onDismiss={() => setNotice(null)} />
      ) : null}
      {showCreate ? (
        <MusicCreateForm
          albums={music.data?.albums ?? []}
          pending={create.isPending}
          onCancel={() => setShowCreate(false)}
          onSubmit={(payload) => create.mutate(payload)}
        />
      ) : null}
      {editing ? (
        <MusicEditForm
          key={editing.id}
          artistId={artistId}
          track={editing}
          albums={music.data?.albums ?? []}
          initialTitle={editing.title}
          pending={edit.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={(payload) =>
            edit.mutate({ ...payload, trackId: editing.id })
          }
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
          <Search className="h-4 w-4 text-[var(--color-muted)]" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar canción"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </label>
        <select
          value={order}
          onChange={(event) => {
            setOrder(event.target.value as MusicOrder);
            setPage(1);
          }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-3 text-sm"
        >
          <option value="TRENDING_DESC">Mayor tendencia</option>
          <option value="TRENDING_ASC">Menor tendencia</option>
          <option value="TITLE_ASC">A-Z</option>
          <option value="TITLE_DESC">Z-A</option>
        </select>
      </div>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        {music.data?.total ?? 0} canciones · tendencia de los últimos 30 días
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {music.data?.items.map((track) => (
          <article
            key={track.id}
            className="flex min-h-32 items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
          >
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--color-page)]">
              {track.coverArt ? (
                <img
                  src={track.coverArt}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Music2 className="m-7 h-10 w-10 text-[var(--color-muted)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-black">{track.title}</h2>
            </div>
            {canManage ? (
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(track)}
                  className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-primary)]"
                  aria-label={`Editar ${track.title}`}
                >
                  <FilePenLine className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Desactivar "${track.title}" del catálogo?`,
                      )
                    ) {
                      deactivate.mutate(track.id);
                    }
                  }}
                  className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-amber-500/10 hover:text-amber-300"
                  aria-label={`Desactivar ${track.title}`}
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Eliminar definitivamente "${track.title}"?`,
                      )
                    ) {
                      remove.mutate(track.id);
                    }
                  }}
                  className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label={`Eliminar ${track.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {!music.isLoading && !music.data?.items.length ? (
        <p className="py-12 text-center text-[var(--color-muted)]">
          No hay canciones que coincidan.
        </p>
      ) : null}
      {music.data && music.data.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={music.data.page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-[var(--color-muted)]">
            Página {music.data.page} de {music.data.totalPages}
          </span>
          <button
            type="button"
            disabled={music.data.page === music.data.totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AlbumsGallery({
  artistId,
  canManage,
}: {
  artistId: string;
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [order, setOrder] = useState<AlbumOrder>("RECENT_DESC");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ArtistPortalAlbum | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const client = useQueryClient();
  const albums = useQuery({
    queryKey: ["artist-portal", artistId, "albums", page, deferredQuery, order],
    queryFn: () =>
      getArtistPortalAlbums(artistId, {
        page,
        pageSize: 8,
        sort: order,
        q: deferredQuery,
      }),
  });
  const refresh = () =>
    client.invalidateQueries({
      queryKey: ["artist-portal", artistId, "albums"],
    });
  const create = useMutation({
    mutationFn: (payload: { title: string; year?: number; cover: File }) =>
      createArtistPortalAlbum(artistId, payload),
    onSuccess: () => {
      setShowCreate(false);
      setNotice({ tone: "success", message: "Álbum publicado correctamente." });
      refresh();
      client.invalidateQueries({
        queryKey: ["artist-portal", artistId, "music"],
      });
    },
    onError: () =>
      setNotice({
        tone: "error",
        message: "No se pudo publicar el álbum. Revisa sus datos y portada.",
      }),
  });
  const edit = useMutation({
    mutationFn: async (payload: {
      id: string;
      title: string;
      year?: number;
      cover?: File;
    }) => {
      await updateArtistPortalAlbum(artistId, payload.id, {
        title: payload.title,
        year: payload.year,
      });
      if (payload.cover) {
        await updateArtistPortalAlbumCover(artistId, payload.id, payload.cover);
      }
    },
    onSuccess: () => {
      setEditing(null);
      setNotice({
        tone: "success",
        message: "Álbum actualizado correctamente.",
      });
      refresh();
      client.invalidateQueries({
        queryKey: ["artist-portal", artistId, "music"],
      });
    },
    onError: () =>
      setNotice({ tone: "error", message: "No se pudo actualizar el álbum." }),
  });
  const remove = useMutation({
    mutationFn: (albumId: string) => deleteArtistPortalAlbum(artistId, albumId),
    onSuccess: () => {
      setNotice({ tone: "success", message: "Álbum eliminado correctamente." });
      refresh();
      client.invalidateQueries({
        queryKey: ["artist-portal", artistId, "music"],
      });
    },
    onError: () =>
      setNotice({ tone: "error", message: "No se pudo eliminar el álbum." }),
  });

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          Crea y consulta los álbumes que pertenecen a tu perfil artístico.
        </p>
        {canManage ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-bold text-[var(--color-primary-contrast)]"
          >
            <FilePlus2 className="h-4 w-4" />
            Nuevo álbum
          </button>
        ) : null}
      </div>
      {notice ? (
        <TopNotice {...notice} onDismiss={() => setNotice(null)} />
      ) : null}
      {showCreate ? (
        <AlbumCreateForm
          pending={create.isPending}
          onCancel={() => setShowCreate(false)}
          onSubmit={(payload) => create.mutate(payload)}
        />
      ) : null}
      {editing ? (
        <AlbumEditForm
          key={editing.id}
          album={editing}
          pending={edit.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={(payload) => edit.mutate({ ...payload, id: editing.id })}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
          <Search className="h-4 w-4 text-[var(--color-muted)]" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar álbum"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </label>
        <select
          value={order}
          onChange={(event) => {
            setOrder(event.target.value as AlbumOrder);
            setPage(1);
          }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-3 text-sm"
        >
          <option value="RECENT_DESC">Más recientes</option>
          <option value="RECENT_ASC">Más antiguos</option>
          <option value="TITLE_ASC">A-Z</option>
          <option value="TITLE_DESC">Z-A</option>
        </select>
      </div>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        {albums.data?.total ?? 0} álbumes publicados
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {albums.data?.items.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            canManage={canManage}
            onEdit={() => setEditing(album)}
            onDelete={() => {
              if (
                window.confirm(
                  `¿Eliminar definitivamente el álbum "${album.title}"?`,
                )
              ) {
                remove.mutate(album.id);
              }
            }}
          />
        ))}
      </div>
      {!albums.isLoading && !albums.data?.items.length ? (
        <p className="py-12 text-center text-[var(--color-muted)]">
          Aún no hay álbumes publicados.
        </p>
      ) : null}
      {albums.data && albums.data.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={albums.data.page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-[var(--color-muted)]">
            Página {albums.data.page} de {albums.data.totalPages}
          </span>
          <button
            type="button"
            disabled={albums.data.page === albums.data.totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AlbumCard({
  album,
  canManage,
  onEdit,
  onDelete,
}: {
  album: ArtistPortalAlbum;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
      <div className="aspect-square bg-[var(--color-page)]">
        {album.coverArt ? (
          <img
            src={album.coverArt}
            alt={`Portada de ${album.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Disc3 className="m-[30%] h-[40%] w-[40%] text-[var(--color-muted)]" />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <h2 className="truncate font-black">{album.title}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {album.year ?? "Sin año"} · {album._count?.tracks ?? 0} canciones
          </p>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Editar ${album.title}`}
              className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-primary)]"
            >
              <FilePenLine className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Eliminar ${album.title}`}
              className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MusicCreateForm({
  albums,
  pending,
  onCancel,
  onSubmit,
}: {
  albums: Array<{ id: string; title: string }>;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    title?: string;
    file: File;
    albumId?: string;
    lyricsUrl?: string;
    lyricsLrc?: string;
  }) => void;
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [albumId, setAlbumId] = useState("");
  const [lyricsUrl, setLyricsUrl] = useState("");
  const [lyricsLrc, setLyricsLrc] = useState("");
  return (
    <form
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-music-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (file && step === 3)
          onSubmit({
            title,
            file,
            albumId: albumId || undefined,
            lyricsUrl,
            lyricsLrc,
          });
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-primary)]/50 bg-[var(--color-surface-alt)] p-5 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <div className="flex items-center justify-between gap-3">
          <h2 id="create-music-title" className="font-black">
            Nueva Musica
          </h2>
          <span className="text-xs font-bold text-[var(--color-muted)]">
            Paso {step} de 3
          </span>
        </div>
        {step === 1 ? (
          <div className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nombre de la canción (opcional)"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
            />
            <input
              type="file"
              accept="audio/wav,audio/flac,.wav,.flac"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm"
            />
            <p className="text-xs text-[var(--color-muted)]">
              Solo WAV o FLAC. El archivo se asociará al artista autenticado.
            </p>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="mt-3">
            <label className="text-sm font-bold">Álbum asociado</label>
            <select
              value={albumId}
              onChange={(event) => setAlbumId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-3 text-sm"
            >
              <option value="">— Sencillo, sin álbum —</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="mt-3 space-y-3">
            <label className="text-sm font-bold">Letra (opcional)</label>
            <input
              value={lyricsUrl}
              onChange={(event) => setLyricsUrl(event.target.value)}
              placeholder="Enlace público .lrc de Cloudflare R2"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
            />
            <textarea
              value={lyricsLrc}
              onChange={(event) => setLyricsLrc(event.target.value)}
              placeholder="Contenido .lrc (opcional)"
              rows={3}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
            />
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-bold"
          >
            Cancelar
          </button>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold"
            >
              Atrás
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !file}
              onClick={() => setStep((current) => current + 1)}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary-contrast)] disabled:opacity-40"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={!file || pending}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary-contrast)] disabled:opacity-40"
            >
              {pending ? "Subiendo..." : "Publicar música"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function MusicEditForm({
  artistId,
  albums,
  track,
  initialTitle,
  pending,
  onCancel,
  onSubmit,
}: {
  artistId: string;
  albums: Array<{ id: string; title: string }>;
  track: ArtistPortalTrack;
  initialTitle: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    title?: string;
    fileUrlRemote?: string;
    albumId?: string | null;
    lyricsUrl?: string;
    lyricsLrc?: string;
  }) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [fileUrlRemote, setFileUrlRemote] = useState(track.fileUrlRemote ?? "");
  const [albumId, setAlbumId] = useState(track.albumId ?? "");
  const [lyricsUrl, setLyricsUrl] = useState(track.lyricsUrl ?? "");
  const [lyricsLrc, setLyricsLrc] = useState(track.lyricsLrc ?? "");
  const [lyricsLoaded, setLyricsLoaded] = useState(false);
  const lyrics = useQuery({
    queryKey: ["artist-portal", "lyrics", track.id],
    queryFn: () => getArtistPortalLyrics(artistId, track.id),
    enabled: Boolean(track.id),
  });
  useEffect(() => {
    if (lyrics.data && !lyricsLoaded) {
      setLyricsUrl(lyrics.data.lyricsUrl ?? track.lyricsUrl ?? "");
      setLyricsLrc(
        lyrics.data.lrc ?? lyrics.data.text ?? track.lyricsLrc ?? "",
      );
      setLyricsLoaded(true);
    }
  }, [
    artistId,
    lyrics.data,
    lyricsLoaded,
    track.id,
    track.lyricsLrc,
    track.lyricsUrl,
  ]);
  const originalLyricsUrl = lyrics.data?.lyricsUrl ?? track.lyricsUrl ?? "";
  const originalLyricsContent =
    lyrics.data?.lrc ?? lyrics.data?.text ?? track.lyricsLrc ?? "";
  const hasStoredLyrics = Boolean(
    lyrics.data?.hasLyrics || originalLyricsUrl || originalLyricsContent,
  );
  const hasChanges =
    title.trim() !== initialTitle ||
    fileUrlRemote.trim() !== (track.fileUrlRemote ?? "") ||
    albumId !== (track.albumId ?? "") ||
    lyricsUrl.trim() !== originalLyricsUrl ||
    lyricsLrc.trim() !== originalLyricsContent;
  return (
    <form
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title,
          fileUrlRemote: fileUrlRemote.trim() || undefined,
          // A legacy API response may omit albumId. Do not detach an album
          // merely because that older response could not populate the form.
          albumId: track.albumId === undefined ? undefined : albumId || null,
          lyricsUrl: lyricsUrl.trim() || undefined,
          lyricsLrc: lyricsLrc.trim() || undefined,
        });
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-primary)]/50 bg-[var(--color-surface-alt)] p-5">
        <h2 className="font-black">Editar música: {initialTitle}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
          />
          <label className="space-y-1">
            <span className="text-xs font-bold text-[var(--color-muted)]">
              Audio WAV/FLAC · Cloudflare R2
            </span>
            <input
              value={fileUrlRemote}
              onChange={(event) => setFileUrlRemote(event.target.value)}
              placeholder="URL pública del audio WAV/FLAC (opcional)"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
            />
          </label>
          <select
            value={albumId}
            onChange={(event) => setAlbumId(event.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm"
          >
            <option value="">— Sencillo, sin álbum —</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 space-y-2">
          <label className="text-sm font-bold">Letra</label>
          {lyrics.isLoading ? (
            <p className="text-xs text-[var(--color-muted)]">
              Cargando letra almacenada…
            </p>
          ) : null}
          {lyrics.isError ? (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              No se pudo consultar la letra almacenada. Inténtalo nuevamente.
            </p>
          ) : null}
          {!lyrics.isLoading && !lyrics.isError && !hasStoredLyrics ? (
            <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-xs text-[var(--color-muted)]">
              Esta canción aún no tiene una letra LRC vinculada en MusicFlow.
              Puedes asociar una URL pública de Cloudflare R2 o pegar el
              contenido LRC.
            </p>
          ) : null}
          <label className="space-y-1">
            <span className="text-xs font-bold text-[var(--color-muted)]">
              Enlace público de Cloudflare R2 (.lrc)
            </span>
            <input
              value={lyricsUrl}
              onChange={(event) => setLyricsUrl(event.target.value)}
              placeholder="URL pública de la letra .lrc"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm"
            />
          </label>
          <textarea
            value={lyricsLrc}
            onChange={(event) => setLyricsLrc(event.target.value)}
            placeholder="Contenido .lrc cargado desde Cloudflare R2"
            rows={3}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-bold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || lyrics.isLoading || !hasChanges}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary-contrast)] disabled:opacity-40"
          >
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  );
}

function AlbumEditForm({
  album,
  pending,
  onCancel,
  onSubmit,
}: {
  album: ArtistPortalAlbum;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: { title: string; year?: number; cover?: File }) => void;
}) {
  const [title, setTitle] = useState(album.title);
  const [year, setYear] = useState(album.year?.toString() ?? "");
  const [cover, setCover] = useState<File | null>(null);
  const hasChanges =
    title.trim() !== album.title ||
    year !== (album.year?.toString() ?? "") ||
    cover !== null;
  return (
    <form
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-album-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        onSubmit({
          title: title.trim(),
          year: year ? Number(year) : undefined,
          cover: cover ?? undefined,
        });
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-primary)]/50 bg-[var(--color-surface-alt)] p-5 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <h2 id="edit-album-title" className="font-black">
          Editar álbum: {album.title}
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-label="Título del álbum"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
            />
            <input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              type="number"
              min="1900"
              max={String(new Date().getFullYear())}
              placeholder="Año (opcional)"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
            />
            <label className="block cursor-pointer rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-page)] px-3 py-4 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-primary)]">
              <span className="block font-bold text-[var(--color-text)]">
                Reemplazar portada (opcional)
              </span>
              <span className="mt-1 block">
                {cover
                  ? cover.name
                  : "Conserva la portada actual si no seleccionas una."}
              </span>
              <input
                type="file"
                accept="image/webp,image/avif,.webp,.avif"
                className="sr-only"
                onChange={(event) => setCover(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-page)]">
            {album.coverArt ? (
              <img
                src={album.coverArt}
                alt={`Portada actual de ${album.title}`}
                className="h-full min-h-44 w-full object-cover"
              />
            ) : (
              <Disc3 className="m-[30%] h-[40%] w-[40%] text-[var(--color-muted)]" />
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-bold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !title.trim() || !hasChanges}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary-contrast)] disabled:opacity-40"
          >
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  );
}

function AlbumCreateForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: { title: string; year?: number; cover: File }) => void;
}) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  return (
    <form
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-album-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (!cover || !title.trim()) return;
        onSubmit({
          title: title.trim(),
          year: year ? Number(year) : undefined,
          cover,
        });
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-primary)]/50 bg-[var(--color-surface-alt)] p-5 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <h2 id="create-album-title" className="font-black">
          Lanzar nuevo álbum
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Añade título, año y una portada WEBP o AVIF de 640 × 637 px.
        </p>
        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título del álbum"
            autoFocus
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
          />
          <input
            value={year}
            onChange={(event) => setYear(event.target.value)}
            type="number"
            min="1900"
            max={String(new Date().getFullYear())}
            placeholder="Año (opcional)"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm outline-none"
          />
          <label className="block cursor-pointer rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-page)] px-3 py-4 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-primary)]">
            <span className="block font-bold text-[var(--color-text)]">
              Portada del álbum
            </span>
            <span className="mt-1 block">
              {cover ? cover.name : "Selecciona una imagen WEBP o AVIF"}
            </span>
            <input
              type="file"
              accept="image/webp,image/avif,.webp,.avif"
              className="sr-only"
              onChange={(event) => setCover(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-bold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !title.trim() || !cover}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary-contrast)] disabled:opacity-40"
          >
            {pending ? "Publicando..." : "Publicar álbum"}
          </button>
        </div>
      </div>
    </form>
  );
}

function TopNotice({
  tone,
  message,
  onDismiss,
}: {
  tone: "success" | "error";
  message: string;
  onDismiss: () => void;
}) {
  const error = tone === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      aria-live="polite"
      className={`fixed top-5 left-1/2 z-[100] flex w-[min(92vw,34rem)] -translate-x-1/2 items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl ${
        error
          ? "border-rose-400/50 bg-rose-950 text-rose-100"
          : "border-emerald-400/50 bg-emerald-950 text-emerald-100"
      }`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded px-2 py-1 text-xs underline"
      >
        Cerrar
      </button>
    </div>
  );
}

function AnalyticsView({
  analytics,
}: {
  analytics: Awaited<ReturnType<typeof getArtistAnalytics>>;
}) {
  const [exporting, setExporting] = useState(false);
  const exportPdf = async () => {
    setExporting(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595, 842]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      page.drawText("MusicFlow for Artists · Analítica", {
        x: 48,
        y: 790,
        size: 20,
        font: bold,
        color: rgb(0.1, 0.75, 0.9),
      });
      const lines = [
        `Periodo: últimos ${analytics.days} días`,
        `Reproducciones: ${analytics.totalPlays.toLocaleString("es-PE")}`,
        `Oyentes únicos: ${analytics.uniqueListeners.toLocaleString("es-PE")}`,
        `Promedio diario: ${Math.round(analytics.totalPlays / Math.max(analytics.days, 1)).toLocaleString("es-PE")}`,
      ];
      lines.forEach((line, index) =>
        page.drawText(line, { x: 48, y: 740 - index * 28, size: 13, font }),
      );
      const bytes = await pdf.save();
      // pdf-lib returns a Uint8Array backed by ArrayBufferLike. Copy it into a
      // browser Blob-compatible ArrayBuffer before creating the download URL.
      const pdfData = new Uint8Array(bytes).buffer;
      const url = URL.createObjectURL(
        new Blob([pdfData], { type: "application/pdf" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "musicflow-analitica.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };
  const plays = {
    labels: analytics.series.map((point) => point.date.slice(5)),
    datasets: [
      {
        label: "Reproducciones",
        data: analytics.series.map((point) => point.plays),
        borderColor: "#35d7ff",
        backgroundColor: "rgba(53,215,255,.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
      },
    ],
  };
  const listening = {
    labels: analytics.series.map((point) => point.date.slice(5)),
    datasets: [
      {
        label: "Minutos escuchados",
        data: analytics.series.map((point) =>
          Math.round(point.listeningMs / 60000),
        ),
        backgroundColor: "rgba(167,139,250,.65)",
        borderRadius: 8,
      },
    ],
  };
  const listeners = {
    labels: analytics.series.map((point) => point.date.slice(5)),
    datasets: [
      {
        label: "Oyentes únicos",
        data: analytics.series.map((point) => point.listeners),
        borderColor: "#34d399",
        backgroundColor: "rgba(52,211,153,.14)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
      },
    ],
  };
  const discovery = {
    labels: analytics.series.map((point) => point.date.slice(5)),
    datasets: [
      {
        label: "Vistas de perfil",
        data: analytics.series.map((point) => point.profileViews),
        backgroundColor: "rgba(251,191,36,.65)",
        borderRadius: 8,
      },
    ],
  };
  return (
    <section className="mt-8 space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportPdf}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar PDF"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Reproducciones" value={analytics.totalPlays} />
        <Metric label="Oyentes únicos" value={analytics.uniqueListeners} />
        <Metric
          label="Promedio diario"
          value={Math.round(analytics.totalPlays / Math.max(analytics.days, 1))}
        />
        <Metric label="Vistas de perfil" value={analytics.totalProfileViews} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
          <h2 className="font-black">Evolución de reproducciones</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Últimos {analytics.days} días.
          </p>
          <div className="mt-5 h-64">
            <Line
              data={plays}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                interaction: { mode: "index", intersect: false },
                elements: {
                  point: { radius: 0, hitRadius: 14, hoverRadius: 5 },
                },
                scales: {
                  x: {
                    title: { display: true, text: "Fecha" },
                    grid: { display: false },
                  },
                  y: {
                    title: { display: true, text: "Reproducciones" },
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </article>
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
          <h2 className="font-black">Tiempo de escucha</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Minutos acumulados por día.
          </p>
          <div className="mt-5 h-64">
            <Bar
              data={listening}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    title: { display: true, text: "Fecha" },
                    grid: { display: false },
                  },
                  y: {
                    title: { display: true, text: "Minutos" },
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </article>
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
          <h2 className="font-black">Oyentes diarios</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Personas únicas que escucharon tu música cada día.
          </p>
          <div className="mt-5 h-64">
            <Line
              data={listeners}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                interaction: { mode: "index", intersect: false },
                elements: {
                  point: { radius: 0, hitRadius: 14, hoverRadius: 5 },
                },
                scales: {
                  x: {
                    title: { display: true, text: "Fecha" },
                    grid: { display: false },
                  },
                  y: {
                    title: { display: true, text: "Oyentes únicos" },
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </article>
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
          <h2 className="font-black">Descubrimiento del perfil</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Visitas únicas que recibió tu perfil de artista.
          </p>
          <div className="mt-5 h-64">
            <Bar
              data={discovery}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                interaction: { mode: "index", intersect: false },
                scales: {
                  x: {
                    title: { display: true, text: "Fecha" },
                    grid: { display: false },
                  },
                  y: {
                    title: { display: true, text: "Vistas de perfil" },
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </article>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-black">
        {value.toLocaleString("es-PE")}
      </p>
    </article>
  );
}

function SettingsEditor({
  artistId,
  initialName,
  initialBio,
  initialImage,
  isVerified,
}: {
  artistId: string;
  initialName: string;
  initialBio: string;
  initialImage: string | null;
  isVerified: boolean;
}) {
  const client = useQueryClient();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const save = useMutation({
    mutationFn: () =>
      updateArtistPortalProfile(artistId, { name: name.trim(), bio }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["artist-portal"] });
      setNotice({ tone: "success", message: "Perfil de artista actualizado." });
    },
    onError: () =>
      setNotice({ tone: "error", message: "No se pudo actualizar el perfil." }),
  });
  const verification = useMutation({
    mutationFn: () => requestArtistVerification(artistId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["artist-portal"] });
      setNotice({
        tone: "success",
        message:
          "Solicitud enviada. Recibirás una respuesta en aproximadamente 10 días.",
      });
    },
    onError: () =>
      setNotice({
        tone: "error",
        message: "No se pudo enviar la solicitud de verificación.",
      }),
  });
  const image = useMutation({
    mutationFn: (file: File) => updateArtistPortalProfileImage(artistId, file),
    onSuccess: () => client.invalidateQueries({ queryKey: ["artist-portal"] }),
  });
  return (
    <div className="mt-8 space-y-5">
      {notice ? (
        <TopNotice
          tone={notice.tone}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}
      <section className="min-h-[32rem] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {initialImage ? (
              <img
                src={initialImage}
                alt=""
                className="h-40 w-40 rounded-full object-cover"
              />
            ) : (
              <div className="h-40 w-40 rounded-full bg-[var(--color-page)]" />
            )}
            <div className="min-w-0">
              <label className="text-sm font-bold">Nombre de artista</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] p-3 outline-none"
              />
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Actualiza este perfil existente y sus canciones, sin crear otro
                artista.
              </p>
            </div>
          </div>
          <label className="cursor-pointer self-start rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] sm:self-auto">
            {image.isPending ? "Subiendo..." : "Cambiar foto"}
            <input
              type="file"
              accept="image/webp,image/avif"
              className="sr-only"
              disabled={image.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) image.mutate(file);
              }}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Imagen WEBP o AVIF recomendada: 640 × 637 px.
        </p>
        <div className="mt-5 flex items-start justify-between gap-4 border-t border-[var(--color-border)] pt-5">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-[var(--color-primary)]" />
            <div>
              <h2 className="font-bold">Sello de artista verificado</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                El equipo de MusicFlow revisará la solicitud antes de mostrar el
                sello público.
              </p>
            </div>
          </div>
          {isVerified ? (
            <span className="shrink-0 rounded-full bg-[var(--color-primary)]/15 px-3 py-1 text-xs font-black text-[var(--color-primary)]">
              Verificado
            </span>
          ) : (
            <button
              onClick={() => verification.mutate()}
              disabled={verification.isPending}
              className="shrink-0 rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary)]"
            >
              {verification.isPending ? "Enviando..." : "Solicitar"}
            </button>
          )}
        </div>
        <div className="mt-5 border-t border-[var(--color-border)] pt-5">
          <label className="text-sm font-bold">Biografía pública</label>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={6}
            className="mt-3 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] p-3 outline-none"
          />
          <button
            onClick={() => save.mutate()}
            disabled={
              save.isPending ||
              (bio === initialBio && name.trim() === initialName)
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 font-bold text-[var(--color-primary-contrast)] disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            Guardar cambios del perfil
          </button>
        </div>
      </section>
    </div>
  );
}

function ArtistPreferences() {
  const { theme, setTheme, sidebarPosition, setSidebarPosition } =
    usePreferences();
  return (
    <section className="mt-8 space-y-6">
      <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-[var(--color-primary)]" />
          <div>
            <h2 className="font-black">Tema visual</h2>
            <p className="text-sm text-[var(--color-muted)]">
              Aplica un tema a toda la experiencia del Portal Artist.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {APP_THEMES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={`rounded-xl border p-3 text-left transition ${
                option.id === theme
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
              }`}
            >
              <span
                className={`block h-12 rounded-lg ${option.previewClassName}`}
              />
              <span className="mt-3 block text-sm font-bold">
                {option.id.replaceAll("-", " ")}
              </span>
            </button>
          ))}
        </div>
      </article>
      <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
        <div className="flex items-center gap-3">
          <PanelLeft className="h-5 w-5 text-[var(--color-primary)]" />
          <div>
            <h2 className="font-black">Posición del sidebar</h2>
            <p className="text-sm text-[var(--color-muted)]">
              Elige el lado donde aparece la navegación del Portal Artist.
            </p>
          </div>
        </div>
        <div className="mt-5 inline-flex rounded-xl border border-[var(--color-border)] p-1">
          {(["left", "right"] as const).map((position) => (
            <button
              key={position}
              type="button"
              onClick={() => setSidebarPosition(position)}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${
                sidebarPosition === position
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {position === "left" ? "Izquierda" : "Derecha"}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

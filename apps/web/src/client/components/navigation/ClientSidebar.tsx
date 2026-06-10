import {
  Clock3,
  Disc3,
  Heart,
  Home,
  ListMusic,
  Mic2,
  Music4,
  Play,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";

import musicFlowLogo from "../../../shared/assets/MusicFlowLogo.webp";
import { listPlaylists, type Playlist } from "../../../shared/api/playlists";
import {
  useLatestSavedCoverQuery,
  useSavedTracksQuery,
} from "../../../shared/hooks/useLibrarySaves";
import {
  useAlbumsQuery,
  useArtistsQuery,
} from "../../../shared/hooks/useTracks";
import { useRecentlyPlayedQuery } from "../../../shared/hooks/useAnalytics";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { usePlayerStore, type PlayerTrack } from "../../stores/playStore";
import type { Track } from "../../../shared/api/tracks";
import NumberedTrackList from "../../features/sidebar/NumberedTrackList";

function trackToPlayer(t: Track): PlayerTrack | null {
  if (!t.fileUrlRemote) return null;
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    cover: t.coverArt,
    url: t.fileUrlRemote,
    durationMs: t.durationMs,
  };
}

type LibraryFilter = "all" | "playlists" | "artists" | "albums";

interface ClientSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Triggered by the "Search" pill in the top panel — focuses the navbar input. */
  onFocusSearch?: () => void;
  /** Triggered by the "Importar" button in the library header. */
  onOpenImport?: () => void;
}

function HeaderRow({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center ${
        collapsed ? "justify-between gap-2 px-2" : "gap-3 px-4"
      }`}
    >
      <img
        src={musicFlowLogo}
        alt="MusicFlow"
        className="h-9 w-9 shrink-0 rounded-lg object-cover"
      />
      {!collapsed ? (
        <p className="flex-1 truncate text-base font-semibold text-[var(--color-text)]">
          MusicFlow
        </p>
      ) : null}
      {onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
          aria-label={
            collapsed
              ? t("nav.expand", { defaultValue: "Expandir" })
              : t("nav.collapse", { defaultValue: "Contraer" })
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
          >
            <path
              d="M15 6l-6 6 6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function NavRow({
  to,
  icon,
  label,
  collapsed,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg text-sm font-medium transition ${
          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
        } ${
          isActive
            ? "text-[var(--color-text)]"
            : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
        }`
      }
    >
      {icon}
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}

function FilterChips({
  value,
  onChange,
}: {
  value: LibraryFilter;
  onChange: (v: LibraryFilter) => void;
}) {
  const { t } = useTranslation();
  const items: Array<{ id: LibraryFilter; label: string }> = [
    {
      id: "playlists",
      label: t("sidebar.filters.playlists", { defaultValue: "Playlists" }),
    },
    {
      id: "artists",
      label: t("sidebar.filters.artists", { defaultValue: "Artistas" }),
    },
    {
      id: "albums",
      label: t("sidebar.filters.albums", { defaultValue: "Álbumes" }),
    },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 px-3 pb-2 pt-1">
      {value !== "all" ? (
        <button
          type="button"
          onClick={() => onChange("all")}
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)]/10 px-2.5 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20"
          aria-label="Limpiar filtro"
        >
          ✕
        </button>
      ) : null}
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(active ? "all" : it.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                : "bg-[var(--color-page)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function LikedSongsItem({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const savedQ = useSavedTracksQuery({ take: 1 });
  const coverQ = useLatestSavedCoverQuery();
  const count = savedQ.data?.total ?? 0;
  const cover = coverQ.data?.coverArt ?? null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        collapsed
          ? t("sidebar.liked", { defaultValue: "Me gustan" })
          : undefined
      }
      className={`flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-[var(--color-surface-alt)] ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-[var(--color-cta-start)] to-[var(--color-cta-end)]">
        {cover ? (
          <>
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/35 to-black/55" />
          </>
        ) : null}
        <Heart
          className="relative h-5 w-5 text-white drop-shadow"
          strokeWidth={2.2}
          fill="currentColor"
        />
      </div>
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">
            {t("sidebar.liked", { defaultValue: "Me gustan" })}
          </p>
          <p className="truncate text-[11px] text-[var(--color-muted)]">
            {t("sidebar.likedHint", {
              defaultValue: "Playlist · {{count}} canciones",
              count,
            })}
          </p>
        </div>
      ) : null}
    </button>
  );
}

/** A short, all-caps section divider (e.g. "ACCESOS RÁPIDOS"). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
      {children}
    </p>
  );
}

/**
 * Quick-access cards for Álbumes / Artistas. Each shows a live count from the
 * catalog and jumps to the matching tab in the library. Hidden when collapsed
 * (the rail only has room for icons there).
 */
function QuickAccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const albumsQ = useAlbumsQuery();
  const artistsQ = useArtistsQuery();
  const albumCount = albumsQ.data?.length ?? 0;
  const artistCount = artistsQ.data?.length ?? 0;

  const cards = [
    {
      key: "albums",
      to: "/library?tab=albums",
      icon: <Disc3 className="h-4 w-4" strokeWidth={2.1} />,
      label: t("sidebar.filters.albums", { defaultValue: "Álbumes" }),
      count: albumCount,
    },
    {
      key: "artists",
      to: "/library?tab=artists",
      icon: <Mic2 className="h-4 w-4" strokeWidth={2.1} />,
      label: t("sidebar.filters.artists", { defaultValue: "Artistas" }),
      count: artistCount,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5 px-1">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => navigate(c.to)}
          className="flex flex-col gap-1.5 rounded-md bg-[var(--color-page)] p-2.5 text-left transition hover:bg-[var(--color-surface-alt)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            {c.icon}
          </span>
          <span className="truncate text-xs font-semibold text-[var(--color-text)]">
            {c.label}
          </span>
          <span className="text-[10px] text-[var(--color-muted)]">
            {t("sidebar.itemCount", {
              defaultValue: "{{count}}",
              count: c.count,
            })}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Compact "recently played" list, backed by /analytics/recently-played.
 * Clicking a row plays the track. Renders nothing until there's history.
 */
function RecentlyPlayed() {
  const { t } = useTranslation();
  const recentQ = useRecentlyPlayedQuery(6);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const tracks = recentQ.data ?? [];

  if (tracks.length === 0) return null;

  return (
    <>
      <SectionLabel>
        {t("sidebar.recentlyPlayed", {
          defaultValue: "Reproducido recientemente",
        })}
      </SectionLabel>
      <ul className="flex flex-col gap-0.5 px-1">
        {tracks.map((track) => (
          <li key={track.id}>
            <button
              type="button"
              onClick={() => {
                const p = trackToPlayer(track);
                if (p) void playTrack(p);
              }}
              className="group flex w-full items-center gap-2 rounded-md p-1.5 text-left transition hover:bg-[var(--color-surface-alt)]"
              title={`${track.title} — ${track.artist}`}
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--color-surface-alt)]">
                {track.coverArt ? (
                  <img
                    src={track.coverArt}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Music4
                    className="h-4 w-4 text-[var(--color-muted)]"
                    strokeWidth={1.6}
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Play
                    className="h-3.5 w-3.5 text-white"
                    strokeWidth={2.4}
                    fill="currentColor"
                  />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-[var(--color-text)]">
                  {track.title}
                </span>
                <span className="block truncate text-[9px] text-[var(--color-muted)]">
                  {track.artist}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function PlaylistItem({
  playlist,
  collapsed,
  onClick,
}: {
  playlist: Playlist;
  collapsed: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const trackCount = playlist._count?.tracks ?? 0;
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? playlist.name : undefined}
      className={`flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-[var(--color-surface-alt)] ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--color-surface-alt)]">
        {playlist.coverArt ? (
          <img
            src={playlist.coverArt}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <ListMusic
            className="h-5 w-5 text-[var(--color-muted)]"
            strokeWidth={1.7}
          />
        )}
      </div>
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">
            {playlist.name}
          </p>
          <p className="truncate text-[11px] text-[var(--color-muted)]">
            {t("sidebar.playlistHint", {
              defaultValue: "Playlist · {{count}}",
              count: trackCount,
            })}
          </p>
        </div>
      ) : null}
    </button>
  );
}

export default function ClientSidebar({
  collapsed = false,
  onToggleCollapse,
  onFocusSearch,
  onOpenImport,
}: ClientSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [filterText, setFilterText] = useState("");
  const { sidebarLayout } = usePreferences();

  // Playlists are always visible now, regardless of the layout preference —
  // they're the heart of the library and shouldn't hide behind a setting.
  // The layout preference only toggles the inline numbered liked-tracks list.
  const showPlaylists = true;
  const showNumbered =
    !collapsed && (sidebarLayout === "numbered" || sidebarLayout === "both");

  const playlistsQ = useQuery({
    queryKey: ["playlists"],
    queryFn: listPlaylists,
    staleTime: 30_000,
  });
  const playlists = playlistsQ.data ?? [];

  const visiblePlaylists = useMemo(() => {
    if (filter === "artists" || filter === "albums") return [];
    const term = filterText.trim().toLowerCase();
    if (!term) return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(term));
  }, [playlists, filter, filterText]);

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col gap-2 bg-[var(--color-page)] py-2 transition-all duration-300 ${
        collapsed ? "w-[88px] pl-2 pr-2" : "w-[300px] pl-2 pr-1"
      }`}
    >
      {/* Top panel — logo + Home/Search */}
      <div className="flex flex-col gap-2 rounded-xl bg-[var(--color-sidebar)] px-2 pb-2 pt-3">
        <HeaderRow collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
        <nav className="mt-1 flex flex-col gap-0.5 px-1">
          <NavRow
            to="/inicio"
            end
            icon={<Home className="h-[18px] w-[18px]" strokeWidth={2.2} />}
            label={t("sidebar.home", { defaultValue: "Inicio" })}
            collapsed={collapsed}
          />
          <button
            type="button"
            onClick={onFocusSearch}
            title={
              collapsed
                ? t("sidebar.search", { defaultValue: "Buscar" })
                : undefined
            }
            className={`group flex items-center gap-3 rounded-lg text-left text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-text)] ${
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
            }`}
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2.2} />
            {!collapsed ? (
              <span>{t("sidebar.search", { defaultValue: "Buscar" })}</span>
            ) : null}
          </button>
        </nav>
      </div>

      {/* Bottom panel — Your Library */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-[var(--color-sidebar)] pt-3">
        <div
          className={`flex items-center justify-between gap-2 ${
            collapsed ? "px-2" : "px-4"
          }`}
        >
          <div className="flex items-center gap-2 text-[var(--color-muted)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-[18px] w-[18px]"
            >
              <path d="M14 4h4v4" />
              <path d="M18 8l-7 7" />
              <path d="M4 4h7" strokeLinecap="round" />
              <path d="M4 12h7" strokeLinecap="round" />
              <path d="M4 20h16" strokeLinecap="round" />
            </svg>
            {!collapsed ? (
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {t("sidebar.yourLibrary", { defaultValue: "Tu biblioteca" })}
              </span>
            ) : null}
          </div>
          {!collapsed ? (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onOpenImport}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                aria-label={t("sidebar.importAria", {
                  defaultValue: "Importar canciones",
                })}
                title={t("sidebar.import", { defaultValue: "Importar" })}
              >
                <Upload className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => navigate("/playlists")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                aria-label={t("sidebar.createPlaylistAria", {
                  defaultValue: "Crear playlist",
                })}
                title={t("sidebar.createPlaylist", {
                  defaultValue: "Crear playlist",
                })}
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>
          ) : null}
        </div>

        {!collapsed ? (
          <>
            <FilterChips value={filter} onChange={setFilter} />
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-md bg-[var(--color-page)] px-2.5 py-1.5">
                <Search
                  className="h-3.5 w-3.5 text-[var(--color-muted)]"
                  strokeWidth={2.4}
                />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder={t("sidebar.searchInLibrary", {
                    defaultValue: "Buscar en tu biblioteca",
                  })}
                  className="w-full bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>
            </div>
          </>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3">
          {/* Quick access — Álbumes / Artistas. Only in the expanded rail and
              when not narrowing by a filter chip. */}
          {!collapsed && filter === "all" ? (
            <>
              <SectionLabel>
                {t("sidebar.quickAccess", {
                  defaultValue: "Accesos rápidos",
                })}
              </SectionLabel>
              <QuickAccess />
            </>
          ) : null}

          {!collapsed && filter === "all" ? <RecentlyPlayed /> : null}

          {!collapsed && filter === "all" ? (
            <SectionLabel>
              {t("sidebar.yourMusic", { defaultValue: "Tu música" })}
            </SectionLabel>
          ) : null}
          <LikedSongsItem
            collapsed={collapsed}
            onClick={() => navigate("/library?scope=mylibrary")}
          />
          {showNumbered ? <NumberedTrackList /> : null}

          {/* Playlists — always shown (collapsed shows icons only). */}
          {!collapsed && filter !== "artists" && filter !== "albums" ? (
            <SectionLabel>
              {t("sidebar.filters.playlists", { defaultValue: "Playlists" })}
            </SectionLabel>
          ) : null}
          {showPlaylists
            ? visiblePlaylists.map((p) => (
                <PlaylistItem
                  key={p.id}
                  playlist={p}
                  collapsed={collapsed}
                  onClick={() => navigate(`/playlists/${p.id}`)}
                />
              ))
            : null}
          {!collapsed && filter === "artists" ? (
            <button
              type="button"
              onClick={() => navigate("/library")}
              className="rounded-md p-3 text-left text-xs text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
            >
              {t("sidebar.browseArtists", {
                defaultValue: "Ver artistas en el catálogo →",
              })}
            </button>
          ) : null}
          {!collapsed && filter === "albums" ? (
            <button
              type="button"
              onClick={() => navigate("/library")}
              className="rounded-md p-3 text-left text-xs text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
            >
              {t("sidebar.browseAlbums", {
                defaultValue: "Ver álbumes en el catálogo →",
              })}
            </button>
          ) : null}
          {showPlaylists &&
          !collapsed &&
          playlistsQ.isSuccess &&
          visiblePlaylists.length === 0 &&
          filter !== "artists" &&
          filter !== "albums" ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-3 text-center">
              <Music4
                className="mx-auto mb-1 h-4 w-4 text-[var(--color-muted)]"
                strokeWidth={1.6}
              />
              <p className="text-[11px] text-[var(--color-muted)]">
                {filterText
                  ? t("sidebar.noMatches", {
                      defaultValue: "Sin coincidencias",
                    })
                  : t("sidebar.noPlaylists", {
                      defaultValue: "Aún no tenés playlists",
                    })}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

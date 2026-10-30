import type { SidebarItem } from "../../../shared/ui/navigation/types";

/** Artist workspace deliberately exposes publishing tools, not admin controls. */
export const sidebarArtist: SidebarItem[] = [
  {
    label: "Inicio",
    path: "/artist-dashboard",
    exact: true,
    iconKey: "stats",
  },
  {
    label: "Música",
    path: "/artist-dashboard/music",
    iconKey: "library",
  },
  {
    label: "Álbumes",
    path: "/artist-dashboard/albums",
    iconKey: "albums",
  },
  {
    label: "Analítica",
    path: "/artist-dashboard/analytics",
    iconKey: "nowPlaying",
  },
  {
    label: "Notificaciones",
    path: "/artist-dashboard/notifications",
    iconKey: "playlists",
  },
  { label: "Equipo", path: "/artist-dashboard/team", iconKey: "playlists" },
  {
    label: "Configuración",
    path: "/artist-dashboard/settings",
    iconKey: "settings",
  },
];

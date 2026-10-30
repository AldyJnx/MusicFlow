import type { SidebarItem } from "../../../shared/ui/navigation/types";

export const sidebarAdmin: SidebarItem[] = [
  {
    label: "Dashboard",
    labelKey: "admin.nav.dashboard",
    path: "/admin",
    iconKey: "library",
  },
  {
    label: "Users",
    labelKey: "admin.nav.users",
    path: "/admin/users",
    iconKey: "playlists",
  },
  {
    label: "Catálogo",
    labelKey: "admin.nav.catalog",
    path: "/admin/catalog",
    iconKey: "library",
  },
  {
    label: "EQ Presets",
    labelKey: "admin.nav.eqPresets",
    path: "/admin/eq-presets",
    iconKey: "equalizer",
  },
  {
    label: "Géneros",
    path: "/admin/genres",
    iconKey: "library",
  },
  {
    label: "AI Requests",
    labelKey: "admin.nav.aiRequests",
    path: "/admin/ai",
    iconKey: "stats",
  },
  {
    label: "Configuración",
    path: "/admin/settings",
    iconKey: "settings",
  },
  {
    label: "Acceso de artistas",
    path: "/admin/artist-access",
    iconKey: "nowPlaying",
  },
  {
    label: "Verificación de artistas",
    path: "/admin/artist-verifications",
    iconKey: "nowPlaying",
  },
];

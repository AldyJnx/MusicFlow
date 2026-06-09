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
    label: "EQ Presets",
    labelKey: "admin.nav.eqPresets",
    path: "/admin/eq-presets",
    iconKey: "equalizer",
  },
  {
    label: "AI Requests",
    labelKey: "admin.nav.aiRequests",
    path: "/admin/ai",
    iconKey: "stats",
  },
  {
    label: "Back to client",
    labelKey: "admin.nav.backToClient",
    path: "/library",
    iconKey: "settings",
  },
];

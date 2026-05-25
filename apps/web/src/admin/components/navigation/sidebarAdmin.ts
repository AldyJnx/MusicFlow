import type { SidebarItem } from "../../../shared/ui/navigation/types";

export const sidebarAdmin: SidebarItem[] = [
  { label: "Dashboard", path: "/admin", iconKey: "library" },
  { label: "Usuarios", path: "/admin/users", iconKey: "playlists" },
  { label: "AI Requests", path: "/admin/ai", iconKey: "equalizer" },
  { label: "Volver al cliente", path: "/library", iconKey: "settings" },
];

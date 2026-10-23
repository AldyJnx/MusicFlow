import type { SidebarItem } from "../../../shared/ui/navigation/types";

/** Artist workspace deliberately exposes publishing tools, not admin controls. */
export const sidebarArtist: SidebarItem[] = [
  {
    label: "Panel",
    path: "/artist-dashboard",
    iconKey: "stats",
  },
  {
    label: "Lanzamientos",
    path: "/artist-dashboard/releases",
    iconKey: "library",
  },
  {
    label: "Analítica",
    path: "/artist-dashboard/analytics",
    iconKey: "nowPlaying",
  },
];

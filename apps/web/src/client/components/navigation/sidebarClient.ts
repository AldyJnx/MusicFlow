import type { SidebarItem } from "../../../shared/ui/navigation/types";

export const sidebarClient: SidebarItem[] = [
  {
    label: "Library",
    labelKey: "nav.library",
    path: "/library",
    iconKey: "library",
    badge: "dot",
  },
  {
    label: "Playlists",
    labelKey: "nav.playlists",
    path: "/playlists",
    iconKey: "playlists",
  },
  {
    label: "Equalizer",
    labelKey: "nav.equalizer",
    path: "/equalizer",
    iconKey: "equalizer",
  },
  {
    label: "Segments",
    labelKey: "nav.segments",
    path: "/segments",
    iconKey: "segments",
  },
  {
    label: "Settings",
    labelKey: "nav.settings",
    path: "/settings",
    iconKey: "settings",
  },
];

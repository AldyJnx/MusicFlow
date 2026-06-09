export type SidebarIconKey =
  | "library"
  | "search"
  | "playlists"
  | "nowPlaying"
  | "equalizer"
  | "segments"
  | "stats"
  | "lyrics"
  | "settings";

export type SidebarItem = {
  /**
   * Fallback label used when `labelKey` is missing or i18n hasn't loaded yet.
   * Keep it in the same language as the source code (English) so it never
   * looks broken on first paint.
   */
  label: string;
  /**
   * i18n key resolved at render time. When present, takes precedence over
   * `label`. Defined per-shell (client/admin) in their sidebar configs.
   */
  labelKey?: string;
  path: string;
  iconKey: SidebarIconKey;
  badge?: string;
  active?: boolean;
  danger?: boolean;
};

import type { ReactNode } from "react";

export type SidebarProps = {
  title?: string;
  version?: string;
  items: SidebarItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /**
   * Slot rendered at the bottom of the sidebar. The client shell uses this for
   * the AI Mixer / profile quick links; the admin shell intentionally omits it.
   */
  footer?: ReactNode;
};

import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Home,
  Library,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { listPlaylists, type Playlist } from "../../../shared/api/playlists";

interface ClientSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Kept for API compatibility — search now lives in the top navbar. */
  onFocusSearch?: () => void;
  /** Opens the new-library modal (the small "+" by MI BIBLIOTECA). */
  onOpenCreateLibrary?: () => void;
  /** Opens the rename/delete controls for a library owned by this user. */
  onEditLibrary?: (playlist: Playlist) => void;
  onDeleteLibrary?: (playlist: Playlist) => void;
  onNavigate?: () => void;
  position?: "left" | "right";
  offset?: number;
}

const GRADS = [
  "linear-gradient(135deg,#7c5ce8,#e85cc0)",
  "linear-gradient(135deg,#4cf1a0,#3aa0ff)",
  "linear-gradient(135deg,#e85cc0,#ff8a5c)",
  "linear-gradient(135deg,#5c8cff,#7c5ce8)",
  "linear-gradient(135deg,#ff5c8a,#7c5ce8)",
  "linear-gradient(135deg,#4cf1a0,#7c5ce8)",
];
function gradOf(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return GRADS[h % GRADS.length];
}

type NavItem = {
  label: string;
  icon: ReactNode;
  to: string;
  /** Path prefixes that mark this item active. */
  match: string[];
};

/** Three EQ bars — the MusicFlow logo mark, animated during playback. */
function LogoMark() {
  return (
    <div
      className="flex h-8 w-8 flex-none items-center justify-center rounded-xl shadow-[0_8px_22px_-6px_var(--color-primary)]"
      style={{
        background:
          "linear-gradient(140deg,var(--color-primary),var(--color-accent))",
      }}
    >
      <div className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
        <span className="musicflow-logo-bar" />
        <span className="musicflow-logo-bar" />
        <span className="musicflow-logo-bar" />
      </div>
    </div>
  );
}

export default function ClientSidebar({
  collapsed = false,
  onToggleCollapse,
  onOpenCreateLibrary,
  onEditLibrary,
  onDeleteLibrary,
  onNavigate,
  position = "left",
  offset = 0,
}: ClientSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const playlistsQ = useQuery({
    queryKey: ["playlists"],
    queryFn: listPlaylists,
    staleTime: 30_000,
  });
  const playlists: Playlist[] = playlistsQ.data ?? [];

  const nav: NavItem[] = [
    {
      label: t("sidebar.discover", { defaultValue: "Descubrir" }),
      icon: <Home className="h-[18px] w-[18px]" strokeWidth={2.2} />,
      to: "/inicio",
      match: ["/inicio"],
    },
    {
      label: t("sidebar.catalog", { defaultValue: "Catálogo" }),
      icon: <Library className="h-[18px] w-[18px]" strokeWidth={2.2} />,
      to: "/library",
      match: ["/library"],
    },
    {
      label: t("sidebar.studio", { defaultValue: "Estudio" }),
      icon: (
        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2.2} />
      ),
      to: "/studio",
      match: ["/studio", "/equalizer", "/segments"],
    },
    {
      label: t("sidebar.settings", { defaultValue: "Ajustes" }),
      icon: <Settings className="h-[18px] w-[18px]" strokeWidth={2.2} />,
      to: "/settings",
      match: ["/settings", "/profile"],
    },
    {
      label: "Notificaciones",
      icon: <Bell className="h-[18px] w-[18px]" strokeWidth={2.2} />,
      to: "/notifications",
      match: ["/notifications"],
    },
  ];

  return (
    <aside
      className={`electron-viewport-panel fixed inset-y-0 z-[60] hidden h-screen flex-none flex-col gap-[3px] overflow-hidden bg-[rgba(8,8,16,.42)] py-5 backdrop-blur-[var(--glass-blur)] transition-all duration-300 lg:flex ${
        position === "left" ? "left-0 border-r" : "right-0 border-l"
      } border-[var(--color-line)] ${
        collapsed ? "w-[72px] px-3" : "w-[196px] px-3.5"
      }`}
      style={position === "left" ? { left: offset } : { right: offset }}
    >
      {/* Logo row */}
      <div
        className={`flex items-center gap-2.5 pb-5 pt-0.5 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title={t("sidebar.menu", { defaultValue: "Menú" })}
        >
          <LogoMark />
        </button>
        {!collapsed ? (
          <span
            className="flex-1 text-[18px] font-bold tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            MusicFlow
          </span>
        ) : null}
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={t("sidebar.collapse", { defaultValue: "Plegar menú" })}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[var(--color-line)] bg-white/[0.03] text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            {position === "left" ? (
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        ) : null}
      </div>

      {/* MENÚ */}
      {!collapsed ? (
        <span
          className="px-2.5 pb-2 pt-1 text-[var(--color-muted)]"
          style={{ font: "700 11px var(--font-mono)", letterSpacing: ".18em" }}
        >
          {t("sidebar.menuLabel", { defaultValue: "MENÚ" })}
        </span>
      ) : null}
      {nav.map((n) => {
        const active = n.match.some((m) => pathname.startsWith(m));
        return (
          <button
            key={n.label}
            type="button"
            onClick={() => {
              onNavigate?.();
              navigate(n.to);
            }}
            title={n.label}
            className={`flex items-center gap-[11px] rounded-xl text-[13.5px] transition ${
              collapsed ? "justify-center py-2.5" : "px-2.5 py-2.5"
            } ${
              active
                ? "bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] font-bold text-white"
                : "font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]"
            }`}
            style={
              !collapsed
                ? {
                    ...(position === "left"
                      ? {
                          borderLeft: `2px solid ${active ? "var(--color-primary)" : "transparent"}`,
                        }
                      : {
                          borderRight: `2px solid ${active ? "var(--color-primary)" : "transparent"}`,
                        }),
                  }
                : undefined
            }
          >
            <span className="flex h-[18px] w-[18px] flex-none items-center justify-center">
              {n.icon}
            </span>
            {!collapsed ? (
              <span className="whitespace-nowrap">{n.label}</span>
            ) : null}
          </button>
        );
      })}

      {/* Divider */}
      <div className="mx-2 my-4 h-px bg-[var(--color-line)]" />

      {/* MI BIBLIOTECA */}
      <div
        className={`flex items-center justify-between pb-2 ${
          collapsed ? "justify-center px-0" : "px-2.5"
        }`}
      >
        {!collapsed ? (
          <span
            className="text-[var(--color-muted)]"
            style={{
              font: "700 11px var(--font-mono)",
              letterSpacing: ".18em",
            }}
          >
            {t("sidebar.myLibrary", { defaultValue: "MI BIBLIOTECA" })}
          </span>
        ) : null}
        {!collapsed ? (
          <button
            type="button"
            onClick={onOpenCreateLibrary}
            title={t("sidebar.createLibrary", {
              defaultValue: "Crear biblioteca",
            })}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/[0.06] hover:text-[var(--color-text)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </button>
        ) : null}
      </div>

      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto overflow-x-hidden px-1">
        {playlists.length === 0 ? (
          !collapsed ? (
            <p className="px-2.5 py-2 text-xs text-[var(--color-muted)]">
              {t("sidebar.noPlaylists", {
                defaultValue: "Aún no tenés playlists",
              })}
            </p>
          ) : null
        ) : (
          playlists.map((p) => (
            <div
              key={p.id}
              className={`group relative flex items-center rounded-lg transition hover:bg-white/[0.05] ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onNavigate?.();
                  navigate(`/playlists/${p.id}`);
                }}
                title={p.name}
                className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-[5px] text-left ${
                  collapsed ? "justify-center px-0" : "px-2 pr-[54px]"
                }`}
              >
                <span
                  className="h-[30px] w-[30px] flex-none overflow-hidden rounded-lg shadow-[0_3px_10px_-3px_rgba(0,0,0,.6)]"
                  style={{ background: gradOf(p.id) }}
                >
                  {p.coverArt ? (
                    <img
                      src={p.coverArt}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </span>
                {!collapsed ? (
                  <span className="truncate text-[13px] font-semibold text-[var(--color-muted)]">
                    {p.name}
                  </span>
                ) : null}
              </button>
              {!collapsed ? (
                <div className="pointer-events-none absolute right-1.5 top-1/2 flex -translate-y-1/2 translate-x-1 items-center gap-0.5 opacity-0 transition-all duration-200 ease-out group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEditLibrary?.(p)}
                    title={`Editar ${p.name}`}
                    aria-label={`Editar ${p.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] transition hover:bg-white/[0.09] hover:text-[var(--color-text)]"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLibrary?.(p)}
                    title={`Eliminar ${p.name}`}
                    aria-label={`Eliminar ${p.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] transition hover:bg-red-500/15 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Expand control when collapsed */}
      {collapsed ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          title={t("sidebar.expand", { defaultValue: "Expandir menú" })}
          className="mt-1 flex h-8 w-8 flex-none items-center justify-center self-center rounded-lg border border-[var(--color-line)] bg-white/[0.03] text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      ) : null}
    </aside>
  );
}

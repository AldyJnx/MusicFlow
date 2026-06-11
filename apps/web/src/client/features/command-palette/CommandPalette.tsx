import { useEffect, useMemo, useRef, useState } from "react";
import {
  CornerDownLeft,
  Disc3,
  Home,
  Library,
  ListMusic,
  ListPlus,
  Music4,
  Search,
  Settings,
  Sliders,
  Sparkles,
  Upload,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { listPlaylists } from "../../../shared/api/playlists";
import { listTracks, type Track } from "../../../shared/api/tracks";
import { usePremiumGate } from "../../../shared/hooks/usePremiumGate";
import { usePlayerStore, type PlayerTrack } from "../../stores/playStore";

type CommandPaletteProps = {
  /** Opens the import modal owned by ClientLayout. */
  onOpenImport?: () => void;
};

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  /** Small cover thumbnail (tracks / playlists). */
  cover?: string | null;
  run: () => void;
}

interface CommandGroup {
  title: string;
  items: CommandItem[];
}

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

export default function CommandPalette({ onOpenImport }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { guard } = usePremiumGate();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const openQueueDrawer = usePlayerStore((s) => s.openQueueDrawer);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // ── Global ⌘K / Ctrl+K to toggle, Escape to close ──────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("musicflow:command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("musicflow:command-palette", onOpenEvent);
    };
  }, [open]);

  // Reset transient state each time it opens; focus the field.
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebounced("");
      setSelected(0);
      // Defer focus until the input is in the DOM.
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Debounce the query that hits the network.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 180);
    return () => window.clearTimeout(id);
  }, [query]);

  const hasQuery = debounced.length >= 2;

  const playlistsQ = useQuery({
    queryKey: ["playlists"],
    queryFn: listPlaylists,
    staleTime: 30_000,
    enabled: open,
  });

  const tracksQ = useQuery({
    queryKey: ["command-tracks", debounced],
    queryFn: () => listTracks({ search: debounced, take: 6 }),
    enabled: open && hasQuery,
    staleTime: 10_000,
  });

  function close() {
    setOpen(false);
  }

  const groups = useMemo<CommandGroup[]>(() => {
    const q = debounced.toLowerCase();
    const match = (label: string) => !q || label.toLowerCase().includes(q);

    // ── Navegación ──────────────────────────────────────────────────────
    const nav: CommandItem[] = [
      {
        id: "nav-home",
        label: t("sidebar.home", { defaultValue: "Inicio" }),
        icon: <Home className="h-4 w-4" strokeWidth={2.1} />,
        run: () => navigate("/inicio"),
      },
      {
        id: "nav-library",
        label: t("sidebar.yourLibrary", { defaultValue: "Biblioteca" }),
        icon: <Library className="h-4 w-4" strokeWidth={2.1} />,
        run: () => navigate("/library"),
      },
      {
        id: "nav-playlists",
        label: t("sidebar.filters.playlists", { defaultValue: "Playlists" }),
        icon: <ListMusic className="h-4 w-4" strokeWidth={2.1} />,
        run: () => navigate("/playlists"),
      },
      {
        id: "nav-studio",
        label: t("nav.studio", { defaultValue: "Estudio" }),
        icon: <Disc3 className="h-4 w-4" strokeWidth={2.1} />,
        run: () => navigate("/studio"),
      },
      {
        id: "nav-settings",
        label: t("nav.settings", { defaultValue: "Ajustes" }),
        icon: <Settings className="h-4 w-4" strokeWidth={2.1} />,
        run: () => navigate("/settings"),
      },
    ].filter((i) => match(i.label));

    // ── Acciones ────────────────────────────────────────────────────────
    const actions: CommandItem[] = [
      {
        id: "act-eq",
        label: t("player.openEq", { defaultValue: "Abrir ecualizador" }),
        icon: <Sliders className="h-4 w-4" strokeWidth={2.1} />,
        run: () => openEqDrawer(),
      },
      {
        id: "act-ai",
        label: t("player.askAi", { defaultValue: "Ajustar con IA" }),
        icon: <Sparkles className="h-4 w-4" strokeWidth={2.1} />,
        run: () => guard("ai", openAiPrompt),
      },
      {
        id: "act-queue",
        label: t("queue.open", { defaultValue: "Cola de reproducción" }),
        icon: <ListPlus className="h-4 w-4" strokeWidth={2.1} />,
        run: () => openQueueDrawer(),
      },
      {
        id: "act-import",
        label: t("sidebar.importAria", { defaultValue: "Importar canciones" }),
        icon: <Upload className="h-4 w-4" strokeWidth={2.1} />,
        run: () => onOpenImport?.(),
      },
    ].filter((i) => match(i.label));

    // ── Playlists (filtradas localmente) ──────────────────────────────────
    const playlists: CommandItem[] = (playlistsQ.data ?? [])
      .filter((p) => match(p.name))
      .slice(0, 6)
      .map((p) => ({
        id: `pl-${p.id}`,
        label: p.name,
        sublabel: t("sidebar.playlistHint", {
          defaultValue: "Playlist · {{count}}",
          count: p._count?.tracks ?? 0,
        }),
        icon: <ListMusic className="h-4 w-4" strokeWidth={2.1} />,
        cover: p.coverArt,
        run: () => navigate(`/playlists/${p.id}`),
      }));

    // ── Canciones (búsqueda remota) ───────────────────────────────────────
    const tracks: CommandItem[] = hasQuery
      ? (tracksQ.data?.tracks ?? [])
          .map((tr) => {
            const playable = trackToPlayer(tr);
            return { tr, playable };
          })
          .filter((x) => x.playable !== null)
          .slice(0, 6)
          .map(({ tr, playable }) => ({
            id: `tr-${tr.id}`,
            label: tr.title,
            sublabel: tr.artist,
            icon: <Music4 className="h-4 w-4" strokeWidth={2.1} />,
            cover: tr.coverArt,
            run: () => {
              if (playable) void playTrack(playable);
            },
          }))
      : [];

    const out: CommandGroup[] = [];
    if (tracks.length)
      out.push({
        title: t("commandPalette.songs", { defaultValue: "Canciones" }),
        items: tracks,
      });
    if (playlists.length)
      out.push({
        title: t("sidebar.filters.playlists", { defaultValue: "Playlists" }),
        items: playlists,
      });
    if (nav.length)
      out.push({
        title: t("commandPalette.navigate", { defaultValue: "Ir a" }),
        items: nav,
      });
    if (actions.length)
      out.push({
        title: t("commandPalette.actions", { defaultValue: "Acciones" }),
        items: actions,
      });
    return out;
  }, [
    debounced,
    hasQuery,
    playlistsQ.data,
    tracksQ.data,
    t,
    navigate,
    openEqDrawer,
    openAiPrompt,
    openQueueDrawer,
    onOpenImport,
    guard,
    playTrack,
  ]);

  // Flatten for keyboard navigation.
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Keep the selected index within bounds whenever results change.
  useEffect(() => {
    setSelected((s) => (flat.length === 0 ? 0 : Math.min(s, flat.length - 1)));
  }, [flat.length]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (flat.length ? (s + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) =>
        flat.length ? (s - 1 + flat.length) % flat.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[selected];
      if (item) {
        item.run();
        close();
      }
    }
  }

  // Scroll the active row into view as the selection moves.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${selected}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t("commandPalette.title", {
        defaultValue: "Buscar y ejecutar",
      })}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0 text-[var(--color-muted)]"
            strokeWidth={2.2}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={t("commandPalette.placeholder", {
              defaultValue: "Buscar canciones, playlists, acciones…",
            })}
            className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-muted)] sm:inline">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
              {hasQuery && tracksQ.isLoading
                ? t("sidebar.loadingShort", { defaultValue: "Cargando…" })
                : t("commandPalette.empty", {
                    defaultValue: "Sin resultados.",
                  })}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="px-2 pb-1">
                <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  const active = idx === selected;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-cmd-index={idx}
                      onMouseMove={() => setSelected(idx)}
                      onClick={() => {
                        item.run();
                        close();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                        active
                          ? "bg-[var(--color-surface-alt)]"
                          : "hover:bg-[var(--color-surface-alt)]/60"
                      }`}
                    >
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--color-page)] text-[var(--color-muted)]">
                        {item.cover ? (
                          <img
                            src={item.cover}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          item.icon
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[var(--color-text)]">
                          {item.label}
                        </span>
                        {item.sublabel ? (
                          <span className="block truncate text-[11px] text-[var(--color-muted)]">
                            {item.sublabel}
                          </span>
                        ) : null}
                      </span>
                      {active ? (
                        <CornerDownLeft
                          className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]"
                          strokeWidth={2.2}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-[10px] text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5">
              ↑
            </kbd>
            <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5">
              ↓
            </kbd>
            {t("commandPalette.navigate", { defaultValue: "Navegar" })}
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5">
              ↵
            </kbd>
            {t("commandPalette.select", { defaultValue: "Seleccionar" })}
          </span>
        </div>
      </div>
    </div>
  );
}

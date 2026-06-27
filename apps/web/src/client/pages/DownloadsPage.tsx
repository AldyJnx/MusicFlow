import { useMemo } from "react";
import {
  CloudOff,
  Download,
  FolderPlus,
  HardDrive,
  Loader2,
  Music4,
  Play,
  Trash2,
  Wifi,
} from "lucide-react";

import ClientLayout from "../layout/ClientLayout";
import OfflineCover from "../../shared/ui/OfflineCover";
import { useDownloadsStore } from "../../shared/stores/downloadsStore";
import { useNetworkStore } from "../../shared/stores/networkStore";
import {
  isSupported as localSupported,
  useLocalLibraryStore,
} from "../../shared/offline/localLibrary";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";

function fmt(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function DownloadsPage() {
  const items = useDownloadsStore((s) => s.items);
  const remove = useDownloadsStore((s) => s.remove);
  const effectiveOffline = useNetworkStore((s) => s.effectiveOffline);
  const forcedOffline = useNetworkStore((s) => s.forcedOffline);
  const setForcedOffline = useNetworkStore((s) => s.setForcedOffline);
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id ?? null);

  const localItems = useLocalLibraryStore((s) => s.items);
  const localFolder = useLocalLibraryStore((s) => s.folderName);
  const scanning = useLocalLibraryStore((s) => s.scanning);
  const pickFolder = useLocalLibraryStore((s) => s.pickFolder);
  const rescan = useLocalLibraryStore((s) => s.rescan);

  const list = useMemo(
    () => Object.values(items).sort((a, b) => b.downloadedAt - a.downloadedAt),
    [items],
  );
  const locals = useMemo(
    () =>
      Object.values(localItems).sort((a, b) => a.title.localeCompare(b.title)),
    [localItems],
  );

  const playLocal = (index: number) => {
    const playable: PlayerTrack[] = locals.map((m) => ({
      id: m.id,
      title: m.title,
      artist: m.artist,
      cover: null,
      url: `local:${m.id}`,
      durationMs: m.durationMs,
    }));
    if (playable.length) void playTrackList(playable, index);
  };

  // Downloaded tracks play from their local blob (resolved by the player by id),
  // so a placeholder url is enough here.
  const playFrom = (index: number) => {
    const playable: PlayerTrack[] = list.map((m) => ({
      id: m.id,
      title: m.title,
      artist: m.artist,
      cover: null,
      url: `offline:${m.id}`,
      durationMs: m.durationMs,
    }));
    if (playable.length) void playTrackList(playable, index);
  };

  return (
    <ClientLayout>
      <section className="min-h-screen w-full px-8 py-8 text-[var(--color-text)]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Sin conexión
              </p>
              <h1
                className="text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Descargas
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {list.length} canciones disponibles sin internet.
              </p>
            </div>

            {/* Manual offline toggle (the "Modo sin conexión" switch). */}
            <button
              type="button"
              onClick={() => setForcedOffline(!forcedOffline)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                effectiveOffline
                  ? "border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]"
                  : "border-[var(--color-line)] bg-[var(--color-glass)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {effectiveOffline ? (
                <CloudOff className="h-4 w-4" strokeWidth={2.2} />
              ) : (
                <Wifi className="h-4 w-4" strokeWidth={2.2} />
              )}
              {effectiveOffline ? "Modo sin conexión" : "En línea"}
            </button>
          </div>

          {effectiveOffline ? (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] px-4 py-3 text-sm text-[var(--color-text)]">
              <CloudOff className="h-4 w-4 flex-none text-[var(--color-accent)]" />
              Estás en modo sin conexión: solo se reproducen tus descargas. Al
              volver el internet, el catálogo regresa automáticamente.
            </div>
          ) : null}

          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-10 text-center">
              <Download
                className="mx-auto mb-3 h-8 w-8 text-[var(--color-muted)]"
                strokeWidth={1.6}
              />
              <p className="text-sm text-[var(--color-muted)]">
                Aún no descargas nada. Toca el ícono de descarga en cualquier
                canción para escucharla sin conexión.
              </p>
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-line)]">
              {list.map((m, i) => {
                const active = currentTrackId === m.id;
                return (
                  <div
                    key={m.id}
                    className="group grid grid-cols-[40px_1fr_56px_32px] items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-glass)] px-3 py-2.5 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => playFrom(i)}
                      className="group/cover relative h-10 w-10 overflow-hidden rounded-md"
                    >
                      <OfflineCover id={m.id} className="h-full w-full" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover/cover:opacity-100">
                        {active ? (
                          <Music4 className="h-4 w-4 text-white" />
                        ) : (
                          <Play
                            className="h-4 w-4 text-white"
                            fill="currentColor"
                            stroke="none"
                          />
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => playFrom(i)}
                      className="min-w-0 text-left"
                    >
                      <span
                        className={`block truncate text-sm font-bold ${active ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"}`}
                      >
                        {m.title}
                      </span>
                      <span className="block truncate text-xs text-[var(--color-muted)]">
                        {m.artist}
                      </span>
                    </button>
                    <span
                      className="text-right text-xs text-[var(--color-muted)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {fmt(m.durationMs)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void remove(m.id)}
                      title="Quitar descarga"
                      className="text-[var(--color-muted)] transition hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Local files (offline "normal player") ── */}
          <div className="mt-10">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-[var(--color-primary)]" />
                  <h2
                    className="text-lg font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Mis archivos locales
                  </h2>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  {localFolder
                    ? `Carpeta: ${localFolder} · ${locals.length} pistas`
                    : "Reproduce música de tu dispositivo, sin subirla."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {localFolder ? (
                  <button
                    type="button"
                    onClick={() => void rescan()}
                    disabled={scanning}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-glass)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-text)] disabled:opacity-50"
                  >
                    {scanning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Reescanear
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void pickFolder()}
                  disabled={!localSupported() || scanning}
                  title={
                    localSupported()
                      ? "Elegir una carpeta de música"
                      : "Tu navegador no soporta acceso a carpetas (usa la app de escritorio)"
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-[var(--color-primary-contrast)] transition hover:opacity-90 disabled:opacity-40"
                >
                  <FolderPlus className="h-4 w-4" />
                  {localFolder ? "Cambiar carpeta" : "Agregar carpeta"}
                </button>
              </div>
            </div>

            {!localSupported() ? (
              <p className="rounded-xl border border-dashed border-[var(--color-line)] p-4 text-xs text-[var(--color-muted)]">
                Este navegador no permite leer carpetas locales. En la app de
                escritorio (Electron) se reconocen automáticamente.
              </p>
            ) : locals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--color-line)] p-4 text-xs text-[var(--color-muted)]">
                Aún no agregas una carpeta. "Agregar carpeta" reconoce tus
                archivos de audio y los reproduce sin conexión.
              </p>
            ) : (
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-line)]">
                {locals.map((m, i) => {
                  const active = currentTrackId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => playLocal(i)}
                      className="group/row grid grid-cols-[40px_1fr_56px_44px] items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-glass)] px-3 py-2.5 text-left last:border-b-0 hover:bg-white/[0.04]"
                    >
                      <span className="relative h-10 w-10 overflow-hidden rounded-md">
                        <OfflineCover
                          id={m.id}
                          source="local"
                          className="h-full w-full"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover/row:opacity-100">
                          {active ? (
                            <Music4 className="h-4 w-4 text-white" />
                          ) : (
                            <Play
                              className="h-4 w-4 text-white"
                              fill="currentColor"
                              stroke="none"
                            />
                          )}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-sm font-bold ${active ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"}`}
                        >
                          {m.title}
                        </span>
                        <span className="block truncate text-xs text-[var(--color-muted)]">
                          {m.artist}
                          {m.album ? ` · ${m.album}` : ""}
                        </span>
                      </span>
                      <span
                        className="text-right text-xs text-[var(--color-muted)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {m.durationMs ? fmt(m.durationMs) : "—"}
                      </span>
                      <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                        Local
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </ClientLayout>
  );
}

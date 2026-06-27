import {
  ArrowLeft,
  Disc3,
  ListMusic,
  Play,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import { useTracksQuery } from "../../shared/hooks/useTracks";
import { getCatalogArtist, listCatalogArtists } from "../../shared/api/catalog";
import SaveButton from "../../shared/ui/SaveButton";
import { useSavedCheckQuery } from "../../shared/hooks/useLibrarySaves";
import { usePremiumGate } from "../../shared/hooks/usePremiumGate";
import { usePlayerStore, type PlayerTrack } from "../stores/playStore";
import type { Track } from "../../shared/api/tracks";

function toPlayerTrack(t: Track): PlayerTrack | null {
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Dedicated artist view inspired by the mock's `arjit.html`. Shows a
 * gradient avatar + name + track count, a "Reproducir todo" CTA, and the
 * artist's full track list rendered as a dense numbered table. Follows the
 * same CTA hierarchy as HeroFeatured (solid primary / outline primary /
 * outline accent).
 */
export default function ArtistPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ name: string }>();
  const artistName = decodeURIComponent(params.name ?? "");
  const playTrack = usePlayerStore((s) => s.playTrack);
  const playTrackList = usePlayerStore((s) => s.playTrackList);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);
  const { guard } = usePremiumGate();

  const tracksQ = useTracksQuery({ artist: artistName, take: 100 });
  const tracks = tracksQ.data?.tracks ?? [];

  // Resolve the catalog artist (by name) to surface admin-curated albums.
  const catalogArtistsQ = useQuery({
    queryKey: ["catalog", "artists"],
    queryFn: listCatalogArtists,
    staleTime: 60_000,
  });
  const catalogArtistId = useMemo(
    () =>
      (catalogArtistsQ.data ?? []).find((a) => a.name === artistName)?.id ??
      null,
    [catalogArtistsQ.data, artistName],
  );
  const catalogArtistQ = useQuery({
    queryKey: ["catalog", "artist", catalogArtistId],
    queryFn: () => getCatalogArtist(catalogArtistId as string),
    enabled: !!catalogArtistId,
  });
  const albums = catalogArtistQ.data?.albums ?? [];
  const visibleIds = useMemo(() => tracks.map((tr) => tr.id), [tracks]);
  const savedCheckQ = useSavedCheckQuery(visibleIds);
  const savedSet = useMemo(
    () => new Set(savedCheckQ.data ?? []),
    [savedCheckQ.data],
  );

  // Prefer the real artist photo; fall back to the first track's cover, then
  // a generated gradient.
  const artistImage = tracks.find((tr) => tr.artistImage)?.artistImage ?? null;
  const heroCover =
    artistImage ?? tracks.find((tr) => tr.coverArt)?.coverArt ?? null;
  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < artistName.length; i++) {
      h = (h * 31 + artistName.charCodeAt(i)) % 360;
    }
    return h;
  }, [artistName]);
  const initials = artistName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  function playOne(track: Track) {
    const playable = toPlayerTrack(track);
    if (playable) void playTrack(playable);
  }

  function playAll(startIndex = 0) {
    const playable = tracks
      .map(toPlayerTrack)
      .filter((p): p is PlayerTrack => p !== null);
    if (playable.length > 0) void playTrackList(playable, startIndex);
  }

  if (!artistName) {
    return (
      <ClientLayout>
        <div className="px-8 py-12">
          <p className="text-[var(--color-muted)]">
            {t("artist.missing", { defaultValue: "Artista no especificado." })}
          </p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <section className="min-h-screen w-full text-[var(--color-text)]">
        {/* Hero — artist art + name + CTAs */}
        <header className="relative h-[320px] w-full overflow-hidden">
          {heroCover ? (
            <>
              <img
                src={heroCover}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-page)]/40 via-[var(--color-page)]/70 to-[var(--color-page)]" />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, hsl(${hue} 70% 35%) 0%, var(--color-page) 70%)`,
              }}
            />
          )}

          <div className="relative flex h-full flex-col justify-end gap-4 px-8 pb-8 pt-16">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-surface)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] backdrop-blur transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
              {t("artist.back", { defaultValue: "Volver" })}
            </button>

            <div className="flex items-end gap-5">
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white shadow-[0_14px_30px_rgba(0,0,0,0.4)] ring-2 ring-[var(--color-line)]"
                style={
                  artistImage
                    ? undefined
                    : {
                        background: `linear-gradient(135deg, hsl(${hue} 70% 50%) 0%, hsl(${(hue + 40) % 360} 65% 35%) 100%)`,
                      }
                }
              >
                {artistImage ? (
                  <img
                    src={artistImage}
                    alt={artistName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || "?"
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  {t("artist.eyebrow", { defaultValue: "Artista" })}
                </p>
                <h1 className="truncate text-5xl font-extrabold leading-tight tracking-tight text-[var(--color-text)] sm:text-6xl">
                  {artistName}
                </h1>
                <p className="text-sm text-[var(--color-muted)]">
                  {t("artist.trackCount", {
                    defaultValue: "{{count}} canciones",
                    count: tracks.length,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {/* Solid primary — dominant action. */}
              <button
                type="button"
                onClick={() => playAll(0)}
                disabled={tracks.length === 0}
                className="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-base font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play
                  className="h-5 w-5"
                  strokeWidth={2.4}
                  fill="currentColor"
                />
                {t("artist.playAll", { defaultValue: "Reproducir todo" })}
              </button>
              {/* Outline primary — secondary config action. */}
              <button
                type="button"
                onClick={openEqDrawer}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
              >
                <Sliders className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("home.editEq", { defaultValue: "Editar EQ" })}
              </button>
              {/* Outline accent — IA action. */}
              <button
                type="button"
                onClick={() => guard("ai", openAiPrompt)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-accent)] bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/10"
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("home.aiSuggest", { defaultValue: "IA sugiere" })}
              </button>
            </div>
          </div>
        </header>

        {/* Albums (admin-curated) */}
        {albums.length > 0 ? (
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-8 pt-10">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {t("artist.albums", { defaultValue: "Álbumes" })}
            </h2>
            <div className="flex flex-wrap gap-5">
              {albums.map((al) => (
                <button
                  key={al.id}
                  type="button"
                  onClick={() => navigate(`/album/${al.id}`)}
                  className="group flex w-[160px] flex-none flex-col gap-2 text-left"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--color-surface-alt)] shadow-[0_10px_30px_-12px_rgba(0,0,0,.7)]">
                    {al.coverArt ? (
                      <img
                        src={al.coverArt}
                        alt={al.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Disc3
                          className="h-10 w-10 text-[var(--color-muted)]"
                          strokeWidth={1.4}
                        />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--color-text)]">
                      {al.title}
                    </p>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {al.year ? `${al.year} · ` : ""}
                      {al.trackCount} canciones
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Tracks list */}
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-8 py-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {t("artist.songs", { defaultValue: "Canciones" })}
          </h2>

          {tracksQ.isLoading ? (
            <ul className="flex flex-col gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <li
                  key={i}
                  className="flex animate-pulse items-center gap-4 rounded-lg bg-[var(--color-surface)] p-3"
                >
                  <div className="h-4 w-6 rounded bg-[var(--color-surface-alt)]" />
                  <div className="h-10 w-10 rounded bg-[var(--color-surface-alt)]" />
                  <div className="h-3 flex-1 rounded bg-[var(--color-surface-alt)]" />
                </li>
              ))}
            </ul>
          ) : tracks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center">
              <ListMusic
                className="mx-auto mb-2 h-8 w-8 text-[var(--color-muted)]"
                strokeWidth={1.4}
              />
              <p className="text-sm text-[var(--color-muted)]">
                {t("artist.empty", {
                  defaultValue:
                    "Este artista todavía no tiene canciones en el catálogo.",
                })}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {tracks.map((track, idx) => (
                <li
                  key={track.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => playOne(track)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      playOne(track);
                    }
                  }}
                  className="group flex w-full cursor-pointer items-center gap-4 rounded-lg p-3 text-left transition hover:bg-[var(--color-surface)]"
                >
                  <span className="w-6 shrink-0 text-center text-xs font-bold text-[var(--color-muted)] group-hover:text-[var(--color-primary)]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-[var(--color-surface-alt)]">
                    {track.coverArt ? (
                      <img
                        src={track.coverArt}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ListMusic
                        className="absolute inset-0 m-auto h-4 w-4 text-[var(--color-muted)]"
                        strokeWidth={1.6}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-[var(--color-muted)]">
                      {track.album ??
                        t("artist.singleSentinel", {
                          defaultValue: "Single",
                        })}
                    </p>
                  </div>
                  <span className="hidden text-xs tabular-nums text-[var(--color-muted)] sm:inline">
                    {formatDuration(track.durationMs)}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <SaveButton
                      trackId={track.id}
                      saved={savedSet.has(track.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </ClientLayout>
  );
}

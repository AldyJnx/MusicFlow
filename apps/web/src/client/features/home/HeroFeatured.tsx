import { ListMusic, Play, Sliders, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import SaveButton from "../../../shared/ui/SaveButton";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { usePlayerStore, type PlayerTrack } from "../../stores/playStore";
import type { Track } from "../../../shared/api/tracks";
import type { Playlist } from "../../../shared/api/playlists";
import SegmentPreview from "./SegmentPreview";

type HeroFeaturedProps = {
  heroTrack: Track | null;
  featuredPlaylist?: Playlist | null;
  saved: boolean;
  toPlayerTrack: (t: Track) => PlayerTrack | null;
};

/**
 * MusicFlow's home hero. Respects the `heroVariant` preference:
 *  - `featured-track`: track destacado con SegmentPreview + CTAs EQ/IA.
 *  - `featured-playlist`: muestra la primera playlist del usuario. Si no
 *    tiene playlists, cae al modo track para no dejar el hero vacío.
 *  - `off`: no renderiza nada (el carrusel gana el espacio).
 *
 * ─── Jerarquía de CTAs ───────────────────────────────────────────────────
 * El hero combina hasta tres estilos de botón con propósitos distintos:
 *
 *  1. **Solid primary** (`bg-[var(--color-primary)]`) → acción dominante,
 *     una sola por hero. Hoy: `PLAY` (track) o `REPRODUCIR LISTA` (playlist).
 *
 *  2. **Outline primary** (`border-[var(--color-primary)]`, sin fondo) →
 *     acciones secundarias de configuración del mismo dominio. Hoy:
 *     `EDITAR EQ` (cambia el sonido), `EXPLORAR` (navegación auxiliar).
 *
 *  3. **Outline accent** (`border-[var(--color-accent)]`, sin fondo) →
 *     acciones potenciadas por IA o "wow moments". Hoy: `IA SUGIERE`. El
 *     accent existe precisamente para distinguir lo que sólo MusicFlow
 *     ofrece (segmentos, agente Claude) del resto de la UI.
 *
 * Regla: nunca dos solid primary en la misma fila de CTAs.
 */
export default function HeroFeatured({
  heroTrack,
  featuredPlaylist,
  saved,
  toPlayerTrack,
}: HeroFeaturedProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { heroVariant } = usePreferences();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const openEqDrawer = usePlayerStore((s) => s.openEqDrawer);
  const openAiPrompt = usePlayerStore((s) => s.openAiPrompt);

  // Mount-only fade-in so route changes feel less abrupt.
  const [heroIn, setHeroIn] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setHeroIn(true), 50);
    return () => window.clearTimeout(id);
  }, []);

  if (heroVariant === "off") return null;

  function playOne(track: Track) {
    const playable = toPlayerTrack(track);
    if (playable) void playTrack(playable);
  }

  // Resolve the actual mode after fallback: if the user picked
  // `featured-playlist` but has none, render the track variant instead.
  const showPlaylist =
    heroVariant === "featured-playlist" && featuredPlaylist != null;

  if (showPlaylist) {
    return (
      <PlaylistHero
        playlist={featuredPlaylist!}
        heroIn={heroIn}
        onOpen={() => navigate("/playlists")}
      />
    );
  }

  return (
    <header
      className={`relative h-[360px] w-full overflow-hidden transition-opacity duration-500 ${
        heroIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {heroTrack?.coverArt ? (
        <>
          <img
            src={heroTrack.coverArt}
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-3/5 object-cover"
            style={{
              maskImage:
                "linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%)",
              WebkitMaskImage:
                "linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-page)] via-[var(--color-page)]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-page)] via-transparent to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-page)_60%)]" />
      )}
      <div className="relative flex h-full flex-col justify-end gap-4 px-8 pb-10 pt-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {heroTrack
            ? t("home.heroEyebrow", { defaultValue: "Lo que más sonaba" })
            : t("home.heroEmptyEyebrow", { defaultValue: "Bienvenido" })}
        </p>
        <h1 className="max-w-2xl text-5xl font-extrabold leading-tight tracking-tight text-[var(--color-text)] sm:text-6xl">
          {heroTrack?.title ??
            t("home.heroEmptyTitle", {
              defaultValue: "Empieza a construir tu biblioteca",
            })}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
          {heroTrack
            ? `${heroTrack.artist}${heroTrack.album ? ` · ${heroTrack.album}` : ""}`
            : t("home.heroEmptyHint", {
                defaultValue:
                  "Importá tus canciones o explorá el catálogo para empezar a guardar lo que más te gusta.",
              })}
        </p>

        {heroTrack ? (
          <SegmentPreview
            trackId={heroTrack.id}
            durationMs={heroTrack.durationMs}
          />
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {heroTrack ? (
            <>
              {/* Solid primary — dominant action. */}
              <button
                type="button"
                onClick={() => playOne(heroTrack)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:scale-[1.03]"
              >
                <Play
                  className="h-4 w-4"
                  strokeWidth={2.4}
                  fill="currentColor"
                />
                {t("home.play", { defaultValue: "Play" })}
              </button>
              <SaveButton trackId={heroTrack.id} saved={saved} size="md" />
              {/* Outline primary — secondary config action. */}
              <button
                type="button"
                onClick={openEqDrawer}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
                title={t("home.editEq", { defaultValue: "Editar EQ" })}
              >
                <Sliders className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("home.editEq", { defaultValue: "Editar EQ" })}
              </button>
              {/* Outline accent — AI / "wow" action. */}
              <button
                type="button"
                onClick={openAiPrompt}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-accent)] bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/10"
                title={t("home.aiSuggest", { defaultValue: "IA sugiere" })}
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("home.aiSuggest", { defaultValue: "IA sugiere" })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/library")}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:scale-[1.03]"
            >
              {t("home.explore", { defaultValue: "Explorar catálogo" })}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Sub-variant of the hero rendered when the user prefers a playlist as the
 * focal point. We don't pre-fetch the playlist's tracks here — clicking
 * "Abrir lista" navigates to /playlists where the full track list and the
 * play action already live.
 */
function PlaylistHero({
  playlist,
  heroIn,
  onOpen,
}: {
  playlist: Playlist;
  heroIn: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const trackCount = playlist._count?.tracks ?? 0;

  return (
    <header
      className={`relative h-[360px] w-full overflow-hidden transition-opacity duration-500 ${
        heroIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {playlist.coverArt ? (
        <>
          <img
            src={playlist.coverArt}
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-3/5 object-cover"
            style={{
              maskImage:
                "linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%)",
              WebkitMaskImage:
                "linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 90%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-page)] via-[var(--color-page)]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-page)] via-transparent to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-page)_60%)]" />
      )}
      <div className="relative flex h-full flex-col justify-end gap-4 px-8 pb-10 pt-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {t("home.heroEyebrowPlaylist", { defaultValue: "Lista destacada" })}
        </p>
        <h1 className="max-w-2xl text-5xl font-extrabold leading-tight tracking-tight text-[var(--color-text)] sm:text-6xl">
          {playlist.name}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
          {playlist.description ||
            t("home.heroPlaylistHint", {
              defaultValue: "{{count}} canciones en tu lista",
              count: trackCount,
            })}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {/* Solid primary — dominant action. */}
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:scale-[1.03]"
          >
            <ListMusic className="h-4 w-4" strokeWidth={2.4} />
            {t("home.openPlaylist", { defaultValue: "Abrir lista" })}
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-2 text-xs font-semibold text-[var(--color-muted)] backdrop-blur-sm">
            <ListMusic className="h-3.5 w-3.5" strokeWidth={2.2} />
            {t("home.playlistCount", {
              defaultValue: "{{count}} pistas",
              count: trackCount,
            })}
          </span>
        </div>
      </div>
    </header>
  );
}

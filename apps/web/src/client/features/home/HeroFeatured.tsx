import { Play, Sliders, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import SaveButton from "../../../shared/ui/SaveButton";
import { usePreferences } from "../../../shared/hooks/usePreferences";
import { usePlayerStore, type PlayerTrack } from "../../stores/playStore";
import type { Track } from "../../../shared/api/tracks";
import SegmentPreview from "./SegmentPreview";

type HeroFeaturedProps = {
  heroTrack: Track | null;
  saved: boolean;
  toPlayerTrack: (t: Track) => PlayerTrack | null;
};

/**
 * MusicFlow's home hero. Respects `heroVariant`:
 *  - `featured-track`: track destacado con SegmentPreview + CTAs EQ/IA.
 *  - `featured-playlist`: por ahora cae al mismo featured-track (placeholder
 *    intencional — la vista de playlist destacada requiere su propio endpoint).
 *  - `off`: no renderiza nada (espacio gana el carrusel debajo).
 *
 * Inspirado en el hero del mock pero con segmentos y CTAs que sólo MusicFlow
 * puede ofrecer.
 */
export default function HeroFeatured({
  heroTrack,
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
            ? heroVariant === "featured-playlist"
              ? t("home.heroEyebrowPlaylist", {
                  defaultValue: "Lista destacada",
                })
              : t("home.heroEyebrow", {
                  defaultValue: "Lo que más sonaba",
                })
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
              <button
                type="button"
                onClick={openEqDrawer}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] bg-transparent px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
                title={t("home.editEq", { defaultValue: "Editar EQ" })}
              >
                <Sliders className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t("home.editEq", { defaultValue: "Editar EQ" })}
              </button>
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

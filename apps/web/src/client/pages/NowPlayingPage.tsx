import { Play } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
import Wave from "../features/player/Wave";
import { usePreferences } from "../../shared/hooks/usePreferences";
import { usePlayerStore } from "../stores/playStore";

/**
 * Route version of the full player. Auto-opens the ExpandedPlayer overlay so
 * the user can deep-link to the "now playing" experience. If there is no
 * current track we render a friendly empty state with a link back to the
 * library.
 */
export default function NowPlayingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const { showWave } = usePreferences();

  useEffect(() => {
    if (currentTrack) {
      setExpanded(true);
    }
    return () => {
      setExpanded(false);
    };
  }, [currentTrack, setExpanded]);

  if (currentTrack) {
    // ExpandedPlayer is mounted in ClientLayout and now visible due to the
    // effect above. Render a transparent shell — the overlay covers the page.
    return (
      <ClientLayout>
        <div className="min-h-screen bg-[var(--color-page)]" />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-page)] px-6 text-center">
        {/* Ambient glow — same language as the StudioPage hero. */}
        <div
          className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: "var(--color-primary)" }}
        />
        <div
          className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "var(--color-accent)" }}
        />

        <div className="relative max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-10 shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="flex items-center justify-center gap-3">
            {showWave ? <Wave active={false} size={18} /> : null}
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-primary)]">
              {t("player.nowPlaying")}
            </p>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {t("nowPlaying.emptyTitle", {
              defaultValue: "Tu sonido te espera",
            })}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {t("nowPlaying.emptyHint", {
              defaultValue:
                "Elegí una canción de tu biblioteca para empezar a sonar. Acá vas a ver el player completo cuando suene algo.",
            })}
          </p>
          {/* Solid primary — dominant action. */}
          <button
            type="button"
            onClick={() => navigate("/library")}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-[var(--color-primary-contrast)] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:scale-[1.03]"
          >
            <Play className="h-4 w-4" strokeWidth={2.4} fill="currentColor" />
            {t("nav.library")}
          </button>
        </div>
      </section>
    </ClientLayout>
  );
}

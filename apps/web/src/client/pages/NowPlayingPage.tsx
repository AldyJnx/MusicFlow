import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import ClientLayout from "../layout/ClientLayout";
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
      <section className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-6 text-center">
        <div className="max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
            {t("player.nowPlaying")}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {t("player.lyrics.empty")}
          </h1>
          <button
            type="button"
            onClick={() => navigate("/library")}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-page)] transition hover:scale-[1.02]"
          >
            {t("nav.library")}
          </button>
        </div>
      </section>
    </ClientLayout>
  );
}

import { useNavigate } from "react-router-dom";
import type { PlayerTrack } from "../../stores/playStore";

type ArtistCreditsProps = {
  track: PlayerTrack;
  className?: string;
  compact?: boolean;
};

/** Individual profile links for a track's primary artist and guest credits. */
export default function ArtistCredits({
  track,
  className = "",
  compact = false,
}: ArtistCreditsProps) {
  const navigate = useNavigate();
  const primaryArtist = track.artistProfileName ?? track.artist;
  const guests = track.featuredArtists ?? [];
  const linkClass = compact
    ? "truncate transition hover:text-[var(--color-accent)] hover:underline"
    : "truncate transition hover:text-[var(--color-accent)] hover:underline";

  function openArtist(name: string) {
    navigate(`/artist/${encodeURIComponent(name)}`);
  }

  return (
    <span
      className={`inline-flex min-w-0 flex-wrap items-baseline gap-x-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => openArtist(primaryArtist)}
        title={`Ver perfil de ${primaryArtist}`}
        className={linkClass}
      >
        {primaryArtist}
      </button>
      {guests.length > 0 ? <span className="shrink-0">ft.</span> : null}
      {guests.map((guest, index) => (
        <span
          key={`${guest.artistName}-${index}`}
          className="inline-flex min-w-0 items-baseline gap-x-1"
        >
          {guest.artistId ? (
            <button
              type="button"
              onClick={() => openArtist(guest.artistName)}
              title={`Ver perfil de ${guest.artistName}`}
              className={linkClass}
            >
              {guest.artistName}
            </button>
          ) : (
            <span
              className="truncate"
              title={`${guest.artistName} no tiene perfil en MusicFlow`}
            >
              {guest.artistName}
            </span>
          )}
          {index < guests.length - 1 ? (
            <span className="shrink-0">·</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

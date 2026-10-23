export type FeaturedArtistCredit = {
  artistName: string;
  /** Missing for an unregistered collaborator, which must remain non-clickable. */
  artistId?: string | null;
};

/**
 * Keeps the canonical main artist separate from optional featuring credits,
 * while producing the label users expect in search results and the player.
 */
export function formatTrackArtist(
  artist: string,
  featuredArtists?: readonly FeaturedArtistCredit[] | null,
): string {
  const credits = (featuredArtists ?? [])
    .map((credit) => credit.artistName.trim())
    .filter(Boolean);
  return credits.length > 0 ? `${artist} ft. ${credits.join(", ")}` : artist;
}

/**
 * Preserves the individual guest identities when a catalog track enters the
 * player queue. The display string alone is deliberately not parsed: names can
 * contain hyphens and punctuation, so the API credit is the sole authority.
 */
export function toPlayerFeaturedArtists(
  featuredArtists?: readonly FeaturedArtistCredit[] | null,
): FeaturedArtistCredit[] {
  return (featuredArtists ?? [])
    .map((credit) => ({
      artistName: credit.artistName.trim(),
      artistId: credit.artistId ?? null,
    }))
    .filter((credit) => Boolean(credit.artistName));
}

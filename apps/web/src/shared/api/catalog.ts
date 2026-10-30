import { api } from "./client";

export interface CatalogArtist {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isVerified: boolean;
  genres: string[];
  albumCount: number;
  trackCount: number;
}

export interface CatalogTrackCard {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  coverArt: string | null;
  artistImage: string | null;
  artistId?: string | null;
  fileUrlRemote: string | null;
  trackNumber: number | null;
  albumId: string | null;
  albumOrder: number | null;
  featuredArtists: Array<{
    id: string;
    artistName: string;
    artistId: string | null;
    position: number;
    artist: { id: string; name: string; slug: string } | null;
  }>;
}

export type CatalogFeaturedMode = "popular" | "recent";

export interface CatalogFeaturedTracks {
  mode: CatalogFeaturedMode;
  tracks: CatalogTrackCard[];
}

export interface CatalogAlbumSummary {
  id: string;
  title: string;
  coverArt: string | null;
  year: number | null;
  trackCount: number;
}

export interface CatalogArtistDetail {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  bio: string | null;
  genres: string[];
  followerCount: number;
  isFollowed: boolean;
  isVerified: boolean;
  albums: CatalogAlbumSummary[];
  tracks: CatalogTrackCard[];
}

export interface CatalogAlbumDetail {
  id: string;
  title: string;
  coverArt: string | null;
  year: number | null;
  artist: { id: string; name: string; imageUrl: string | null };
  tracks: CatalogTrackCard[];
}

export interface CatalogRecentAlbum {
  id: string;
  title: string;
  coverArt: string | null;
  year: number | null;
  createdAt: string;
  artist: { id: string; name: string; imageUrl: string | null };
  trackCount: number;
  tracks: CatalogTrackCard[];
}

export interface CatalogArtistsPage {
  items: CatalogArtist[];
  total: number;
  nextOffset: number | null;
}

// ── Public reads ──────────────────────────────────────────────────────────────

export async function listCatalogArtists(): Promise<CatalogArtist[]> {
  const { data } = await api.get<CatalogArtist[]>("/admin/catalog/artists");
  return data;
}

/** Catalog listing available to every authenticated listener. */
export async function listPublicCatalogArtists(): Promise<CatalogArtist[]> {
  const { data } = await api.get<CatalogArtist[]>("/catalog/artists");
  return data;
}

export async function searchCatalogArtists(
  query: string,
  limit = 4,
): Promise<CatalogArtistsPage> {
  const { data } = await api.get<CatalogArtistsPage>("/catalog/artists/page", {
    params: { q: query, offset: 0, limit },
  });
  return data;
}

export async function listRecentCatalogAlbums(
  limit = 10,
): Promise<CatalogRecentAlbum[]> {
  const { data } = await api.get<CatalogRecentAlbum[]>(
    "/catalog/albums/recent",
    { params: { limit } },
  );
  return data;
}

export async function listTrendingCatalogTracks(
  limit = 5,
): Promise<CatalogTrackCard[]> {
  const { data } = await api.get<CatalogTrackCard[]>("/catalog/trending", {
    params: { limit },
  });
  return data;
}

export async function listFeaturedCatalogTracks(
  mode: CatalogFeaturedMode,
  limit = 8,
): Promise<CatalogFeaturedTracks> {
  const { data } = await api.get<CatalogFeaturedTracks>("/catalog/featured", {
    params: { mode, limit },
  });
  return data;
}

export async function getCatalogArtist(
  id: string,
): Promise<CatalogArtistDetail> {
  const { data } = await api.get<CatalogArtistDetail>(`/catalog/artists/${id}`);
  return data;
}

export async function followCatalogArtist(id: string): Promise<void> {
  await api.post(`/catalog/artists/${id}/follow`);
}

export async function unfollowCatalogArtist(id: string): Promise<void> {
  await api.delete(`/catalog/artists/${id}/follow`);
}

export async function getCatalogAlbum(id: string): Promise<CatalogAlbumDetail> {
  const { data } = await api.get<CatalogAlbumDetail>(`/catalog/albums/${id}`);
  return data;
}

/** Distinct genres present in the catalog — used as picker suggestions. */
export async function listCatalogGenres(): Promise<string[]> {
  const { data } = await api.get<string[]>("/catalog/genres");
  return data;
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function createArtist(payload: {
  name: string;
  bio?: string;
  genres?: string[];
}): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>(
    "/admin/catalog/artists",
    payload,
  );
  return data;
}

export async function updateArtist(
  id: string,
  payload: {
    name?: string;
    bio?: string;
    genres?: string[];
  },
) {
  const { data } = await api.patch(`/admin/catalog/artists/${id}`, payload);
  return data;
}

export async function deleteArtist(id: string): Promise<void> {
  await api.delete(`/admin/catalog/artists/${id}`);
}

/** Clears the artist-photo association without deleting the R2 object itself. */
export async function removeArtistImage(id: string): Promise<void> {
  await api.delete(`/admin/catalog/artists/${id}/image`);
}

export async function createAlbum(payload: {
  title: string;
  artistId: string;
  year?: number;
}) {
  const { data } = await api.post("/admin/catalog/albums", payload);
  return data;
}

export async function updateAlbum(
  id: string,
  payload: {
    title?: string;
    year?: number;
    artistId?: string;
  },
) {
  const { data } = await api.patch(`/admin/catalog/albums/${id}`, payload);
  return data;
}

export async function deleteAlbum(id: string): Promise<void> {
  await api.delete(`/admin/catalog/albums/${id}`);
}

/** Replace an album's tracklist + order from an ordered id array. */
export async function reorderAlbumTracks(
  albumId: string,
  trackIds: string[],
): Promise<CatalogAlbumDetail> {
  const { data } = await api.patch<CatalogAlbumDetail>(
    `/admin/catalog/albums/${albumId}/tracks`,
    { trackIds },
  );
  return data;
}

export async function assignTrack(
  trackId: string,
  payload: {
    artistId?: string | null;
    albumId?: string | null;
    albumOrder?: number | null;
    featuredArtists?: Array<{ artistName: string; artistId?: string | null }>;
  },
) {
  const { data } = await api.patch(`/admin/catalog/tracks/${trackId}`, payload);
  return data;
}

export async function deleteCatalogTrack(trackId: string): Promise<void> {
  await api.delete(`/admin/catalog/tracks/${trackId}`);
}

export async function updateCatalogTrack(
  trackId: string,
  payload: { title?: string; fileUrlRemote?: string },
) {
  const { data } = await api.patch(
    `/admin/catalog/tracks/${trackId}/details`,
    payload,
  );
  return data;
}

/** Replaces a catalog WAV/FLAC master and refreshes its technical metadata. */
export async function replaceCatalogTrackAudio(trackId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<CatalogTrackCard>(
    `/admin/catalog/tracks/${trackId}/audio`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

/**
 * Upload a brand-new catalog song (admin). Sends the audio as multipart and,
 * when an artist/album is given, links the new track to them.
 */
export async function uploadCatalogTrack(
  file: File,
  opts: { artistId?: string; albumId?: string; title?: string },
): Promise<CatalogTrackCard> {
  const form = new FormData();
  form.append("file", file);
  if (opts.artistId) form.append("artistId", opts.artistId);
  if (opts.albumId) form.append("albumId", opts.albumId);
  if (opts.title) form.append("title", opts.title);
  const { data } = await api.post<CatalogTrackCard>(
    "/admin/catalog/tracks/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

async function uploadImage(
  url: string,
  file: File,
): Promise<Record<string, string>> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** Upload an artist photo (also stamps it on the artist's tracks). */
export function uploadArtistImage(artistId: string, file: File) {
  return uploadImage(`/admin/catalog/artists/${artistId}/image`, file);
}

export async function uploadArtistImageFromUrl(
  artistId: string,
  imageUrl: string,
) {
  const { data } = await api.post(
    `/admin/catalog/artists/${artistId}/image-url`,
    { imageUrl },
  );
  return data;
}

/** Upload an album cover (propagates to the album's uncovered tracks). */
export function uploadAlbumCover(albumId: string, file: File) {
  return uploadImage(`/admin/catalog/albums/${albumId}/cover`, file);
}

/** Upload a per-song cover (portada). */
export function uploadTrackCover(trackId: string, file: File) {
  return uploadImage(`/admin/catalog/tracks/${trackId}/cover`, file);
}

/** Save lyrics for a track (LRC and/or plain text). */
export async function updateTrackLyrics(
  trackId: string,
  payload: { lyricsLrc?: string; lyricsText?: string; lyricsUrl?: string },
) {
  const { data } = await api.patch(
    `/admin/catalog/tracks/${trackId}/lyrics`,
    payload,
  );
  return data;
}

/** Removes the lyric record and its matching object in the lyrics R2 bucket. */
export async function deleteTrackLyrics(trackId: string): Promise<void> {
  await api.delete(`/admin/catalog/tracks/${trackId}/lyrics`);
}

/** Fetch a track's stored lyrics (for the admin editor). */
export async function getTrackLyrics(trackId: string): Promise<{
  lrc: string | null;
  text: string | null;
  lyricsUrl: string | null;
  hasLyrics: boolean;
}> {
  const { data } = await api.get(`/library/tracks/${trackId}/lyrics`);
  return data;
}

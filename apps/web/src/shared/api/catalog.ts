import { api } from "./client";

export interface CatalogArtist {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
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
  fileUrlRemote: string | null;
  trackNumber: number | null;
  albumId: string | null;
  albumOrder: number | null;
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

// ── Public reads ──────────────────────────────────────────────────────────────

export async function listCatalogArtists(): Promise<CatalogArtist[]> {
  const { data } = await api.get<CatalogArtist[]>("/catalog/artists");
  return data;
}

export async function getCatalogArtist(
  id: string,
): Promise<CatalogArtistDetail> {
  const { data } = await api.get<CatalogArtistDetail>(`/catalog/artists/${id}`);
  return data;
}

export async function getCatalogAlbum(id: string): Promise<CatalogAlbumDetail> {
  const { data } = await api.get<CatalogAlbumDetail>(`/catalog/albums/${id}`);
  return data;
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function createArtist(payload: {
  name: string;
  imageUrl?: string;
  bio?: string;
}) {
  const { data } = await api.post("/admin/catalog/artists", payload);
  return data;
}

export async function updateArtist(
  id: string,
  payload: { name?: string; imageUrl?: string; bio?: string },
) {
  const { data } = await api.patch(`/admin/catalog/artists/${id}`, payload);
  return data;
}

export async function deleteArtist(id: string): Promise<void> {
  await api.delete(`/admin/catalog/artists/${id}`);
}

export async function createAlbum(payload: {
  title: string;
  artistId: string;
  coverArt?: string;
  year?: number;
}) {
  const { data } = await api.post("/admin/catalog/albums", payload);
  return data;
}

export async function updateAlbum(
  id: string,
  payload: {
    title?: string;
    coverArt?: string;
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
    coverArt?: string;
  },
) {
  const { data } = await api.patch(`/admin/catalog/tracks/${trackId}`, payload);
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
  payload: { lyricsLrc?: string; lyricsText?: string },
) {
  const { data } = await api.patch(
    `/admin/catalog/tracks/${trackId}/lyrics`,
    payload,
  );
  return data;
}

/** Fetch a track's stored lyrics (for the admin editor). */
export async function getTrackLyrics(
  trackId: string,
): Promise<{ lyricsLrc: string | null; lyricsText: string | null }> {
  const { data } = await api.get(`/library/tracks/${trackId}/lyrics`);
  return data;
}

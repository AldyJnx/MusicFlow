import { api } from "./client";

export type ArtistPortalArtist = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  bio?: string | null;
  genres: string[];
  isVerified?: boolean;
  _count?: { albums: number; tracks: number };
};

export type ArtistMembership = {
  id: string;
  role: "OWNER" | "MANAGER" | "EDITOR" | "ANALYST";
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  artist: ArtistPortalArtist;
};

export type ArtistAccessRequest = {
  id: string;
  evidence?: string | null;
  evidenceLinks: string[];
  documentName?: string | null;
  documentUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewNote?: string | null;
  artist: ArtistPortalArtist;
};

export type ArtistPortalContext = {
  memberships: ArtistMembership[];
  requests: ArtistAccessRequest[];
};

export type ArtistPortalTrack = {
  id: string;
  title: string;
  fileUrlRemote?: string | null;
  coverArt?: string | null;
  durationMs?: number;
  playsLast30Days: number;
  albumId?: string | null;
  album?: string | null;
  lyricsUrl?: string | null;
  lyricsLrc?: string | null;
};
export type ArtistPortalAlbum = {
  id: string;
  title: string;
  year?: number | null;
  coverArt?: string | null;
  createdAt?: string;
  _count?: { tracks: number };
};
export type ArtistPortalAlbums = {
  items: ArtistPortalAlbum[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
export type ArtistPortalLyrics = {
  trackId: string;
  lrc: string | null;
  text: string | null;
  lyricsUrl: string | null;
  hasLyrics: boolean;
};
export type ArtistPortalMusic = {
  items: ArtistPortalTrack[];
  albums: ArtistPortalAlbum[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
export type ArtistPortalAnalytics = {
  days: number;
  totalPlays: number;
  uniqueListeners: number;
  totalListeningMs: number;
  totalProfileViews: number;
  series: Array<{
    date: string;
    plays: number;
    listeningMs: number;
    listeners: number;
    profileViews: number;
  }>;
};
export type ArtistPortalNotification = {
  id: string;
  kind: "NEW_LISTENERS" | "ALBUM_GROWTH" | "VERIFICATION_RESULT";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};
export type ArtistPortalNotifications = {
  items: ArtistPortalNotification[];
  unreadCount: number;
};
export type ArtistPortalTeamMember = {
  id: string;
  role: ArtistMembership["role"];
  user: { id: string; username: string; email: string; avatar?: string | null };
};
export type ArtistPortalDashboard = {
  artist: ArtistPortalArtist & {
    _count: { albums: number; tracks: number; followers: number };
  };
  period: { from: string; to: string };
  totals: {
    plays: number;
    listeners: number;
    frequentListeners: number;
    loyalListeners: number;
    newListeners: number;
    profileViews: number;
    newFollowers: number;
    followers: number;
  };
  comparison: {
    plays: number;
    listeners: number;
    profileViews: number;
    followers: number;
  };
  series: Array<{
    date: string;
    plays: number;
    listeners: number;
    profileViews: number;
  }>;
  topTracks: Array<{
    id: string;
    title: string;
    coverArt?: string | null;
    plays: number;
    previousPlays: number;
    delta: number;
    trend: "UP" | "DOWN" | "STABLE";
  }>;
};

export async function getArtistPortalContext() {
  const { data } = await api.get<ArtistPortalContext>("/artist-portal/me");
  return data;
}

export async function getAvailableArtists(query = "") {
  const { data } = await api.get<ArtistPortalArtist[]>(
    "/artist-portal/available-artists",
    {
      params: { q: query || undefined },
    },
  );
  return data;
}

export async function requestArtistAccess(payload: {
  artistId: string;
  evidence?: string;
  evidenceLinks: string[];
  document?: File;
}) {
  const form = new FormData();
  form.append("artistId", payload.artistId);
  if (payload.evidence?.trim())
    form.append("evidence", payload.evidence.trim());
  form.append("evidenceLinks", JSON.stringify(payload.evidenceLinks));
  if (payload.document) form.append("document", payload.document);
  const { data } = await api.post<ArtistAccessRequest>(
    "/artist-portal/access-requests",
    form,
  );
  return data;
}

export async function requestArtistVerification(artistId: string) {
  const { data } = await api.post(
    `/artist-portal/artists/${artistId}/verification-requests`,
  );
  return data;
}

export async function getArtistDashboard(artistId: string) {
  const { data } = await api.get<ArtistPortalDashboard>(
    `/artist-portal/artists/${artistId}/dashboard`,
  );
  return data;
}

export async function getArtistMusic(
  artistId: string,
  params: { page: number; pageSize: number; sort: string; q: string },
) {
  const { data } = await api.get<
    | ArtistPortalMusic
    | {
        tracks?: ArtistPortalTrack[];
        albums?: Array<{ tracks: ArtistPortalTrack[] }>;
      }
  >(`/artist-portal/artists/${artistId}/music`, { params });
  if ("items" in data && Array.isArray(data.items)) return data;

  // A running backend may still expose the pre-pagination contract until it
  // is rebuilt. Normalize that response so navigation never crashes while
  // the server is being restarted; the rebuilt API remains authoritative for
  // pagination, sorting and trend counts.
  const legacyData = data as {
    tracks?: ArtistPortalTrack[];
    albums?: Array<{ tracks: ArtistPortalTrack[] }>;
  };
  const legacyTracks = [
    ...(legacyData.tracks ?? []),
    ...(legacyData.albums?.flatMap((album) => album.tracks) ?? []),
  ];
  const start = Math.max(0, (params.page - 1) * params.pageSize);
  return {
    items: legacyTracks.slice(start, start + params.pageSize),
    albums: [],
    total: legacyTracks.length,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(legacyTracks.length / params.pageSize)),
  } satisfies ArtistPortalMusic;
}

export async function createArtistPortalMusic(
  artistId: string,
  payload: {
    title?: string;
    file: File;
    albumId?: string;
    lyricsUrl?: string;
    lyricsLrc?: string;
  },
) {
  const form = new FormData();
  form.append("file", payload.file);
  if (payload.title?.trim()) form.append("title", payload.title.trim());
  if (payload.albumId) form.append("albumId", payload.albumId);
  if (payload.lyricsUrl?.trim())
    form.append("lyricsUrl", payload.lyricsUrl.trim());
  if (payload.lyricsLrc?.trim())
    form.append("lyricsLrc", payload.lyricsLrc.trim());
  const { data } = await api.post(
    `/artist-portal/artists/${artistId}/music`,
    form,
  );
  return data;
}

export async function updateArtistPortalMusic(
  artistId: string,
  trackId: string,
  payload: {
    title?: string;
    fileUrlRemote?: string;
    albumId?: string | null;
    lyricsUrl?: string;
    lyricsLrc?: string;
  },
) {
  const { data } = await api.patch(
    `/artist-portal/artists/${artistId}/music/${trackId}`,
    payload,
  );
  return data;
}

export async function deactivateArtistPortalMusic(
  artistId: string,
  trackId: string,
) {
  const { data } = await api.patch(
    `/artist-portal/artists/${artistId}/music/${trackId}/deactivate`,
  );
  return data;
}

export async function deleteArtistPortalMusic(
  artistId: string,
  trackId: string,
) {
  const { data } = await api.delete(
    `/artist-portal/artists/${artistId}/music/${trackId}`,
  );
  return data;
}

export async function downloadArtistPortalMusicExcel(
  artistId: string,
  params: { sort: string; q: string },
) {
  const fallback = await getArtistMusic(artistId, {
    page: 1,
    pageSize: 10_000,
    sort: params.sort,
    q: params.q,
  });
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Canción", "Reproducciones (30 días)"],
    ...fallback.items.map((track) => [track.title, track.playsLast30Days]),
  ]);
  worksheet["!cols"] = [{ wch: 42 }, { wch: 28 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Música");
  const data = new Blob(
    [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  );
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "musicflow-musica.xlsx";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function createArtistPortalAlbum(
  artistId: string,
  payload: { title: string; year?: number; cover: File },
) {
  const form = new FormData();
  form.append("title", payload.title.trim());
  if (payload.year) form.append("year", String(payload.year));
  form.append("cover", payload.cover);
  const { data } = await api.post(
    `/artist-portal/artists/${artistId}/albums`,
    form,
  );
  return data as {
    id: string;
    title: string;
    year: number | null;
    coverArt: string;
  };
}

export async function getArtistPortalAlbums(
  artistId: string,
  params: { page: number; pageSize: number; sort: string; q: string },
) {
  const { data } = await api.get<ArtistPortalAlbums | ArtistPortalAlbum[]>(
    `/artist-portal/artists/${artistId}/albums`,
    { params },
  );
  if (Array.isArray(data)) {
    const start = Math.max(0, (params.page - 1) * params.pageSize);
    return {
      items: data.slice(start, start + params.pageSize),
      total: data.length,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.max(1, Math.ceil(data.length / params.pageSize)),
    } satisfies ArtistPortalAlbums;
  }
  return data;
}

export async function getArtistPortalLyrics(artistId: string, trackId: string) {
  const { data } = await api.get<ArtistPortalLyrics>(
    `/artist-portal/artists/${artistId}/music/${trackId}/lyrics`,
  );
  return data;
}

export async function updateArtistPortalAlbum(
  artistId: string,
  albumId: string,
  payload: { title?: string; year?: number },
) {
  const { data } = await api.patch(
    `/artist-portal/artists/${artistId}/albums/${albumId}`,
    payload,
  );
  return data;
}

export async function updateArtistPortalAlbumCover(
  artistId: string,
  albumId: string,
  cover: File,
) {
  const form = new FormData();
  form.append("cover", cover);
  const { data } = await api.post(
    `/artist-portal/artists/${artistId}/albums/${albumId}/cover`,
    form,
  );
  return data;
}

export async function deleteArtistPortalAlbum(
  artistId: string,
  albumId: string,
) {
  const { data } = await api.delete(
    `/artist-portal/artists/${artistId}/albums/${albumId}`,
  );
  return data;
}

export async function getArtistAnalytics(artistId: string) {
  const { data } = await api.get<ArtistPortalAnalytics>(
    `/artist-portal/artists/${artistId}/analytics`,
  );
  return data;
}

export async function getArtistPortalNotifications(artistId: string) {
  const { data } = await api.get<ArtistPortalNotifications>(
    `/artist-portal/artists/${artistId}/notifications`,
  );
  return data;
}

export async function markArtistPortalNotificationsRead(
  artistId: string,
  notificationIds?: string[],
) {
  const { data } = await api.post<{ readCount: number }>(
    `/artist-portal/artists/${artistId}/notifications/read`,
    notificationIds ? { notificationIds } : {},
  );
  return data;
}

export async function getArtistTeam(artistId: string) {
  const { data } = await api.get<ArtistPortalTeamMember[]>(
    `/artist-portal/artists/${artistId}/team`,
  );
  return data;
}

export async function updateArtistPortalProfile(
  artistId: string,
  payload: { name?: string; bio?: string; imageUrl?: string },
) {
  const { data } = await api.patch(
    `/artist-portal/artists/${artistId}/profile`,
    payload,
  );
  return data;
}

export async function updateArtistPortalProfileImage(
  artistId: string,
  image: File,
) {
  const form = new FormData();
  form.append("image", image);
  const { data } = await api.patch(
    `/artist-portal/artists/${artistId}/profile-image`,
    form,
  );
  return data as { imageUrl: string };
}

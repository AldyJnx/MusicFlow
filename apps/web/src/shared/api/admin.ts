import { api } from "./client";
import type { UserRole } from "../stores/authStore";

export type { UserRole };

export type AdminArtistAccessRequest = {
  id: string;
  evidence?: string | null;
  evidenceLinks: string[];
  documentName?: string | null;
  documentUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  artist: { id: string; name: string; imageUrl?: string | null };
  user: { id: string; username: string; email: string };
  reviewNote?: string | null;
};

export type AdminArtistVerificationRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  reviewNote?: string | null;
  artist: {
    id: string;
    name: string;
    imageUrl?: string | null;
    isVerified: boolean;
  };
  requester: { id: string; username: string; email: string };
};

export type ArtistAccessRequestSort =
  | "RECENT"
  | "OLDEST"
  | "USERNAME_ASC"
  | "USERNAME_DESC";

export type AdminArtistAccessRequestsPage = {
  items: AdminArtistAccessRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listArtistAccessRequests(params?: {
  page?: number;
  pageSize?: number;
  sort?: ArtistAccessRequestSort;
  q?: string;
}) {
  const { data } = await api.get<AdminArtistAccessRequestsPage>(
    "/admin/artist-access-requests",
    { params },
  );
  return data;
}

export async function reviewArtistAccessRequest(
  id: string,
  status: "APPROVED" | "REJECTED",
  note?: string,
) {
  const { data } = await api.patch<AdminArtistAccessRequest>(
    `/admin/artist-access-requests/${id}`,
    { status, note },
  );
  return data;
}

export async function listArtistVerificationRequests(params?: {
  page?: number;
  pageSize?: number;
  sort?: ArtistAccessRequestSort;
  q?: string;
}) {
  const { data } = await api.get<{
    items: AdminArtistVerificationRequest[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>("/admin/artist-verification-requests", { params });
  return data;
}

export async function reviewArtistVerificationRequest(
  id: string,
  status: "APPROVED" | "REJECTED",
  note?: string,
) {
  const { data } = await api.patch<AdminArtistVerificationRequest>(
    `/admin/artist-verification-requests/${id}`,
    { status, note },
  );
  return data;
}

export async function linkArtistMembership(
  userId: string,
  artistId: string,
  role: "OWNER" | "MANAGER" | "EDITOR" | "ANALYST",
) {
  const { data } = await api.post(`/admin/artist-access-requests/link`, {
    userId,
    artistId,
    role,
  });
  return data;
}

export type AppliedTo = "GLOBAL" | "PLAYLIST" | "TRACK" | "SEGMENT";
export type FeedbackValue = "GOOD" | "BAD" | "NEUTRAL";

export interface DashboardStats {
  users: { total: number; premium: number; recentWeek: number };
  content: { tracks: number; playlists: number };
  ai: { totalRequests: number };
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isPremium: boolean;
  isActive: boolean;
  createdAt: string;
  _count: { tracks: number; playlists: number };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  skip: number;
  take: number;
}

export interface UserGrowthPoint {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
}

export interface UserGrowth {
  days: number;
  total: number;
  series: UserGrowthPoint[];
}

export interface CatalogBucket {
  label: string;
  count: number;
}

export interface CatalogDistribution {
  totalTracks: number;
  totalBytes: number;
  totalDurationMs: number;
  byGenre: CatalogBucket[];
  byCodec: CatalogBucket[];
}

export interface ActiveUsersStats {
  /** Active in the last 24h. */
  dau: number;
  /** Active in the last 7 days. */
  wau: number;
  /** Active in the last 30 days. */
  mau: number;
  /** Total registered users — denominator for ratios. */
  total: number;
}

export interface ActiveUsersTrendPoint {
  date: string; // YYYY-MM-DD UTC
  count: number;
}

export interface ActiveUsersTrend {
  days: number;
  series: ActiveUsersTrendPoint[];
}

export interface TopActiveUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  isPremium: boolean;
  role: UserRole;
  lastLogin: string;
  createdAt: string;
  _count: { tracks: number; playlists: number };
}

export type DeviceType =
  | "DESKTOP_WIN"
  | "DESKTOP_MAC"
  | "DESKTOP_LINUX"
  | "WEB"
  | "MOBILE_ANDROID"
  | "MOBILE_IOS";

export type PlayDevice = "DESKTOP" | "WEB" | "MOBILE" | "AUTO";

export interface AdminUserDevice {
  id: string;
  deviceType: DeviceType;
  deviceName: string;
  lastSyncAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserPreferences {
  theme: string;
  playerLayout: string;
  libraryLayout: string;
  crossfadeEnabled: boolean;
  crossfadeDurationMs: number;
  gaplessEnabled: boolean;
  scrobbleEnabled: boolean;
  scrobbleThreshold: number;
  updatedAt: string;
}

export interface AdminUserDetail {
  user: AdminUser & {
    avatar: string | null;
    updatedAt: string;
    devices: AdminUserDevice[];
    preferences: AdminUserPreferences | null;
    _count: {
      tracks: number;
      playlists: number;
      eqPresets: number;
      eqConfigs: number;
      eqSegments: number;
      aiRequests: number;
      playHistory: number;
      devices: number;
    };
  };
  recentPlays: {
    id: string;
    playedAt: string;
    durationListenedMs: number;
    completed: boolean;
    skipped: boolean;
    device: PlayDevice;
    track: { id: string; title: string; artist: string } | null;
  }[];
  recentAiRequests: {
    id: string;
    prompt: string;
    modelUsed: string;
    tokensInput: number;
    tokensOutput: number;
    costUsd: string | number;
    feedback: FeedbackValue | null;
    wasAccepted: boolean;
    responseTimeMs: number;
    createdAt: string;
  }[];
  aiSpend: {
    tokensInput: number;
    tokensOutput: number;
    costUsd: string;
  };
}

export type ReverbPreset =
  | "NONE"
  | "SMALL_ROOM"
  | "MEDIUM_ROOM"
  | "LARGE_ROOM"
  | "SMALL_HALL"
  | "LARGE_HALL"
  | "CATHEDRAL"
  | "PLATE"
  | "SPRING";

export const REVERB_PRESETS: ReverbPreset[] = [
  "NONE",
  "SMALL_ROOM",
  "MEDIUM_ROOM",
  "LARGE_ROOM",
  "SMALL_HALL",
  "LARGE_HALL",
  "CATHEDRAL",
  "PLATE",
  "SPRING",
];

export interface GlobalEqPreset {
  id: string;
  userId: string | null;
  name: string;
  isGlobal: boolean;
  bands: number[];
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPreset;
  reverbAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalEqPresetPayload {
  name: string;
  bands: number[];
  bassBoost?: number;
  virtualizer?: number;
  loudness?: number;
  reverbPreset?: ReverbPreset;
  reverbAmount?: number;
}

export interface CatalogGenre {
  id: string;
  name: string;
  normalizedName: string;
  artistCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function listAdminCatalogGenres(): Promise<CatalogGenre[]> {
  const { data } = await api.get<CatalogGenre[]>("/admin/genres");
  return data;
}

export async function createCatalogGenre(name: string): Promise<CatalogGenre> {
  const { data } = await api.post<CatalogGenre>("/admin/genres", { name });
  return data;
}

export async function updateCatalogGenre(
  id: string,
  name: string,
): Promise<CatalogGenre> {
  const { data } = await api.patch<CatalogGenre>(`/admin/genres/${id}`, {
    name,
  });
  return data;
}

export async function deleteCatalogGenre(id: string): Promise<void> {
  await api.delete(`/admin/genres/${id}`);
}

/**
 * Consumer whose AI usage is being reported. End users and admins have a very
 * different consumption, so the report can be split or merged.
 */
export type AiUsageScope = "all" | "user" | "admin";

/** Origin of a model inside the report. */
export type AiUsageOrigin = "USERS" | "ADMINS";

export interface AiUsageSummary {
  requests: number;
  costUsd: number;
  tokensInput: number;
  tokensOutput: number;
  avgLatencyMs: number;
}

export interface AICostsReport {
  days: number;
  scope: AiUsageScope;
  totals: AiUsageSummary & { avgCostUsd: number };
  /** Same totals split by consumer, so the three views can be compared. */
  sources: Record<AiUsageScope, AiUsageSummary>;
  daily: { date: string; cost: number; requests: number }[];
  activity: Record<
    "day" | "month" | "year",
    {
      date: string;
      requests: number;
      tokensInput: number;
      tokensOutput: number;
      fulfilled: number;
      unfulfilled: number;
    }[]
  >;
  byModel: {
    model: string;
    origin: AiUsageOrigin;
    requests: number;
    costUsd: number;
    tokensInput: number;
    tokensOutput: number;
  }[];
  byUser: {
    userId: string;
    username: string;
    email: string;
    requests: number;
    costUsd: number;
  }[];
  byPurpose: {
    purpose: AppliedTo | "GLOBAL";
    users: number;
    requests: number;
  }[];
}

export interface AdminAIRequest {
  id: string;
  userId: string;
  trackId: string | null;
  prompt: string;
  context: unknown;
  response: unknown;
  explanation: string | null;
  appliedTo: AppliedTo | null;
  appliedId: string | null;
  wasAccepted: boolean;
  tokensInput: number;
  tokensOutput: number;
  costUsd: string | number;
  responseTimeMs: number;
  modelUsed: string;
  createdAt: string;
  user: { email: string; username: string };
  track: { title: string; artist: string } | null;
}

export interface MusicInsights {
  mostPlayed: Array<{
    id: string;
    title: string;
    artist: string;
    coverArt: string | null;
    plays: number;
  }>;
  leastPlayed: Array<{
    id: string;
    title: string;
    artist: string;
    coverArt: string | null;
    plays: number;
  }>;
  mostListenedArtists: Array<{
    name: string;
    imageUrl: string | null;
    plays: number;
  }>;
  mostFollowedArtists: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    followers: number;
  }>;
  mostListenedGenres: Array<{ name: string; plays: number }>;
}

export interface AIFeedbackStats {
  total: number;
  good: number;
  bad: number;
  neutral: number;
  satisfactionRate: number;
}

export interface AdminAIRequestsResponse {
  requests: AdminAIRequest[];
  total: number;
  skip: number;
  take: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/admin/dashboard");
  return data;
}

export async function listUsers(params?: {
  skip?: number;
  take?: number;
  search?: string;
}): Promise<AdminUsersResponse> {
  const { data } = await api.get<AdminUsersResponse>("/admin/users", {
    params,
  });
  return data;
}

export async function listGlobalPresets(): Promise<GlobalEqPreset[]> {
  const { data } = await api.get<GlobalEqPreset[]>("/admin/eq-presets");
  return data;
}

export async function createGlobalPreset(
  payload: GlobalEqPresetPayload,
): Promise<GlobalEqPreset> {
  const { data } = await api.post<GlobalEqPreset>("/admin/eq-presets", payload);
  return data;
}

export async function updateGlobalPreset(
  id: string,
  payload: Partial<GlobalEqPresetPayload>,
): Promise<GlobalEqPreset> {
  const { data } = await api.patch<GlobalEqPreset>(
    `/admin/eq-presets/${id}`,
    payload,
  );
  return data;
}

export async function deleteGlobalPreset(id: string): Promise<void> {
  await api.delete(`/admin/eq-presets/${id}`);
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  const { data } = await api.get<AdminUserDetail>(
    `/admin/users/${userId}/detail`,
  );
  return data;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function updateUserPremium(userId: string, isPremium: boolean) {
  const { data } = await api.patch(`/admin/users/${userId}/premium`, {
    isPremium,
  });
  return data;
}

export async function deactivateUser(userId: string) {
  const { data } = await api.post(`/admin/users/${userId}/deactivate`);
  return data;
}

export async function getUserGrowth(days = 30): Promise<UserGrowth> {
  const { data } = await api.get<UserGrowth>("/admin/dashboard/growth", {
    params: { days },
  });
  return data;
}

export async function getCatalogDistribution(): Promise<CatalogDistribution> {
  const { data } = await api.get<CatalogDistribution>(
    "/admin/dashboard/catalog",
  );
  return data;
}

export async function getActiveUsers(): Promise<ActiveUsersStats> {
  const { data } = await api.get<ActiveUsersStats>(
    "/admin/dashboard/active-users",
  );
  return data;
}

export async function getTopActiveUsers(limit = 5): Promise<TopActiveUser[]> {
  const { data } = await api.get<TopActiveUser[]>(
    "/admin/dashboard/top-users",
    { params: { limit } },
  );
  return data;
}

export async function getActiveUsersTrend(
  days = 30,
): Promise<ActiveUsersTrend> {
  const { data } = await api.get<ActiveUsersTrend>(
    "/admin/dashboard/active-users-trend",
    { params: { days } },
  );
  return data;
}

export async function getAiCosts(
  days = 30,
  scope: AiUsageScope = "all",
): Promise<AICostsReport> {
  const { data } = await api.get<AICostsReport>("/admin/ai/costs", {
    params: { days, scope },
  });
  return data;
}

export async function listAiRequests(params: {
  skip?: number;
  take?: number;
  search?: string;
}): Promise<AdminAIRequestsResponse> {
  const { data } = await api.get<AdminAIRequestsResponse>(
    "/admin/ai/requests",
    {
      params,
    },
  );
  return data;
}

/** Fetches every matching request in bounded parallel pages for an Excel export. */
export async function listAllAiRequests(
  search?: string,
): Promise<AdminAIRequest[]> {
  const first = await listAiRequests({ skip: 0, take: 50, search });
  const pages = Math.ceil(first.total / first.take);
  if (pages <= 1) return first.requests;

  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      listAiRequests({
        skip: (index + 1) * first.take,
        take: first.take,
        search,
      }),
    ),
  );
  return [...first.requests, ...remaining.flatMap((page) => page.requests)];
}

export async function deleteUser(userId: string) {
  await api.delete(`/admin/users/${userId}`);
}

export async function getMusicInsights(): Promise<MusicInsights> {
  const { data } = await api.get<MusicInsights>(
    "/admin/dashboard/music-insights",
  );
  return data;
}

export async function getAiFeedbackStats(): Promise<AIFeedbackStats> {
  const { data } = await api.get<AIFeedbackStats>("/admin/ai/feedback");
  return data;
}

export type CatalogSyncResult = {
  completed: boolean;
  output: string;
  summary: {
    tracks: {
      created: number;
      skipped: number;
      refreshed: number;
      removedFromCatalog: number;
    } | null;
    albums: { created: number; updated: number } | null;
    lyrics: {
      synchronized: number;
      unchanged: number;
      unmatched: number;
    } | null;
    integrity: {
      artistImagesMissing: number;
      albumsIncomplete: number;
      trackCoverMismatches: number;
      trackCoversRepaired: number;
      duplicateArtists: number;
      featuredCreditsLinked: number;
    } | null;
  };
};

export async function syncCatalogFromR2(): Promise<CatalogSyncResult> {
  const { data } = await api.post<CatalogSyncResult>("/admin/catalog/sync-r2");
  return data;
}

export interface CatalogAiAssistantReply {
  answer: string;
  model: string;
}

/** Admin-only, read-only NVIDIA catalog assistant. */
export async function askCatalogAiAssistant(
  question: string,
): Promise<CatalogAiAssistantReply> {
  const { data } = await api.post<CatalogAiAssistantReply>(
    "/admin/catalog-ai/assistant",
    { question },
  );
  return data;
}

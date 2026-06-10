import { api } from "./client";
import type { UserRole } from "../stores/authStore";

export type { UserRole };

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

export interface AICostsReport {
  days: number;
  totals: {
    requests: number;
    costUsd: number;
    tokensInput: number;
    tokensOutput: number;
    avgCostUsd: number;
    avgLatencyMs: number;
  };
  daily: { date: string; cost: number; requests: number }[];
  byModel: {
    model: string;
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
}

export interface AIFeedbackStats {
  total: number;
  good: number;
  bad: number;
  neutral: number;
  satisfactionRate: number;
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
  feedback: FeedbackValue | null;
  feedbackComment: string | null;
  tokensInput: number;
  tokensOutput: number;
  costUsd: string | number;
  responseTimeMs: number;
  modelUsed: string;
  createdAt: string;
  user: { email: string; username: string };
  track: { title: string; artist: string } | null;
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

export async function getAiCosts(days = 30): Promise<AICostsReport> {
  const { data } = await api.get<AICostsReport>("/admin/ai/costs", {
    params: { days },
  });
  return data;
}

export async function getAiFeedbackStats(): Promise<AIFeedbackStats> {
  const { data } = await api.get<AIFeedbackStats>("/admin/ai/feedback");
  return data;
}

export async function getRecentAiRequests(
  limit = 20,
): Promise<AdminAIRequest[]> {
  const { data } = await api.get<AdminAIRequest[]>("/admin/ai/requests", {
    params: { limit },
  });
  return data;
}

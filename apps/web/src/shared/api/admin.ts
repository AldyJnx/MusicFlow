import { api } from "./client";
import type { UserRole } from "../stores/authStore";

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

import { api } from "./client";
import type { AuthUser } from "../stores/authStore";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export type UserNotification = {
  id: string;
  title: string;
  artistName: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type UserNotificationsPage = {
  items: UserNotification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function exchangeGoogleTicket(
  ticket: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/google/exchange", {
    ticket,
  });
  return data;
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function me(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

export async function updateMyProfile(payload: {
  username: string;
  bio?: string;
}): Promise<AuthUser> {
  const { data } = await api.patch<AuthUser>("/users/me", payload);
  return data;
}

export async function uploadMyAvatar(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<AuthUser>("/users/me/avatar", form);
  return data;
}

export async function getMyNotifications(params: {
  page: number;
  pageSize: number;
  sort: "RECENT" | "OLDEST" | "TITLE_ASC" | "TITLE_DESC";
  q: string;
}): Promise<UserNotificationsPage> {
  const { data } = await api.get<UserNotificationsPage>(
    "/users/me/notifications",
    { params },
  );
  return data;
}

export async function markMyNotificationsRead(notificationIds?: string[]) {
  const { data } = await api.post<{ readCount: number }>(
    "/users/me/notifications/read",
    notificationIds ? { notificationIds } : {},
  );
  return data;
}

export async function forgotPassword(
  email: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    "/auth/forgot-password",
    { email },
  );
  return data;
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/reset-password", {
    token,
    password,
  });
  return data;
}

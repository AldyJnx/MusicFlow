import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";
import { useUpsellStore, type UpsellReason } from "../stores/upsellStore";

const UPSELL_CODES: ReadonlySet<UpsellReason> = new Set<UpsellReason>([
  "PREMIUM_REQUIRED",
  "QUOTA_UPLOADS_EXCEEDED",
  "QUOTA_AI_EXCEEDED",
  "QUOTA_PRESETS_EXCEEDED",
]);

interface UpsellErrorBody {
  code?: string;
  message?: string;
  quota?: {
    used: number;
    limit: number | null;
    remaining: number | null;
    resetAt?: string;
  };
}

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) {
    clear();
    return null;
  }

  try {
    const res = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
    );
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 403) {
      const body = error.response.data as UpsellErrorBody | undefined;
      if (body?.code && UPSELL_CODES.has(body.code as UpsellReason)) {
        useUpsellStore.getState().show({
          reason: body.code as UpsellReason,
          message: body.message,
          quota: body.quota,
        });
      }
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise = refreshPromise ?? refreshAccessToken();
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (!newToken) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);

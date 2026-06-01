import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";

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

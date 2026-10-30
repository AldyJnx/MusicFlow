import { useEffect, useState } from "react";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { getElectronAPI, isElectron } from "../../platform/electronAPI";

export type UserRole = "ADMIN" | "ARTIST" | "CLIENT";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  bio?: string | null;
  role: UserRole;
  isPremium: boolean;
  avatar?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

const browserAuthStorage: StateStorage = {
  getItem: (name) => sessionStorage.getItem(name),
  setItem: (name, value) => sessionStorage.setItem(name, value),
  removeItem: (name) => sessionStorage.removeItem(name),
};

const electronAuthStorage: StateStorage = {
  getItem: async () => getElectronAPI()?.authSession.load() ?? null,
  setItem: async (_name, value) => {
    await getElectronAPI()?.authSession.save(value);
  },
  removeItem: async () => {
    await getElectronAPI()?.authSession.clear();
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      clear: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "musicflow-auth",
      // Browsers remain isolated per tab through sessionStorage. Electron has
      // no tabs and needs a durable encrypted store so closing the desktop app
      // does not discard a valid authenticated session.
      storage: createJSONStorage(() =>
        isElectron() ? electronAuthStorage : browserAuthStorage,
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      queueMicrotask(() => setHydrated(true));
    }
    return unsubscribe;
  }, []);

  return hydrated;
}

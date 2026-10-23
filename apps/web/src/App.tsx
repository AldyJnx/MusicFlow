import { lazy, Suspense, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import ChangePassword from "./auth/pages/ChangePassword";
import ForgotPassword from "./auth/pages/ForgotPassword";
import Login from "./auth/pages/Login";
import HeadphonesTip from "./auth/pages/HeadphonesTip";
import Register from "./auth/pages/Register";
import VerifyCode from "./auth/pages/VerifyCode";
import AccountDeletion from "./auth/pages/AccountDeletion";
import GoogleOAuthCallback from "./auth/pages/GoogleOAuthCallback";
import RouteFallback from "./shared/ui/RouteFallback";
import PWAInstallBanner from "./shared/ui/PWAInstallBanner";
import UpsellModal from "./shared/ui/UpsellModal";
import ActionNoticeViewport from "./shared/ui/ActionNotice";
import DesktopWindowControls from "./shared/ui/DesktopWindowControls";
import { useAuthHydrated, useAuthStore } from "./shared/stores/authStore";
import { usePlayerStore } from "./client/stores/playStore";
import { initNetworkListeners } from "./shared/stores/networkStore";
import { useDownloadsStore } from "./shared/stores/downloadsStore";
import { useLocalLibraryStore } from "./shared/offline/localLibrary";
import { setPreferencesOwner } from "./shared/stores/preferencesStore";
import { isElectron } from "./platform/electronAPI";

// Split the two app shells: a client user never downloads the admin bundle and
// vice-versa. Auth pages stay eager — they're the entry point.
const UsuariosRoutes = lazy(() => import("./usuarios/routes/UsuariosRoutes"));
const AdminRoutes = lazy(() => import("./admin/routes/adminRoutes"));
const ArtistaRoutes = lazy(() => import("./artista/routes/ArtistaRoutes"));

function App() {
  const queryClient = useQueryClient();
  const authHydrated = useAuthHydrated();
  // A packaged Electron renderer starts from file://.../index.html. Hash
  // routing keeps client navigation inside that single file while the web app
  // retains normal browser URLs.
  const AppRouter = isElectron() ? HashRouter : BrowserRouter;

  // Boot offline support: wire connectivity events and hydrate the list of
  // downloaded tracks from IndexedDB.
  useEffect(() => {
    const cleanup = initNetworkListeners();
    void useDownloadsStore.getState().init();
    void useLocalLibraryStore.getState().init();
    return cleanup;
  }, []);

  // Safety net for losing the session — covers manual logout AND token-expiry
  // logout (the axios interceptor clears auth on a failed refresh). On any
  // de-auth we:
  //   1. Stop and reset playback so audio never outlives the session.
  //   2. Wipe the entire query cache so the next user never sees the previous
  //      user's private data (playlists, history, stats — or admin data like
  //      the full user list / AI costs).
  useEffect(() => {
    let wasAuthed = useAuthStore.getState().isAuthenticated;
    setPreferencesOwner(useAuthStore.getState().user?.id);
    return useAuthStore.subscribe((state) => {
      setPreferencesOwner(state.user?.id);
      if (wasAuthed && !state.isAuthenticated) {
        usePlayerStore.getState().stop();
        queryClient.clear();
      }
      wasAuthed = state.isAuthenticated;
    });
  }, [queryClient]);

  if (!authHydrated) {
    return <RouteFallback />;
  }

  return (
    <AppRouter>
      <DesktopWindowControls />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/headphones-tip" element={<HeadphonesTip />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/account-deletion" element={<AccountDeletion />} />
          <Route
            path="/auth/google/callback"
            element={<GoogleOAuthCallback />}
          />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/artist-dashboard/*" element={<ArtistaRoutes />} />
          <Route path="/*" element={<UsuariosRoutes />} />
        </Routes>
      </Suspense>
      <PWAInstallBanner />
      <UpsellModal />
      <ActionNoticeViewport />
    </AppRouter>
  );
}

export default App;

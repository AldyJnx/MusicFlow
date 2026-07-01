import { lazy, Suspense, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChangePassword from "./auth/pages/ChangePassword";
import ForgotPassword from "./auth/pages/ForgotPassword";
import Login from "./auth/pages/Login";
import Register from "./auth/pages/Register";
import VerifyCode from "./auth/pages/VerifyCode";
import RouteFallback from "./shared/ui/RouteFallback";
import PWAInstallBanner from "./shared/ui/PWAInstallBanner";
import UpsellModal from "./shared/ui/UpsellModal";
import { useAuthStore } from "./shared/stores/authStore";
import { usePlayerStore } from "./client/stores/playStore";
import { initNetworkListeners } from "./shared/stores/networkStore";
import { useDownloadsStore } from "./shared/stores/downloadsStore";
import { useLocalLibraryStore } from "./shared/offline/localLibrary";

// Split the two app shells: a client user never downloads the admin bundle and
// vice-versa. Auth pages stay eager — they're the entry point.
const ClientRoutes = lazy(() => import("./client/routes/clientRoutes"));
const AdminRoutes = lazy(() => import("./admin/routes/adminRoutes"));

function App() {
  const queryClient = useQueryClient();

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
    return useAuthStore.subscribe((state) => {
      if (wasAuthed && !state.isAuthenticated) {
        usePlayerStore.getState().stop();
        queryClient.clear();
      }
      wasAuthed = state.isAuthenticated;
    });
  }, [queryClient]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<ClientRoutes />} />
        </Routes>
      </Suspense>
      <PWAInstallBanner />
      <UpsellModal />
    </BrowserRouter>
  );
}

export default App;

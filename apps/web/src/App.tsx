import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChangePassword from "./auth/pages/ChangePassword";
import ForgotPassword from "./auth/pages/ForgotPassword";
import Login from "./auth/pages/Login";
import Register from "./auth/pages/Register";
import VerifyCode from "./auth/pages/VerifyCode";
import ClientRoutes from "./client/routes/clientRoutes";
import AdminRoutes from "./admin/routes/adminRoutes";
import PWAInstallBanner from "./shared/ui/PWAInstallBanner";
import UpsellModal from "./shared/ui/UpsellModal";
import { useAuthStore } from "./shared/stores/authStore";
import { usePlayerStore } from "./client/stores/playStore";

function App() {
  const queryClient = useQueryClient();

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
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<ClientRoutes />} />
      </Routes>
      <PWAInstallBanner />
      <UpsellModal />
    </BrowserRouter>
  );
}

export default App;

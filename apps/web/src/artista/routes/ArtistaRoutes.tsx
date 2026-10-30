import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { RequireArtist } from "../../shared/guards/RequireArtist";
import ArtistLayout from "../layout/ArtistLayout";
import RouteFallback from "../../shared/ui/RouteFallback";

const ArtistDashboardPage = lazy(() => import("../pages/ArtistDashboardPage"));
const ArtistWorkspacePage = lazy(() => import("../pages/ArtistWorkspacePage"));

export default function ArtistaRoutes() {
  return (
    <RequireArtist>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<ArtistLayout />}>
            <Route index element={<ArtistDashboardPage />} />
            <Route
              path="music"
              element={<ArtistWorkspacePage view="music" />}
            />
            <Route
              path="albums"
              element={<ArtistWorkspacePage view="albums" />}
            />
            <Route path="team" element={<ArtistWorkspacePage view="team" />} />
            <Route
              path="settings"
              element={<ArtistWorkspacePage view="settings" />}
            />
            <Route
              path="profile"
              element={<ArtistWorkspacePage view="profile" />}
            />
            <Route
              path="analytics"
              element={<ArtistWorkspacePage view="analytics" />}
            />
            <Route
              path="notifications"
              element={<ArtistWorkspacePage view="notifications" />}
            />
          </Route>
          <Route
            path="*"
            element={<Navigate to="/artist-dashboard" replace />}
          />
        </Routes>
      </Suspense>
    </RequireArtist>
  );
}

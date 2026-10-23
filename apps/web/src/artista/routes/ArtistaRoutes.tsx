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
              path="releases"
              element={<ArtistWorkspacePage view="releases" />}
            />
            <Route
              path="analytics"
              element={<ArtistWorkspacePage view="analytics" />}
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

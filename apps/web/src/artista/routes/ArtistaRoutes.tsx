import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { RequireArtist } from "../../shared/guards/RequireArtist";
import RouteFallback from "../../shared/ui/RouteFallback";

const ArtistDashboardPage = lazy(() => import("../pages/ArtistDashboardPage"));

export default function ArtistaRoutes() {
  return (
    <RequireArtist>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<ArtistDashboardPage />} />
          <Route
            path="*"
            element={<Navigate to="/artist-dashboard" replace />}
          />
        </Routes>
      </Suspense>
    </RequireArtist>
  );
}

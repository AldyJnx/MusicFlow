import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "../../shared/guards/RequireAdmin";
import RouteFallback from "../../shared/ui/RouteFallback";
import AdminLayout from "../layout/AdminLayout";

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const UsersPage = lazy(() => import("../pages/UsersPage"));
const UserDetailPage = lazy(() => import("../pages/UserDetailPage"));
const AIRequestsPage = lazy(() => import("../pages/AIRequestsPage"));
const EqPresetsPage = lazy(() => import("../pages/EqPresetsPage"));
const GenresPage = lazy(() => import("../pages/GenresPage"));
const AdminProfilePage = lazy(() => import("../pages/AdminProfilePage"));
const CatalogPage = lazy(() => import("../pages/CatalogPage"));
const AdminSettingsPage = lazy(() => import("../pages/AdminSettingsPage"));
const ArtistAccessRequestsPage = lazy(
  () => import("../pages/ArtistAccessRequestsPage"),
);
const ArtistVerificationRequestsPage = lazy(
  () => import("../pages/ArtistVerificationRequestsPage"),
);

export default function AdminRoutes() {
  return (
    <RequireAdmin>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="ai" element={<AIRequestsPage />} />
            <Route path="eq-presets" element={<EqPresetsPage />} />
            <Route path="genres" element={<GenresPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route
              path="artist-access"
              element={<ArtistAccessRequestsPage />}
            />
            <Route
              path="artist-verifications"
              element={<ArtistVerificationRequestsPage />}
            />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </RequireAdmin>
  );
}

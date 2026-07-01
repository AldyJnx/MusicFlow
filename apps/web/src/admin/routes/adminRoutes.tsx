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
const CatalogPage = lazy(() => import("../pages/CatalogPage"));

export default function AdminRoutes() {
  return (
    <RequireAdmin>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/ai" element={<AIRequestsPage />} />
            <Route path="/eq-presets" element={<EqPresetsPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </RequireAdmin>
  );
}

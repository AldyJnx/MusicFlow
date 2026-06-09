import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "../../shared/guards/RequireAdmin";
import AdminLayout from "../layout/AdminLayout";
import DashboardPage from "../pages/DashboardPage";
import UsersPage from "../pages/UsersPage";
import UserDetailPage from "../pages/UserDetailPage";
import AIRequestsPage from "../pages/AIRequestsPage";
import EqPresetsPage from "../pages/EqPresetsPage";

export default function AdminRoutes() {
  return (
    <RequireAdmin>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/ai" element={<AIRequestsPage />} />
          <Route path="/eq-presets" element={<EqPresetsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </RequireAdmin>
  );
}

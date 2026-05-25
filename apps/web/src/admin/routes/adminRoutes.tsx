import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "../../shared/guards/RequireAdmin";
import DashboardPage from "../pages/DashboardPage";
import UsersPage from "../pages/UsersPage";
import AIRequestsPage from "../pages/AIRequestsPage";

export default function AdminRoutes() {
  return (
    <RequireAdmin>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/ai" element={<AIRequestsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </RequireAdmin>
  );
}

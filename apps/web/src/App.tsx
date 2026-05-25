import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChangePassword from "./auth/pages/ChangePassword";
import ForgotPassword from "./auth/pages/ForgotPassword";
import Login from "./auth/pages/Login";
import Register from "./auth/pages/Register";
import VerifyCode from "./auth/pages/VerifyCode";
import ClientRoutes from "./client/routes/clientRoutes";
import AdminRoutes from "./admin/routes/adminRoutes";
import PWAInstallBanner from "./shared/ui/PWAInstallBanner";

function App() {
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
    </BrowserRouter>
  );
}

export default App;

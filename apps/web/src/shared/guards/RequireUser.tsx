import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../stores/authStore";

export function RequireUser({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user?.role !== "CLIENT") {
    const destination =
      user?.role === "ARTIST" ? "/artist-dashboard" : "/admin";
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../stores/authStore";
import { getArtistPortalContext } from "../api/artist-portal";
import RouteFallback from "../ui/RouteFallback";
import ArtistAccessPage from "../../artista/pages/ArtistAccessPage";

export function RequireArtist({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const context = useQuery({
    queryKey: ["artist-portal", "context"],
    queryFn: getArtistPortalContext,
    enabled: isAuthenticated,
    // When the user is waiting for review, discover a new membership without
    // forcing a logout or a manual reload. Once approved, this guard renders
    // the Artist Portal immediately.
    refetchInterval: (query) =>
      query.state.data?.memberships.length ||
      !query.state.data?.requests.some(
        (request) => request.status === "PENDING",
      )
        ? false
        : 30_000,
  });

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (context.isPending) return <RouteFallback />;
  if (context.isError) return <Navigate to="/" replace />;
  if (!context.data.memberships.length) {
    return <ArtistAccessPage requests={context.data.requests} />;
  }

  return <>{children}</>;
}

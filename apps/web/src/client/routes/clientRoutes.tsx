import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PremiumGateProvider } from "../../shared/hooks/usePremiumGate";
import RouteFallback from "../../shared/ui/RouteFallback";
import OfflineRouteGuard from "../components/OfflineRouteGuard";

// Each page is its own chunk — the initial load only pays for the route the
// user actually lands on, not the whole client app.
const HomePage = lazy(() => import("../pages/HomePage"));
const LibraryPage = lazy(() => import("../pages/LibraryPage"));
const ArtistPage = lazy(() => import("../pages/ArtistPage"));
const AlbumPage = lazy(() => import("../pages/AlbumPage"));
const DownloadsPage = lazy(() => import("../pages/DownloadsPage"));
const PlaylistsPage = lazy(() => import("../pages/PlaylistsPage"));
const PlaylistDetailPage = lazy(() => import("../pages/PlaylistDetailPage"));
const NowPlayingPage = lazy(() => import("../pages/NowPlayingPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const BillingPage = lazy(() => import("../pages/BillingPage"));
const StudioPage = lazy(() => import("../pages/StudioPage"));
const Equalizer = lazy(() => import("../features/equalizer/Equalizer"));
const Segments = lazy(() => import("../features/segments/Segments"));
const Agent = lazy(() => import("../features/ai-agent/Agent"));
const ProfileSettings = lazy(
  () => import("../features/profile/ProfileSettings"),
);

export default function ClientRoutes() {
  // The Provider sits above <Routes> so every page can call usePremiumGate
  // — including pages like Segments and Agent that need to render a locked
  // fallback *before* ClientLayout mounts.
  return (
    <PremiumGateProvider>
      <OfflineRouteGuard />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/artist/:name" element={<ArtistPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
          <Route path="/equalizer" element={<Equalizer />} />
          <Route path="/now-playing" element={<NowPlayingPage />} />
          <Route path="/ai-mixer" element={<Agent />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/segments" element={<Segments />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
        </Routes>
      </Suspense>
    </PremiumGateProvider>
  );
}

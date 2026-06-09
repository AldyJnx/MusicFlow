import { Navigate, Route, Routes } from "react-router-dom";
import LibraryPage from "../pages/LibraryPage";
import NowPlayingPage from "../pages/NowPlayingPage";
import PlaylistsPage from "../pages/PlaylistsPage";
import SettingsPage from "../pages/SettingsPage";
import BillingPage from "../pages/BillingPage";
import HomePage from "../pages/HomePage";
import ArtistPage from "../pages/ArtistPage";
import StudioPage from "../pages/StudioPage";
import Equalizer from "../features/equalizer/Equalizer";
import Segments from "../features/segments/Segments";
import Agent from "../features/ai-agent/Agent";
import ProfileSettings from "../features/profile/ProfileSettings";

export default function ClientRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/inicio" replace />} />
      <Route path="/inicio" element={<HomePage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/artist/:name" element={<ArtistPage />} />
      <Route path="/playlists" element={<PlaylistsPage />} />
      <Route path="/equalizer" element={<Equalizer />} />
      <Route path="/now-playing" element={<NowPlayingPage />} />
      <Route path="/ai-mixer" element={<Agent />} />
      <Route path="/profile" element={<ProfileSettings />} />
      <Route path="/segments" element={<Segments />} />
      <Route path="/studio" element={<StudioPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/billing" element={<BillingPage />} />
    </Routes>
  );
}

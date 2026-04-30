import { Navigate, Route, Routes } from 'react-router-dom'
import LibraryPage from '../pages/LibraryPage'
import NowPlayingPage from '../pages/NowPlayingPage'
import PlaylistsPage from '../pages/PlaylistsPage'
import SettingsPage from '../pages/SettingsPage'
import Segments from '../features/segments/Segments'
import Agent from '../features/ai-agent/Agent'
import ProfileSettings from '../features/profile/ProfileSettings'

export default function ClientRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/library" replace />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/playlists" element={<PlaylistsPage />} />
      <Route path="/now-playing" element={<NowPlayingPage />} />
      <Route path="/ai-mixer" element={<Agent />} />
      <Route path="/profile" element={<ProfileSettings />} />
      <Route path="/segments" element={<Segments />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

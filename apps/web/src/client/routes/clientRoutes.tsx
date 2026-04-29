import { Navigate, Route, Routes } from 'react-router-dom'
import LibraryPage from '../pages/LibraryPage'
import NowPlayingPage from '../pages/NowPlayingPage'
import PlaylistsPage from '../pages/PlaylistsPage'
import SettingsPage from '../pages/SettingsPage'
import Segments from '../features/segments/Segments'

export default function ClientRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/library" replace />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/playlists" element={<PlaylistsPage />} />
      <Route path="/now-playing" element={<NowPlayingPage />} />
      <Route path="/segments" element={<Segments />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

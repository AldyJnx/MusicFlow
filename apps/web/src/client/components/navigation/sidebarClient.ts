import type { SidebarItem } from '../../../shared/ui/navigation/types'

export const sidebarClient: SidebarItem[] = [
  { label: 'Library', path: '/library', iconKey: 'library', badge: 'dot' },
  { label: 'Search', path: '/search', iconKey: 'search' },
  { label: 'Playlists', path: '/playlists', iconKey: 'playlists' },
  { label: 'Now Playing', path: '/now-playing', iconKey: 'nowPlaying' },
  { label: 'Equalizer', path: '/equalizer', iconKey: 'equalizer' },
  { label: 'Segments', path: '/segments', iconKey: 'segments' },
  { label: 'Stats', path: '/stats', iconKey: 'stats' },
  { label: 'Lyrics', path: '/lyrics', iconKey: 'lyrics' },
  { label: 'Settings', path: '/settings', iconKey: 'settings' },
]

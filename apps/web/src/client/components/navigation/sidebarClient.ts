import type { SidebarItem } from '../../../shared/ui/navigation/types'

export const sidebarClient: SidebarItem[] = [
  { label: 'Library', path: '/library', iconKey: 'library', badge: 'dot' },
  { label: 'Playlists', path: '/playlists', iconKey: 'playlists' },
  { label: 'Equalizer', path: '/equalizer', iconKey: 'equalizer' },
  { label: 'Segments', path: '/segments', iconKey: 'segments' },
  { label: 'Settings', path: '/settings', iconKey: 'settings' },
]

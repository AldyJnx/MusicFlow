export type SidebarIconKey =
  | 'library'
  | 'search'
  | 'playlists'
  | 'nowPlaying'
  | 'equalizer'
  | 'segments'
  | 'stats'
  | 'lyrics'
  | 'settings'

export type SidebarItem = {
  label: string
  path: string
  iconKey: SidebarIconKey
  badge?: string
  active?: boolean
  danger?: boolean
}

export type SidebarProps = {
  title?: string
  version?: string
  items: SidebarItem[]
}

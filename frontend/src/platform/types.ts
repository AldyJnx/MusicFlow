/**
 * Platform abstraction types for MusicFlow.
 * Common interfaces for file system, local database, and notifications.
 */

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration_ms: number
  file_path_local?: string
  file_url_remote?: string
  file_hash: string
  cover_art?: string
  genre?: string
  year?: number
}

export interface LocalDB {
  // Tracks
  getTrack(id: string): Promise<Track | null>
  getAllTracks(): Promise<Track[]>
  saveTrack(track: Track): Promise<void>
  deleteTrack(id: string): Promise<void>
  searchTracks(query: string): Promise<Track[]>

  // Generic
  clear(): Promise<void>
}

export interface FileSystem {
  // Check if file system access is supported
  isSupported(): boolean

  // Read directory contents
  readDirectory(path: string): Promise<string[]>

  // Read file as ArrayBuffer
  readFile(path: string): Promise<ArrayBuffer>

  // Write file
  writeFile(path: string, data: ArrayBuffer): Promise<void>

  // Pick files using system dialog
  pickFiles(options?: {
    accept?: string[]
    multiple?: boolean
  }): Promise<File[]>

  // Pick directory
  pickDirectory(): Promise<string | null>
}

export interface NotificationService {
  isSupported(): boolean
  requestPermission(): Promise<boolean>
  show(title: string, options?: NotificationOptions): void
}

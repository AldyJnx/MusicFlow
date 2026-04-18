/**
 * Desktop (Electron) implementation of LocalDB using SQLite via IPC.
 */
import type { LocalDB, Track } from '../types'

export const desktopLocalDB: LocalDB = {
  async getTrack(id: string): Promise<Track | null> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const result = await window.electronAPI.sqlite.query(
      'SELECT * FROM tracks WHERE id = ?',
      [id]
    )
    return (result[0] as Track) ?? null
  },

  async getAllTracks(): Promise<Track[]> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const result = await window.electronAPI.sqlite.query(
      'SELECT * FROM tracks ORDER BY artist, album, track_number'
    )
    return result as Track[]
  },

  async saveTrack(track: Track): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    await window.electronAPI.sqlite.run(
      `INSERT OR REPLACE INTO tracks
       (id, title, artist, album, duration_ms, file_path_local, file_hash, cover_art, genre, year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        track.id,
        track.title,
        track.artist,
        track.album,
        track.duration_ms,
        track.file_path_local,
        track.file_hash,
        track.cover_art,
        track.genre,
        track.year,
      ]
    )
  },

  async deleteTrack(id: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    await window.electronAPI.sqlite.run('DELETE FROM tracks WHERE id = ?', [id])
  },

  async searchTracks(query: string): Promise<Track[]> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    const result = await window.electronAPI.sqlite.query(
      `SELECT * FROM tracks
       WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
       ORDER BY artist, album, track_number`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    )
    return result as Track[]
  },

  async clear(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    await window.electronAPI.sqlite.run('DELETE FROM tracks')
  },
}

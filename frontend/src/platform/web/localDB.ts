/**
 * Web implementation of LocalDB using IndexedDB via Dexie.
 */
import Dexie, { type Table } from 'dexie'
import type { LocalDB, Track } from '../types'

class MusicFlowDB extends Dexie {
  tracks!: Table<Track>

  constructor() {
    super('MusicFlowDB')
    this.version(1).stores({
      tracks: 'id, title, artist, album, genre, file_hash',
    })
  }
}

const db = new MusicFlowDB()

export const webLocalDB: LocalDB = {
  async getTrack(id: string): Promise<Track | null> {
    return (await db.tracks.get(id)) ?? null
  },

  async getAllTracks(): Promise<Track[]> {
    return db.tracks.toArray()
  },

  async saveTrack(track: Track): Promise<void> {
    await db.tracks.put(track)
  },

  async deleteTrack(id: string): Promise<void> {
    await db.tracks.delete(id)
  },

  async searchTracks(query: string): Promise<Track[]> {
    const lowerQuery = query.toLowerCase()
    return db.tracks
      .filter(
        (track) =>
          track.title.toLowerCase().includes(lowerQuery) ||
          track.artist.toLowerCase().includes(lowerQuery) ||
          track.album.toLowerCase().includes(lowerQuery)
      )
      .toArray()
  },

  async clear(): Promise<void> {
    await db.tracks.clear()
  },
}

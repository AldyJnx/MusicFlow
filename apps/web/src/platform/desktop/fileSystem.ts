/**
 * Desktop (Electron) implementation of FileSystem using Node.js fs via IPC.
 */
import type { FileSystem } from '../types'

export const desktopFileSystem: FileSystem = {
  isSupported(): boolean {
    return !!window.electronAPI
  },

  async readDirectory(path: string): Promise<string[]> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    return window.electronAPI.fs.readDir(path)
  },

  async readFile(path: string): Promise<ArrayBuffer> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    return window.electronAPI.fs.readFile(path)
  },

  async writeFile(path: string, data: ArrayBuffer): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available')
    }
    return window.electronAPI.fs.writeFile(path, data)
  },

  async pickFiles(options?: {
    accept?: string[]
    multiple?: boolean
  }): Promise<File[]> {
    // Electron will use its own dialog
    // This would be implemented via IPC
    console.log('pickFiles called with options:', options)
    return []
  },

  async pickDirectory(): Promise<string | null> {
    // Electron will use its own dialog
    // This would be implemented via IPC
    return null
  },
}

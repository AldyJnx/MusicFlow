/**
 * Web implementation of FileSystem using File System Access API.
 */
import type { FileSystem } from '../types'

export const webFileSystem: FileSystem = {
  isSupported(): boolean {
    return 'showOpenFilePicker' in window
  },

  async readDirectory(_path: string): Promise<string[]> {
    // Web doesn't support arbitrary directory access
    // User must pick a directory first
    console.warn('readDirectory not fully supported in web. Use pickDirectory instead.')
    return []
  },

  async readFile(_path: string): Promise<ArrayBuffer> {
    // Web doesn't support arbitrary file access
    throw new Error('readFile not supported in web. Use pickFiles instead.')
  },

  async writeFile(_path: string, _data: ArrayBuffer): Promise<void> {
    // Would need a file handle from a previous pick operation
    throw new Error('writeFile requires a file handle from showSaveFilePicker')
  },

  async pickFiles(options?: {
    accept?: string[]
    multiple?: boolean
  }): Promise<File[]> {
    if (!this.isSupported()) {
      // Fallback to input element
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = options?.multiple ?? false
        if (options?.accept) {
          input.accept = options.accept.join(',')
        }
        input.onchange = () => {
          const files = Array.from(input.files ?? [])
          resolve(files)
        }
        input.click()
      })
    }

    try {
      const handles = await (window as any).showOpenFilePicker({
        multiple: options?.multiple ?? false,
        types: options?.accept
          ? [
              {
                description: 'Audio files',
                accept: {
                  'audio/*': options.accept,
                },
              },
            ]
          : undefined,
      })
      const files: File[] = []
      for (const handle of handles) {
        const file = await handle.getFile()
        files.push(file)
      }
      return files
    } catch (e) {
      // User cancelled
      return []
    }
  },

  async pickDirectory(): Promise<string | null> {
    if (!('showDirectoryPicker' in window)) {
      console.warn('Directory picker not supported in this browser')
      return null
    }

    try {
      const handle = await (window as any).showDirectoryPicker()
      return handle.name
    } catch (e) {
      // User cancelled
      return null
    }
  },
}

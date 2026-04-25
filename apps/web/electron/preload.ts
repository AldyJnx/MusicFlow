import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process
// to use the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  fs: {
    readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path: string, data: ArrayBuffer) =>
      ipcRenderer.invoke('fs:writeFile', path, data),
  },
  sqlite: {
    query: (sql: string, params?: unknown[]) =>
      ipcRenderer.invoke('sqlite:query', sql, params),
    run: (sql: string, params?: unknown[]) =>
      ipcRenderer.invoke('sqlite:run', sql, params),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    platform: () => ipcRenderer.invoke('app:platform'),
  },
})

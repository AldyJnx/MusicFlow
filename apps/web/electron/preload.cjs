const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    platform: 'desktop',

    // Music scan — used by the Import flow on desktop to pull from
    // ~/Music (or anywhere the user picks) without going through the
    // browser's webkitdirectory picker.
    async scanMusicFolder() {
        const folder = await ipcRenderer.invoke('music:pickFolder')
        if (!folder) return null
        const files = await ipcRenderer.invoke('music:scanFolder', folder)
        return { folder, files }
    },

    readMusicFile(absolutePath) {
        return ipcRenderer.invoke('music:readFile', absolutePath)
    },
})
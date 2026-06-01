const { contextBridge } = require('electron')
const { platform } = require('os')

contextBridge.exposeInMainWorld('electronAPI', {
    platform: 'desktop'
})
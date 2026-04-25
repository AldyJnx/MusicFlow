import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process
// to use the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    fs: {
        readDir: function (path) { return ipcRenderer.invoke('fs:readDir', path); },
        readFile: function (path) { return ipcRenderer.invoke('fs:readFile', path); },
        writeFile: function (path, data) {
            return ipcRenderer.invoke('fs:writeFile', path, data);
        },
    },
    sqlite: {
        query: function (sql, params) {
            return ipcRenderer.invoke('sqlite:query', sql, params);
        },
        run: function (sql, params) {
            return ipcRenderer.invoke('sqlite:run', sql, params);
        },
    },
    app: {
        getVersion: function () { return ipcRenderer.invoke('app:getVersion'); },
        platform: function () { return ipcRenderer.invoke('app:platform'); },
    },
});

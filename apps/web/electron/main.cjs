const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs/promises')

let mainWindow = null

const AUDIO_EXTS = new Set([
    '.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac', '.opus',
])
// Bound how deep we walk so a pathological "C:\" or root pick can't lock the
// main process scanning the entire disk. 4 levels covers a typical
// ~/Music/Artist/Album/track layout.
const MAX_DEPTH = 4
const MAX_FILES = 1000

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1200,
        minHeight: 760,
        backgroundColor: '#090914',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    // In development (not packaged) load the Vite dev server for HMR; in a
    // packaged build load the bundled renderer from disk. Using app.isPackaged
    // keeps the production path from ever pointing at localhost.
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    } else {
        const devServerUrl =
            process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
        mainWindow.loadURL(devServerUrl)
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

// Pick a folder via the OS dialog. Returns null when the user cancels.
ipcMain.handle('music:pickFolder', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'showHiddenFiles'],
        title: 'Elegir carpeta de música',
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
})

// Recursively walk `root` collecting audio files. Returns metadata only —
// the renderer fetches bytes on demand via 'music:readFile' so the IPC
// payload stays small even for libraries with thousands of tracks.
ipcMain.handle('music:scanFolder', async (_event, root) => {
    if (typeof root !== 'string' || !root) return []
    const out = []
    async function walk(dir, depth) {
        if (depth > MAX_DEPTH || out.length >= MAX_FILES) return
        let entries
        try {
            entries = await fs.readdir(dir, { withFileTypes: true })
        } catch {
            return
        }
        for (const entry of entries) {
            if (out.length >= MAX_FILES) return
            // Skip dotfiles and obvious junk.
            if (entry.name.startsWith('.')) continue
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                await walk(full, depth + 1)
                continue
            }
            if (!entry.isFile()) continue
            const ext = path.extname(entry.name).toLowerCase()
            if (!AUDIO_EXTS.has(ext)) continue
            try {
                const stat = await fs.stat(full)
                out.push({
                    absolutePath: full,
                    name: entry.name,
                    relPath: path.relative(root, full),
                    sizeBytes: stat.size,
                })
            } catch {
                // Skip files we can't stat (permissions, vanished, etc).
            }
        }
    }
    await walk(root, 0)
    return out
})

ipcMain.handle('music:readFile', async (_event, absolutePath) => {
    if (typeof absolutePath !== 'string') {
        throw new Error('absolutePath required')
    }
    const buf = await fs.readFile(absolutePath)
    return buf
})

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
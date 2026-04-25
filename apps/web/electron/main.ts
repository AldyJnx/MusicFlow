import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? true : false,
    backgroundColor: '#0f172a',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

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

// IPC Handlers for File System
ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
  try {
    const files = await fs.promises.readdir(dirPath)
    return files
  } catch (error) {
    throw error
  }
})

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const buffer = await fs.promises.readFile(filePath)
    return buffer.buffer
  } catch (error) {
    throw error
  }
})

ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: ArrayBuffer) => {
  try {
    await fs.promises.writeFile(filePath, Buffer.from(data))
  } catch (error) {
    throw error
  }
})

// IPC Handlers for App info
ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

ipcMain.handle('app:platform', () => {
  return process.platform
})

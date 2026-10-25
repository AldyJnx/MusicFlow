const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  nativeImage,
  safeStorage,
} = require("electron");
const path = require("path");
const fs = require("fs/promises");

let mainWindow = null;

const DEVELOPMENT_ICON_PATH = path.join(
  __dirname,
  "..",
  "src",
  "assets",
  "Logo_Music_Flow-FormatoIco.ico",
);

const AUDIO_EXTS = new Set([
  ".mp3",
  ".flac",
  ".wav",
  ".m4a",
  ".ogg",
  ".aac",
  ".opus",
]);
// Bound how deep we walk so a pathological "C:\" or root pick can't lock the
// main process scanning the entire disk. 4 levels covers a typical
// ~/Music/Artist/Album/track layout.
const MAX_DEPTH = 4;
const MAX_FILES = 1000;
const AUTH_SESSION_FILENAME = "musicflow-auth-session.bin";

function getGoogleCallbackTicket(navigationUrl) {
  try {
    const url = new URL(navigationUrl);
    if (!url.pathname.endsWith("/auth/google/callback")) return null;
    return url.searchParams.get("ticket");
  } catch {
    return null;
  }
}

function loadRendererRoute(route, params = new URLSearchParams()) {
  if (!mainWindow) return;
  const hash = `${route}${params.size ? `?${params.toString()}` : ""}`;

  if (app.isPackaged) {
    void mainWindow.loadFile(
      path.join(process.resourcesPath, "dist", "index.html"),
      { hash },
    );
    return;
  }

  const url = new URL(
    process.env.VITE_DEV_SERVER_URL || "http://localhost:5173",
  );
  url.hash = hash;
  void mainWindow.loadURL(url.toString());
}

function redirectGoogleCallbackToRenderer(navigationUrl) {
  const ticket = getGoogleCallbackTicket(navigationUrl);
  if (!ticket) return false;

  loadRendererRoute("/auth/google/callback", new URLSearchParams({ ticket }));
  return true;
}

function getAuthSessionPath() {
  return path.join(app.getPath("userData"), AUTH_SESSION_FILENAME);
}

function createWindow() {
  const appIconPath = app.isPackaged
    ? path.join(process.resourcesPath, "musicflow.ico")
    : DEVELOPMENT_ICON_PATH;
  const appIcon = nativeImage.createFromPath(appIconPath);
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    center: true,
    show: false,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#090914",
    autoHideMenuBar: true,
    // MusicFlow renders its own title bar so the controls can accurately
    // represent the current maximize/restore state on every platform.
    frame: false,
    icon: appIcon.isEmpty() ? undefined : appIcon,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
  }
  installZoomShortcuts(mainWindow);
  // Native trackpad swipes are emitted by Electron on macOS. Forward them
  // to the renderer; Windows/Linux precision touchpads use the wheel fallback.
  mainWindow.webContents.on("swipe", (_event, direction) => {
    mainWindow?.webContents.send("system:swipe", direction);
  });
  // Windows precision-trackpad gestures can be surfaced as browser
  // navigation commands. MusicFlow uses them for track navigation instead.
  mainWindow.on("app-command", (event, command) => {
    const direction =
      command === "browser-forward" || command === "media-nexttrack"
        ? "left"
        : command === "browser-backward" || command === "media-previoustrack"
          ? "right"
          : null;
    if (!direction) return;
    event.preventDefault();
    mainWindow?.webContents.send("system:swipe", direction);
  });

  // Always open as a centered, windowed desktop app. Do not inherit a
  // maximized/full-screen state from the previous Electron process.
  mainWindow.setSize(1440, 900);
  mainWindow.center();
  mainWindow.unmaximize();
  mainWindow.once("ready-to-show", () => mainWindow?.show());

  const sendWindowState = () => {
    mainWindow?.webContents.send(
      "window:maximized-changed",
      mainWindow.isMaximized(),
    );
  };
  mainWindow.on("maximize", sendWindowState);
  mainWindow.on("unmaximize", sendWindowState);

  // A Google callback returns to the configured web APP_URL. Capture its
  // one-time ticket and return to the local Electron renderer instead of
  // leaving the desktop application on a browser login page.
  mainWindow.webContents.on("will-redirect", (event, navigationUrl) => {
    if (redirectGoogleCallbackToRenderer(navigationUrl)) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    if (redirectGoogleCallbackToRenderer(navigationUrl)) {
      event.preventDefault();
    }
  });

  // In development (not packaged) load the Vite dev server for HMR; in a
  // packaged build load the bundled renderer from disk. Using app.isPackaged
  // keeps the production path from ever pointing at localhost.
  loadRendererRoute("/");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window:toggle-maximize", () => {
  if (!mainWindow) return false;
  const wasMaximized = mainWindow.isMaximized();
  if (wasMaximized) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
  return !wasMaximized;
});

ipcMain.handle("window:close", () => {
  mainWindow?.close();
});

ipcMain.handle("window:is-maximized", () => mainWindow?.isMaximized() ?? false);

ipcMain.handle("auth-session:load", async () => {
  if (!safeStorage.isEncryptionAvailable()) return null;

  try {
    const encrypted = await fs.readFile(getAuthSessionPath());
    return safeStorage.decryptString(encrypted);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    // A profile copied from another Windows account cannot be decrypted.
    // Discard only this local cache and let the user authenticate again.
    await fs.unlink(getAuthSessionPath()).catch(() => undefined);
    return null;
  }
});

ipcMain.handle("auth-session:save", async (_event, serializedSession) => {
  if (
    typeof serializedSession !== "string" ||
    serializedSession.length > 64_000
  ) {
    throw new Error("Invalid desktop auth session");
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure credential storage is unavailable");
  }

  const target = getAuthSessionPath();
  const temporary = `${target}.tmp`;
  await fs.writeFile(temporary, safeStorage.encryptString(serializedSession));
  await fs.rename(temporary, target);
});

ipcMain.handle("auth-session:clear", async () => {
  try {
    await fs.unlink(getAuthSessionPath());
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
});

function installZoomShortcuts(window) {
  window.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown" || !(input.control || input.meta)) return;

    const isZoomIn =
      input.key === "+" || input.key === "=" || input.code === "NumpadAdd";
    const isZoomOut = input.key === "-" || input.code === "NumpadSubtract";
    if (!isZoomIn && !isZoomOut) return;

    event.preventDefault();
    const step = isZoomIn ? 0.1 : -0.1;
    const current = window.webContents.getZoomFactor();
    const next = Math.min(
      2,
      Math.max(0.5, Math.round((current + step) * 10) / 10),
    );
    window.webContents.setZoomFactor(next);
  });
}

// Pick a folder via the OS dialog. Returns null when the user cancels.
ipcMain.handle("music:pickFolder", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "showHiddenFiles"],
    title: "Elegir carpeta de música",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Recursively walk `root` collecting audio files. Returns metadata only —
// the renderer fetches bytes on demand via 'music:readFile' so the IPC
// payload stays small even for libraries with thousands of tracks.
ipcMain.handle("music:scanFolder", async (_event, root) => {
  if (typeof root !== "string" || !root) return [];
  const out = [];
  async function walk(dir, depth) {
    if (depth > MAX_DEPTH || out.length >= MAX_FILES) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (out.length >= MAX_FILES) return;
      // Skip dotfiles and obvious junk.
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!AUDIO_EXTS.has(ext)) continue;
      try {
        const stat = await fs.stat(full);
        out.push({
          absolutePath: full,
          name: entry.name,
          relPath: path.relative(root, full),
          sizeBytes: stat.size,
        });
      } catch {
        // Skip files we can't stat (permissions, vanished, etc).
      }
    }
  }
  await walk(root, 0);
  return out;
});

ipcMain.handle("music:readFile", async (_event, absolutePath) => {
  if (typeof absolutePath !== "string") {
    throw new Error("absolutePath required");
  }
  const buf = await fs.readFile(absolutePath);
  return buf;
});

app.whenReady().then(() => {
  // Windows uses this identity together with the BrowserWindow icon for the
  // running taskbar button instead of falling back to Electron's logo.
  if (process.platform === "win32") {
    app.setAppUserModelId("app.musicflow.desktop");
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

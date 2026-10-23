import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

import { getElectronAPI, isElectron } from "../../platform/electronAPI";

/**
 * Native-like controls for the frameless Electron shell. They are deliberately
 * absent in the browser/PWA, where the browser owns its window controls.
 */
export default function DesktopWindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);
  const desktop = isElectron();

  useEffect(() => {
    if (!desktop) return;

    document.body.classList.add("electron-desktop");
    const controls = getElectronAPI()?.windowControls;
    if (!controls)
      return () => document.body.classList.remove("electron-desktop");

    void controls.isMaximized().then(setIsMaximized);
    const unsubscribe = controls.onMaximizedChange(setIsMaximized);
    return () => {
      unsubscribe();
      document.body.classList.remove("electron-desktop");
    };
  }, [desktop]);

  if (!desktop) return null;

  const controls = getElectronAPI()?.windowControls;
  if (!controls) return null;

  return (
    <div
      className="desktop-window-titlebar fixed inset-x-0 top-0 z-[100] flex h-9 items-center justify-end border-b border-[var(--color-line)] bg-[var(--color-navbar)]/95 backdrop-blur"
      aria-label="Controles de ventana"
    >
      <div
        className="flex h-full"
        style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
      >
        <button
          type="button"
          onClick={() => void controls.minimize()}
          className="inline-flex h-full w-12 items-center justify-center text-[var(--color-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
          aria-label="Minimizar ventana"
          title="Minimizar"
        >
          <Minus className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => void controls.toggleMaximize().then(setIsMaximized)}
          className="inline-flex h-full w-12 items-center justify-center text-[var(--color-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
          aria-label={isMaximized ? "Restaurar ventana" : "Maximizar ventana"}
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          {isMaximized ? (
            <Copy className="h-3.5 w-3.5" strokeWidth={2.1} />
          ) : (
            <Square className="h-3.5 w-3.5" strokeWidth={2.1} />
          )}
        </button>
        <button
          type="button"
          onClick={() => void controls.close()}
          className="inline-flex h-full w-12 items-center justify-center text-[var(--color-muted)] transition hover:bg-rose-500 hover:text-white"
          aria-label="Cerrar ventana"
          title="Cerrar"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

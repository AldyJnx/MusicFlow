import { Download, X } from "lucide-react";
import { useState } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";

const DISMISS_KEY = "musicflow-pwa-install-dismissed";

export default function PWAInstallBanner() {
  const { status, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISS_KEY) === "1";
  });

  if (status !== "available" || dismissed) {
    return null;
  }

  function handleInstall() {
    void promptInstall();
  }

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore quota errors
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(24,27,35,0.95)] px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.4)] backdrop-blur md:left-auto md:right-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#14e3f7]/15 text-[#14e3f7]">
        <Download className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          Instala MusicFlow
        </p>
        <p className="truncate text-xs text-[#9ca7ba]">
          Acceso rapido y modo sin conexion parcial.
        </p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="rounded-lg bg-[#14e3f7] px-3 py-1.5 text-xs font-semibold text-[#092d35] transition hover:bg-[#3ceaf9]"
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Descartar"
        className="rounded-md p-1 text-[#7c8aa6] transition hover:bg-white/[0.04] hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

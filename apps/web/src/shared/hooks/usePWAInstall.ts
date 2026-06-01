import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallStatus = "unavailable" | "available" | "installed" | "dismissed";

interface UsePWAInstallResult {
  status: InstallStatus;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

export function usePWAInstall(): UsePWAInstallResult {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [status, setStatus] = useState<InstallStatus>(() => {
    if (typeof window === "undefined") return "unavailable";
    if (window.matchMedia("(display-mode: standalone)").matches)
      return "installed";
    return "unavailable";
  });

  useEffect(() => {
    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setStatus("available");
    }

    function handleInstalled() {
      setStatus("installed");
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function promptInstall(): Promise<
    "accepted" | "dismissed" | "unavailable"
  > {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setStatus(choice.outcome === "accepted" ? "installed" : "dismissed");
    return choice.outcome;
  }

  return { status, promptInstall };
}

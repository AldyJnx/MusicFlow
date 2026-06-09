import { CloudOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Tiny status pill that surfaces only when `navigator.onLine` flips false.
 * The Service Worker's stale-while-revalidate cache keeps GETs working
 * offline; this just tells the user "what you're seeing is cached".
 */
export default function OfflineIndicator() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && navigator.onLine === false,
  );

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300"
    >
      <CloudOff className="h-3.5 w-3.5" strokeWidth={2.3} />
      <span>{t("navbar.offline", { defaultValue: "Sin conexión" })}</span>
    </span>
  );
}

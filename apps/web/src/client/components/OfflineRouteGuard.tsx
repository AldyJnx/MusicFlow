import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useNetworkStore } from "../../shared/stores/networkStore";

// Routes that need the online catalog. While offline these bounce to /downloads
// (the local-player home); when connectivity returns the catalog comes back.
const CATALOG_PREFIXES = ["/inicio", "/library", "/artist", "/album"];

/**
 * Keeps navigation honest about connectivity: offline → only the downloads
 * library is reachable; back online (after having been offline) → return to
 * the catalog automatically. Render once inside the router.
 */
export default function OfflineRouteGuard() {
  const effectiveOffline = useNetworkStore((s) => s.effectiveOffline);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const wasOffline = useRef(effectiveOffline);

  useEffect(() => {
    const onCatalog = CATALOG_PREFIXES.some((p) => pathname.startsWith(p));
    if (effectiveOffline && onCatalog) {
      navigate("/downloads", { replace: true });
    } else if (
      !effectiveOffline &&
      wasOffline.current &&
      pathname.startsWith("/downloads")
    ) {
      navigate("/inicio", { replace: true });
    }
    wasOffline.current = effectiveOffline;
  }, [effectiveOffline, pathname, navigate]);

  return null;
}

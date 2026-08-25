import { useEffect } from "react";
import { Headphones, Loader2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../shared/stores/authStore";

const DISPLAY_MS = 950;

/** Brief post-auth transition shared with the mobile headphones tip. */
export default function HeadphonesTip() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const timeoutId = window.setTimeout(() => {
      navigate("/library", { replace: true });
    }, DISPLAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,var(--color-gradient-start)_0%,var(--color-gradient-end)_42%,var(--color-page)_100%)] px-6 text-white">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-[var(--color-primary)]/15 shadow-[0_10px_28px_var(--color-shadow)]">
          <Headphones
            className="h-14 w-14 text-[var(--color-primary)]"
            strokeWidth={1.8}
          />
        </div>
        <h1 className="mt-6 text-3xl font-black leading-tight">
          Mejor experiencia
          <br />
          con audifonos
        </h1>
        <Loader2
          className="mt-5 h-7 w-7 animate-spin text-[var(--color-primary)]"
          strokeWidth={2.5}
          aria-label="Cargando"
        />
      </div>
    </main>
  );
}

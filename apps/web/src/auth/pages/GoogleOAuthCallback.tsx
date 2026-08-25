import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { exchangeGoogleTicket } from "../../shared/api/auth";
import { useAuthStore } from "../../shared/stores/authStore";

export default function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ticket = params.get("ticket");
    if (!ticket) {
      setError("No recibimos una autorización válida de Google.");
      return;
    }

    let active = true;
    void exchangeGoogleTicket(ticket)
      .then((session) => {
        if (!active) return;
        setSession(session);
        navigate(
          session.user.role === "ADMIN"
            ? "/admin"
            : session.user.role === "ARTIST"
              ? "/artist-dashboard"
              : "/headphones-tip",
          { replace: true },
        );
      })
      .catch(() => {
        if (active) {
          setError("No pudimos completar el inicio de sesión con Google.");
        }
      });

    return () => {
      active = false;
    };
  }, [navigate, params, setSession]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#07131a] px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181b23] p-8 text-center shadow-2xl">
        {error ? (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-red-300" />
            <h1 className="mt-4 text-xl font-bold">
              No se pudo iniciar sesión
            </h1>
            <p className="mt-2 text-sm text-[#b8c4d9]">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#07131a]"
            >
              Volver al acceso
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-300" />
            <h1 className="mt-4 text-xl font-bold">Conectando con MusicFlow</h1>
            <p className="mt-2 text-sm text-[#b8c4d9]">
              Estamos validando tu cuenta de Google.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

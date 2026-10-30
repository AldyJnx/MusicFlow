import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Lock, Mail, Mic2 } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { login, type AuthResponse } from "../../shared/api/auth";
import { apiBaseUrl } from "../../shared/api/client";
import { useAuthStore } from "../../shared/stores/authStore";

export default function ArtistLogin() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const valid = useMemo(
    () => /\S+@\S+\.\S+/.test(email) && password.length > 0,
    [email, password],
  );
  const mutation = useMutation<
    AuthResponse,
    unknown,
    { email: string; password: string }
  >({
    mutationFn: login,
    onSuccess: (session) => {
      setSession(session);
      navigate("/artist-dashboard", { replace: true });
    },
  });
  if (authenticated) return <Navigate to="/artist-dashboard" replace />;
  const error = axios.isAxiosError(mutation.error)
    ? (mutation.error.response?.data as { message?: string })?.message
    : null;
  const google = () => {
    sessionStorage.setItem("musicflow-auth-destination", "artist");
    window.location.assign(`${apiBaseUrl}/auth/google`);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#173148,#060913_55%)] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-black/30 p-7 shadow-2xl backdrop-blur-xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Acceso de oyentes
        </Link>
        <div className="mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
          <Mic2 />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          MusicFlow for Artists
        </p>
        <h1 className="mt-2 text-3xl font-black">Portal de Artistas</h1>
        <p className="mt-2 text-sm text-slate-400">
          Usa tu cuenta MusicFlow. El acceso al perfil artístico requiere
          aprobación.
        </p>
        <form
          className="mt-7 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) mutation.mutate({ email: email.trim(), password });
          }}
        >
          <label className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4">
            <Mail className="h-4 w-4 text-slate-400" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Correo electrónico"
              className="flex-1 bg-transparent outline-none"
            />
          </label>
          <label className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4">
            <Lock className="h-4 w-4 text-slate-400" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña"
              className="flex-1 bg-transparent outline-none"
            />
          </label>
          {mutation.isError ? (
            <p className="text-sm text-rose-300">
              {error ?? "No pudimos iniciar sesión."}
            </p>
          ) : null}
          <button
            disabled={!valid || mutation.isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 font-black text-slate-950 disabled:opacity-40"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Entrar al portal
          </button>
        </form>
        <button
          type="button"
          onClick={google}
          className="mt-3 h-12 w-full rounded-xl border border-white/15 font-bold hover:bg-white/5"
        >
          Continuar con Google
        </button>
        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Aún no tienes cuenta?{" "}
          <Link className="font-bold text-white underline" to="/register">
            Crear cuenta MusicFlow
          </Link>
        </p>
      </section>
    </main>
  );
}

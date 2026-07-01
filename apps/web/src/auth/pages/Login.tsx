import { useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import fondoLogin from "../../assets/Fondo_Login.webp";
import logoMusicFlow from "../../assets/Logo_Music_Flow.webp";
import { login as loginRequest } from "../../shared/api/auth";
import { useAuthStore } from "../../shared/stores/authStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setSession(data);
      // Admins land on their panel; everyone else on the client library.
      navigate(data.user.role === "ADMIN" ? "/admin" : "/library");
    },
  });

  const isFormValid = useMemo(() => {
    return EMAIL_REGEX.test(email.trim()) && password.trim().length > 0;
  }, [email, password]);

  const errorMessage = loginMutation.isError
    ? axios.isAxiosError(loginMutation.error) &&
      (loginMutation.error.response?.data as { message?: string } | undefined)
        ?.message
      ? (loginMutation.error.response?.data as { message: string }).message
      : "No pudimos iniciar sesión. Revisa tus credenciales."
    : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormValid || loginMutation.isPending) {
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  }

  const isPending = loginMutation.isPending;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07131a] text-white">
      <img
        src={fondoLogin}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,11,18,0.28)_0%,rgba(4,10,16,0.58)_55%,rgba(3,8,14,0.84)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,92,232,0.12),transparent_36%),radial-gradient(circle_at_bottom,rgba(232,92,192,0.1),transparent_30%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <div className="mb-7 flex flex-col items-center">
          <img
            src={logoMusicFlow}
            alt="MusicFlow"
            className="h-20 w-auto object-contain drop-shadow-[0_0_24px_rgba(124,92,232,0.22)]"
          />
        </div>

        <div className="w-full max-w-[360px] rounded-[18px] border border-white/10 bg-[rgba(24,27,35,0.9)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <h1 className="mb-6 text-[1.7rem] font-semibold text-white">
            Bienvenido de nuevo
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <div className="flex h-12 items-center gap-3 rounded-[10px] border border-white/10 bg-[#0f1218] px-4 transition focus-within:border-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]">
                <Mail className="h-4 w-4 text-[#9aa6bf]" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isPending}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8590a8] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="flex h-12 items-center gap-3 rounded-[10px] border border-white/10 bg-[#0f1218] px-4 transition focus-within:border-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]">
                <Lock className="h-4 w-4 text-[#9aa6bf]" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isPending}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8590a8] disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="-mr-2 flex h-9 w-9 items-center justify-center rounded-md text-[#9aa6bf] transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-[0.72rem] font-medium text-[#b8c4d9] underline-offset-2 transition hover:text-white hover:underline"
                >
                  ¿Olvidé mi contraseña?
                </Link>
              </div>
            </div>

            {errorMessage && (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-200"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[11px] text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] focus:ring-offset-2 focus:ring-offset-[#181b23] ${
                isFormValid && !isPending
                  ? "bg-[linear-gradient(135deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] text-[var(--color-primary-contrast)] shadow-[0_0_28px_-4px_var(--color-primary)] hover:opacity-95"
                  : "cursor-not-allowed bg-[#2a303a] text-[#9aa3b5]"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-[#dde5ef]">
          ¿No tienes una cuenta?{" "}
          <Link
            to="/register"
            className="font-semibold text-white underline underline-offset-4 transition hover:text-[#b8c4d9]"
          >
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
}

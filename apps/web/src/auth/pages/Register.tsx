import { useMemo, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import fondoLogin from "../../assets/Fondo_Login.webp";
import logoMusicFlow from "../../assets/Logo_Music_Flow.webp";
import { register as registerRequest } from "../../shared/api/auth";
import { useAuthStore } from "../../shared/stores/authStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const registerMutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      setSession(data);
      navigate("/library");
    },
  });

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const isFormValid = useMemo(() => {
    const trimmedName = name.trim();
    return (
      trimmedName.length >= 3 &&
      trimmedName.length <= 30 &&
      USERNAME_REGEX.test(trimmedName) &&
      EMAIL_REGEX.test(email.trim()) &&
      password.length >= 8 &&
      password === confirmPassword
    );
  }, [confirmPassword, email, name, password]);

  const apiError = registerMutation.isError
    ? axios.isAxiosError(registerMutation.error) &&
      (
        registerMutation.error.response?.data as
          | { message?: string | string[] }
          | undefined
      )?.message
      ? Array.isArray(
          (
            registerMutation.error.response?.data as {
              message: string | string[];
            }
          ).message,
        )
        ? (
            registerMutation.error.response?.data as { message: string[] }
          ).message.join(", ")
        : (registerMutation.error.response?.data as { message: string }).message
      : "No pudimos crear la cuenta."
    : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid || registerMutation.isPending) return;
    registerMutation.mutate({
      email: email.trim(),
      username: name.trim(),
      password,
    });
  }

  const isPending = registerMutation.isPending;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07131a] text-white">
      <img
        src={fondoLogin}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,18,0.4)_0%,rgba(8,10,15,0.7)_55%,rgba(7,10,14,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(169,177,203,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(18,226,244,0.14),transparent_32%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-5">
        <div className="mb-5 flex flex-col items-center">
          <img
            src={logoMusicFlow}
            alt="MusicFlow"
            className="h-16 w-auto object-contain drop-shadow-[0_0_24px_rgba(20,227,247,0.18)]"
          />
        </div>

        <div className="w-full max-w-[370px] rounded-[18px] border border-white/10 bg-[rgba(27,28,36,0.9)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <h1 className="text-[1.55rem] font-semibold text-white">
            Nueva Cuenta
          </h1>
          <p className="mb-4 mt-1 text-sm text-[#b8c4d9]">
            Comienza tu viaje sónico profesional.
          </p>

          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="sr-only">
                Nombre de usuario
              </label>
              <div className="flex h-11 items-center gap-3 rounded-[10px] border border-white/10 bg-[#0f1218] px-4 transition focus-within:border-[#14e3f7]/60 focus-within:ring-2 focus-within:ring-[#14e3f7]/30">
                <UserRound
                  className="h-4 w-4 text-[#9aa6bf]"
                  aria-hidden="true"
                />
                <input
                  id="name"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="Nombre de usuario"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isPending}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8590a8] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <div className="flex h-11 items-center gap-3 rounded-[10px] border border-white/10 bg-[#0f1218] px-4 transition focus-within:border-[#14e3f7]/60 focus-within:ring-2 focus-within:ring-[#14e3f7]/30">
                <Mail className="h-4 w-4 text-[#9aa6bf]" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
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
              <div className="flex h-11 items-center gap-3 rounded-[10px] border border-white/10 bg-[#0f1218] px-4 transition focus-within:border-[#14e3f7]/60 focus-within:ring-2 focus-within:ring-[#14e3f7]/30">
                <Lock className="h-4 w-4 text-[#9aa6bf]" aria-hidden="true" />
                <input
                  id="password"
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
                  className="-mr-2 flex h-9 w-9 items-center justify-center rounded-md text-[#9aa6bf] transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#14e3f7]/40"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirmar contraseña
              </label>
              <div className="flex h-11 items-center gap-3 rounded-[10px] border border-white/10 bg-[#0f1218] px-4 transition focus-within:border-[#14e3f7]/60 focus-within:ring-2 focus-within:ring-[#14e3f7]/30">
                <ShieldCheck
                  className="h-4 w-4 text-[#9aa6bf]"
                  aria-hidden="true"
                />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isPending}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8590a8] disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((current) => !current)}
                  aria-label={
                    showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="-mr-2 flex h-9 w-9 items-center justify-center rounded-md text-[#9aa6bf] transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#14e3f7]/40"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {passwordMismatch && (
              <p
                role="alert"
                aria-live="polite"
                className="text-xs text-amber-200"
              >
                Las contraseñas no coinciden.
              </p>
            )}
            {password.length > 0 && password.length < 8 && (
              <p
                role="alert"
                aria-live="polite"
                className="text-xs text-amber-200"
              >
                Mínimo 8 caracteres.
              </p>
            )}
            {apiError && (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-200"
              >
                {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className={`mt-1 flex h-[49px] w-full items-center justify-center gap-2 rounded-[11px] text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#14e3f7]/60 focus:ring-offset-2 focus:ring-offset-[#1b1c24] ${
                isFormValid && !isPending
                  ? "bg-[#14e3f7] text-[#0a3037] shadow-[0_0_24px_rgba(20,227,247,0.28)] hover:bg-[#3ceaf9]"
                  : "cursor-not-allowed bg-[#2a303a] text-[#9aa3b5]"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 border-t border-white/10 pt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white underline underline-offset-4 transition hover:text-[#b8c4d9]"
            >
              Ya tengo una cuenta, Iniciar sesión
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

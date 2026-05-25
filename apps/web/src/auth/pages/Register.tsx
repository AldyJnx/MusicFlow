import { useMemo, useState } from "react";
import {
  ArrowRight,
  Eye,
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

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length >= 8 &&
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07131a] text-white">
      <img
        src={fondoLogin}
        alt="Fondo MusicFlow"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,18,0.4)_0%,rgba(8,10,15,0.7)_55%,rgba(7,10,14,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(169,177,203,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(18,226,244,0.14),transparent_32%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-5">
        <div className="mb-5 flex flex-col items-center">
          <img
            src={logoMusicFlow}
            alt="MusicFlow"
            className="mb-2 h-16 w-auto object-contain drop-shadow-[0_0_24px_rgba(20,227,247,0.18)]"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d8e1ef]">
            MusicFlow
          </p>
        </div>

        <div className="w-full max-w-[370px] rounded-[18px] border border-white/10 bg-[rgba(27,28,36,0.9)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <h1 className="text-[1.55rem] font-semibold text-white">
            Nueva Cuenta
          </h1>
          <p className="mb-4 mt-1 text-sm text-[#9ca7ba]">
            Comienza tu viaje sónico profesional.
          </p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="mb-2 flex items-center gap-2 text-[0.84rem] font-semibold text-[#8ea4d6]"
              >
                <UserRound className="h-4 w-4" />
                Nombre completo
              </label>
              <div className="flex h-11 items-center rounded-[10px] border border-white/8 bg-[#2a2a30] px-4">
                <input
                  id="name"
                  type="text"
                  placeholder="Ej. Alex Rivera"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6e7280]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 flex items-center gap-2 text-[0.84rem] font-semibold text-[#8ea4d6]"
              >
                <Mail className="h-4 w-4" />
                Email
              </label>
              <div className="flex h-11 items-center rounded-[10px] border border-white/8 bg-[#2a2a30] px-4">
                <input
                  id="email"
                  type="email"
                  placeholder="estudio@musicflow.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6e7280]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 flex items-center gap-2 text-[0.84rem] font-semibold text-[#8ea4d6]"
              >
                <Lock className="h-4 w-4" />
                Contraseña
              </label>
              <div className="flex h-11 items-center gap-3 rounded-[10px] border border-white/8 bg-[#2a2a30] px-4">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6e7280]"
                />
                <button
                  type="button"
                  className="text-[#7f8594] transition hover:text-[#d4d9e2]"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 flex items-center gap-2 text-[0.84rem] font-semibold text-[#8ea4d6]"
              >
                <ShieldCheck className="h-4 w-4" />
                Confirmar contraseña
              </label>
              <div className="flex h-11 items-center rounded-[10px] border border-white/8 bg-[#2a2a30] px-4">
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6e7280]"
                />
              </div>
            </div>

            {passwordMismatch && (
              <p className="text-xs text-amber-300">
                Las contraseñas no coinciden.
              </p>
            )}
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-amber-300">Mínimo 8 caracteres.</p>
            )}
            {apiError && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={!isFormValid || registerMutation.isPending}
              className={`mt-1 flex h-[49px] w-full items-center justify-center gap-2 rounded-[11px] text-base font-semibold transition ${
                isFormValid && !registerMutation.isPending
                  ? "bg-[#14e3f7] text-[#0a3037] shadow-[0_0_24px_rgba(20,227,247,0.28)] hover:bg-[#3ceaf9]"
                  : "cursor-not-allowed bg-[#2a303a] text-[#788395]"
              }`}
            >
              {registerMutation.isPending ? (
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

          <div className="mt-4 border-t border-white/6 pt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#d9deea] transition hover:text-white"
            >
              Ya tengo una cuenta, Iniciar sesión
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

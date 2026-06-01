import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import fondoLogin from "../../assets/Fondo_Login.webp";
import logoMusicFlow from "../../assets/Logo_Music_Flow.webp";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const isFormValid = useMemo(() => email.trim().length > 0, [email]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    navigate("/verify-code");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07131a] text-white">
      <img
        src={fondoLogin}
        alt="Fondo MusicFlow"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,15,0.42)_0%,rgba(8,10,15,0.72)_55%,rgba(7,10,14,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,233,255,0.08),transparent_32%),radial-gradient(circle_at_bottom,rgba(92,107,132,0.1),transparent_34%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <div className="mb-6 flex flex-col items-center">
          <img
            src={logoMusicFlow}
            alt="MusicFlow"
            className="mb-3 h-20 w-auto object-contain drop-shadow-[0_0_24px_rgba(22,212,255,0.18)]"
          />
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#10e9ff]">
            Professional Audio Studio
          </p>
        </div>

        <div className="w-full max-w-[360px] rounded-[18px] border border-white/10 bg-[rgba(24,27,35,0.92)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-md">
          <h1 className="text-center text-[1.75rem] font-semibold text-white">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="mx-auto mb-7 mt-3 max-w-[270px] text-center text-[1rem] leading-7 text-[#b8c0d1]">
            No te preocupes. Introduce tu correo electrónico y te enviaremos
            instrucciones para restablecerla.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[0.84rem] font-semibold text-[#d5deef]"
              >
                Correo electrónico
              </label>
              <div className="flex h-12 items-center gap-3 rounded-[10px] border border-white/8 bg-[#2a2a30] px-4">
                <Mail className="h-4 w-4 text-[#7f889c]" />
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@estudio.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6e7280]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[11px] border text-[0.83rem] font-semibold uppercase tracking-[0.05em] transition ${
                isFormValid
                  ? "border-[#11dbef] bg-[#14e3f7] text-[#093038] shadow-[0_0_24px_rgba(20,227,247,0.3)] hover:bg-[#38e8f8]"
                  : "cursor-not-allowed border-white/8 bg-[#2a303a] text-[#788395]"
              }`}
            >
              Enviar enlace de recuperación
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-white/8 pt-5 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#10e9ff] transition hover:text-[#5ef1ff]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-white/25">
          © 2024 MusicFlow Studio Systems. All Rights Reserved.
        </p>
      </section>
    </main>
  );
}

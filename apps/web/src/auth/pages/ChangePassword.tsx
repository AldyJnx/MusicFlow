import { useMemo, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import fondoLogin from '../../assets/Fondo_Login.png'
import logoMusicFlow from '../../assets/Logo_Music_Flow.png'

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isFormValid = useMemo(() => {
    return (
      password.trim().length > 0 &&
      confirmPassword.trim().length > 0 &&
      password === confirmPassword
    )
  }, [confirmPassword, password])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07131a] text-white">
      <img
        src={fondoLogin}
        alt="Fondo MusicFlow"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,15,0.42)_0%,rgba(8,10,15,0.72)_55%,rgba(7,10,14,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(35,86,255,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(18,226,244,0.12),transparent_32%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-4">
        <div className="mb-3 flex flex-col items-center">
          <img
            src={logoMusicFlow}
            alt="MusicFlow"
            className="mb-2 h-14 w-auto object-contain drop-shadow-[0_0_24px_rgba(22,212,255,0.18)]"
          />
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#10e9ff]">
            MusicFlow
          </p>
        </div>

        <div className="w-full max-w-[360px] rounded-[18px] border border-white/10 bg-[rgba(24,27,35,0.92)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-md">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/20">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-center text-[1.15rem] font-semibold text-white">
            Código verificado con éxito
          </h1>
          <p className="mx-auto mb-5 mt-2 max-w-[258px] text-center text-[0.93rem] leading-7 text-[#b8c0d1]">
            Por favor, ingresa tu nueva contraseña a continuación para asegurar tu cuenta.
          </p>

          <form className="space-y-3.5">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[0.84rem] font-semibold text-[#d5deef]"
              >
                Nueva Contraseña
              </label>
              <div className="flex h-10 items-center gap-3 rounded-[10px] border border-white/8 bg-[#101218] px-4">
                <Lock className="h-4 w-4 text-[#7f889c]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6e7280]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-[#7f889c] transition hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-[0.84rem] font-semibold text-[#d5deef]"
              >
                Confirmar Nueva Contraseña
              </label>
              <div className="flex h-10 items-center gap-3 rounded-[10px] border border-white/8 bg-[#101218] px-4">
                <Lock className="h-4 w-4 text-[#7f889c]" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6e7280]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="text-[#7f889c] transition hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex h-[48px] w-full items-center justify-center rounded-[11px] border text-sm font-semibold transition ${
                isFormValid
                  ? 'border-[#5b93ff] bg-[#5b93ff] text-[#10223f] shadow-[0_0_24px_rgba(91,147,255,0.28)] hover:bg-[#74a4ff]'
                  : 'cursor-not-allowed border-white/8 bg-[#2a303a] text-[#788395]'
              }`}
            >
              Restablecer Contraseña
            </button>
          </form>

          <div className="mt-4 border-t border-white/8 pt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#10e9ff] transition hover:text-[#5ef1ff]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-[0.7rem] font-medium uppercase tracking-[0.08em] text-white/20">
          Protección de datos de nivel estudio © 2024
          <br />
          MusicFlow Inc.
        </p>
      </section>
    </main>
  )
}

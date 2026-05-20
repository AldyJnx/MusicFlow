import { useMemo, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import fondoLogin from '../../assets/Fondo_Login.png'
import logoMusicFlow from '../../assets/Logo_Music_Flow.png'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isFormValid = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0
  }, [email, password])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isFormValid) {
      return
    }

    navigate('/library')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07131a] text-white">
      <img
        src={fondoLogin}
        alt="Fondo MusicFlow"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,11,18,0.28)_0%,rgba(4,10,16,0.58)_55%,rgba(3,8,14,0.84)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,233,255,0.1),transparent_36%),radial-gradient(circle_at_bottom,rgba(17,205,233,0.1),transparent_30%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <div className="mb-7 flex flex-col items-center">
          <img
            src={logoMusicFlow}
            alt="MusicFlow"
            className="mb-3 h-20 w-auto object-contain drop-shadow-[0_0_24px_rgba(22,212,255,0.18)]"
          />
          <p className="text-sm tracking-[0.08em] text-[#7c8aa6]">
            MusicFlow
          </p>
        </div>

        <div className="w-full max-w-[360px] rounded-[18px] border border-white/10 bg-[rgba(24,27,35,0.9)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <h1 className="mb-6 text-[1.7rem] font-semibold text-white">
            Bienvenido de nuevo
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#4f5a71]"
              >
                Correo electrónico
              </label>
              <div className="flex h-12 items-center gap-3 rounded-[10px] border border-white/10 bg-[#0f1218] px-4">
                <Mail className="h-4 w-4 text-[#747f96]" />
                <input
                  id="email"
                  type="email"
                  placeholder="nombre@estudio.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#59647b]"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#4f5a71]"
                >
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[0.72rem] font-semibold text-[#10e9ff] transition hover:text-[#66f0ff]"
                >
                  ¿Olvidé mi contraseña?
                </Link>
              </div>
              <div className="flex h-12 items-center gap-3 rounded-[10px] border border-white/10 bg-[#0f1218] px-4">
                <Lock className="h-4 w-4 text-[#747f96]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#59647b]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-[#747f96] transition hover:text-[#c2d7df]"
                >
                  {showPassword ? (
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
              className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[11px] text-base font-semibold transition ${
                isFormValid
                  ? 'bg-[#14e3f7] text-[#092d35] shadow-[0_0_24px_rgba(20,227,247,0.28)] hover:bg-[#3ceaf9]'
                  : 'cursor-not-allowed bg-[#2a303a] text-[#788395]'
              }`}
            >
              Iniciar Sesión
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-[#dde5ef]">
          ¿No tienes una cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#10e9ff] transition hover:text-[#66f0ff]"
          >
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  )
}

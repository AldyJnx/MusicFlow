import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import fondoLogin from '../../assets/Fondo_Login.png'
import logoMusicFlow from '../../assets/Logo_Music_Flow.png'

export default function VerifyCode() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])

  const isFormValid = useMemo(
    () => digits.every((digit) => digit.trim().length === 1),
    [digits],
  )

  function handleDigitChange(index: number, value: string) {
    const nextValue = value.replace(/\D/g, '').slice(-1)
    setDigits((current) =>
      current.map((digit, currentIndex) =>
        currentIndex === index ? nextValue : digit,
      ),
    )

    if (nextValue && index < digits.length - 1) {
      const nextInput = document.getElementById(
        `verify-digit-${index + 1}`,
      ) as HTMLInputElement | null
      nextInput?.focus()
      nextInput?.select()
    }
  }

  function handleDigitKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const previousInput = document.getElementById(
        `verify-digit-${index - 1}`,
      ) as HTMLInputElement | null
      previousInput?.focus()
      previousInput?.select()
    }
  }

  function handleVerify() {
    if (!isFormValid) {
      return
    }

    navigate('/change-password')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07131a] text-white">
      <img
        src={fondoLogin}
        alt="Fondo MusicFlow"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,15,0.5)_0%,rgba(8,10,15,0.76)_55%,rgba(7,10,14,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,233,255,0.06),transparent_28%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_20%,transparent_36%,transparent_64%,rgba(255,255,255,0.03)_82%,transparent_100%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-[418px] rounded-[22px] border border-white/8 bg-[rgba(24,27,35,0.94)] px-10 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-md">
          <div className="mb-7 flex items-center justify-center gap-3">
            <img
              src={logoMusicFlow}
              alt="MusicFlow"
              className="h-9 w-auto object-contain"
            />
            <span className="text-lg font-semibold text-white">MusicFlow</span>
          </div>

          <h1 className="text-center text-[1.55rem] font-semibold text-white">
            Te hemos enviado un código
          </h1>
          <p className="mx-auto mb-8 mt-3 max-w-[280px] text-center text-[0.98rem] leading-7 text-[#8f96a8]">
            Introduce el código de 6 dígitos que enviamos a tu correo
            electrónico para continuar.
          </p>

          <div className="mb-8 flex items-center justify-center gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                id={`verify-digit-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handleDigitChange(index, event.target.value)}
                onKeyDown={(event) => handleDigitKeyDown(index, event)}
                className="h-14 w-14 rounded-[12px] border border-white/10 bg-white text-center text-xl font-semibold text-[#111827] outline-none transition focus:border-[#12dff2] focus:bg-white"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!isFormValid}
            className={`flex h-[50px] w-full items-center justify-center gap-2 rounded-[11px] border text-[0.83rem] font-semibold uppercase tracking-[0.05em] transition ${
              isFormValid
                ? 'border-[#11dbef] bg-[#14e3f7] text-[#093038] shadow-[0_0_24px_rgba(20,227,247,0.3)] hover:bg-[#38e8f8]'
                : 'cursor-not-allowed border-white/8 bg-[#2a303a] text-[#788395]'
            }`}
          >
            Verificar código
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-8 text-center">
            <button
              type="button"
              className="text-sm font-semibold text-[#10e9ff] transition hover:text-[#5ef1ff]"
            >
              Reenviar código
            </button>
          </div>

          <div className="mt-3 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#b9c3d7] transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        <p className="mt-8 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white/25">
          Secure access system v2.4
        </p>
      </section>
    </main>
  )
}

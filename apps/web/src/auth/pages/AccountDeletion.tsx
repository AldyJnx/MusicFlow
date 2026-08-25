import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export default function AccountDeletion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!confirmed || pending) return;
    setPending(true);
    setMessage(null);
    try {
      const session = await axios.post<{ accessToken: string }>(
        `${apiUrl}/auth/login`,
        { email: email.trim(), password },
      );
      await axios.delete(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${session.data.accessToken}` },
      });
      setMessage("Tu cuenta y sus datos fueron eliminados correctamente.");
      setPassword("");
    } catch {
      setMessage("No pudimos validar la cuenta. Revisa tus credenciales.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07131a] px-5 py-12 text-white">
      <section className="mx-auto max-w-lg">
        <Link to="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          Volver a MusicFlow
        </Link>
        <h1 className="mt-8 text-3xl font-bold">Eliminar cuenta</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          La cuenta y los datos asociados se eliminaran inmediatamente. Los
          registros que deban conservarse por obligacion legal se trataran segun
          la politica de privacidad.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium" htmlFor="delete-email">
            Correo electronico
          </label>
          <input
            id="delete-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-md border border-white/15 bg-white/5 px-4 outline-none focus:border-cyan-400"
          />
          <label
            className="block text-sm font-medium"
            htmlFor="delete-password"
          >
            Contrasena
          </label>
          <input
            id="delete-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-md border border-white/15 bg-white/5 px-4 outline-none focus:border-cyan-400"
          />
          <label className="flex gap-3 text-sm leading-5 text-slate-200">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1"
            />
            Entiendo que perdere acceso a mis bibliotecas, preferencias y
            configuraciones de MusicFlow.
          </label>
          <button
            type="submit"
            disabled={!confirmed || pending}
            className="h-12 w-full rounded-md bg-red-500 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Procesando..." : "Eliminar mi cuenta"}
          </button>
          {message && (
            <p role="status" className="text-sm text-slate-200">
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

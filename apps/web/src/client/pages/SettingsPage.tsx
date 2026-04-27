import ClientLayout from '../layout/ClientLayout'

export default function SettingsPage() {
  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(126,77,255,0.1),transparent_26%),linear-gradient(180deg,#090a13_0%,#090913_100%)] px-7 py-7 text-slate-100 xl:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-fuchsia-200/70">
            Settings
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-[48px]">
            App settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Esta pagina aun esta por construirse, pero la ruta del cliente ya quedo lista.
          </p>
        </div>
      </section>
    </ClientLayout>
  )
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  getAvailableArtists,
  requestArtistAccess,
  type ArtistAccessRequest,
} from "../../shared/api/artist-portal";

function messageFromRequestError(error: unknown): string {
  const response = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const message = response.response?.data?.message;
  return Array.isArray(message)
    ? message.join(". ")
    : (message ?? "No se pudo enviar la solicitud.");
}

export default function ArtistAccessPage({
  requests,
}: {
  requests: ArtistAccessRequest[];
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [artistId, setArtistId] = useState("");
  const [evidence, setEvidence] = useState("");
  const [links, setLinks] = useState([""]);
  const [document, setDocument] = useState<File>();
  const [documentInputKey, setDocumentInputKey] = useState(0);
  const [message, setMessage] = useState<string>();
  const available = useQuery({
    queryKey: ["artist-portal", "available-artists", search],
    queryFn: () => getAvailableArtists(search),
    enabled: search.trim().length >= 2,
  });
  const submit = useMutation({
    mutationFn: () =>
      requestArtistAccess({
        artistId,
        evidence,
        evidenceLinks: links.map((link) => link.trim()).filter(Boolean),
        document,
      }),
    onSuccess: () => {
      setMessage(
        "Solicitud enviada. Un administrador verificará tu identidad antes de darte acceso.",
      );
      setArtistId("");
      setSearch("");
      setEvidence("");
      setLinks([""]);
      setDocument(undefined);
      setDocumentInputKey((value) => value + 1);
      queryClient.invalidateQueries({ queryKey: ["artist-portal", "context"] });
    },
    onError: (error: unknown) => setMessage(messageFromRequestError(error)),
  });
  const validLinks = links.map((link) => link.trim()).filter(Boolean);
  const canSubmit = Boolean(
    artistId && (validLinks.length || document) && !submit.isPending,
  );

  return (
    <main className="min-h-screen bg-[#080b13] px-6 py-12 text-white">
      <section className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          MusicFlow for Artists
        </p>
        <h1 className="mt-3 text-4xl font-black">
          Solicita acceso a tu perfil artístico
        </h1>
        <p className="mt-3 max-w-3xl text-slate-400">
          El perfil ya existe en el catálogo y no se crea una identidad nueva.
          Envía enlaces oficiales y, si lo deseas, un PDF que permita al equipo
          confirmar que representas a ese artista.
        </p>
        {requests.length ? (
          <div className="mt-8 space-y-3">
            {requests.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                {item.status === "REJECTED" ? (
                  <X className="h-5 w-5 text-rose-300" />
                ) : (
                  <Clock3 className="h-5 w-5 text-amber-300" />
                )}
                <div className="flex-1">
                  <p className="font-bold">{item.artist.name}</p>
                  <p className="text-sm text-slate-400">
                    {item.status === "PENDING"
                      ? "Solicitud en revisión. El tiempo estimado de respuesta es de hasta 7 días."
                      : item.status === "REJECTED"
                        ? "La solicitud fue rechazada. Puedes enviar una nueva con evidencias adicionales."
                        : item.status === "APPROVED"
                          ? "Solicitud aprobada. Redirigiendo al Portal Artista..."
                          : "Solicitud cancelada."}
                  </p>
                  {item.status === "REJECTED" && item.reviewNote ? (
                    <p className="mt-1 text-sm text-rose-200">
                      Motivo: {item.reviewNote}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) submit.mutate();
          }}
          className="mt-10 max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div>
            <label className="text-sm font-bold">
              Busca el artista del catálogo
            </label>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setArtistId("");
              }}
              placeholder="Ej. Dua Lipa"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-cyan-300"
            />
            {!artistId && available.data?.length ? (
              <div className="mt-2 max-h-48 overflow-auto rounded-xl border border-white/10 bg-[#101522]">
                {available.data.map((artist) => (
                  <button
                    type="button"
                    key={artist.id}
                    onClick={() => {
                      setArtistId(artist.id);
                      setSearch(artist.name);
                    }}
                    className="block w-full px-4 py-3 text-left hover:bg-white/10"
                  >
                    {artist.name}
                  </button>
                ))}
              </div>
            ) : null}
            {artistId ? (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
                <span>Perfil seleccionado: {search}</span>
                <button
                  type="button"
                  onClick={() => {
                    setArtistId("");
                    setSearch("");
                  }}
                  className="rounded-md px-2 py-1 font-bold hover:bg-white/10"
                >
                  Cambiar
                </button>
              </div>
            ) : null}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">Enlaces oficiales</label>
              <button
                type="button"
                onClick={() => setLinks([...links, ""])}
                className="inline-flex items-center gap-1 text-sm text-cyan-300"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Red social verificada, canal de YouTube, sitio oficial u otra
              fuente pública.
            </p>
            <div className="mt-2 space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(event) =>
                      setLinks(
                        links.map((value, itemIndex) =>
                          itemIndex === index ? event.target.value : value,
                        ),
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-cyan-300"
                  />
                  {links.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLinks(
                          links.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="rounded-xl border border-white/10 px-3 text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold">
              Documento PDF (opcional)
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-4 text-sm text-slate-300">
              <FileText className="h-5 w-5 text-cyan-300" />
              <span>
                {document
                  ? document.name
                  : "Adjunta una prueba de representación, máximo 5 MB"}
              </span>
              <input
                key={documentInputKey}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => setDocument(event.target.files?.[0])}
              />
            </label>
          </div>
          <div>
            <label className="text-sm font-bold">
              Mensaje para el equipo (opcional)
            </label>
            <textarea
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Explica tu relación con el artista o sello."
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-cyan-300"
            />
          </div>
          {message ? (
            <p className="rounded-xl bg-cyan-400/10 p-3 text-sm text-cyan-100">
              {message}
            </p>
          ) : null}
          <button
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck className="h-4 w-4" />
            {submit.isPending
              ? "Enviando..."
              : "Enviar solicitud de verificación"}
          </button>
        </form>
        <div className="mt-6 flex max-w-3xl gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-slate-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
          Aprobar una solicitud crea una membresía sobre el perfil existente. La
          cuenta nunca se convierte automáticamente en el artista ni puede
          aprobarse a sí misma.
        </div>
      </section>
    </main>
  );
}

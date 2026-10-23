import { useRef, useState, type FormEvent, type PointerEvent } from "react";
import { Bot, Loader2, SendHorizontal, X } from "lucide-react";
import { askCatalogAiAssistant } from "../../shared/api/admin";

type Message = { role: "assistant" | "admin"; text: string };

function errorMessage(error: unknown) {
  const response = error as { response?: { data?: { message?: string } } };
  return (
    response.response?.data?.message ??
    "No se pudo consultar NVIDIA. Verifica la configuración del backend e intenta nuevamente."
  );
}

/** Floating, admin-only entry point. The API still enforces JWT + ADMIN. */
export default function AdminNvidiaAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
    moved: boolean;
  } | null>(null);
  const didDragRef = useRef(false);
  // The panel is anchored to the button itself, never to the document corner.
  // This prevents a dragged launcher from making FlowIA re-open at a stale
  // coordinate or pushing the launcher away from its final position.
  const panelOpensBelow =
    position !== null && position.top < Math.min(640, window.innerHeight - 200);
  const panelAlignsRight =
    position !== null && position.left + 390 > window.innerWidth - 16;

  function dragStart(event: PointerEvent<HTMLButtonElement>) {
    didDragRef.current = false;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true;
      didDragRef.current = true;
    }
    if (!drag.moved) return;
    const edge = 16;
    const size = 56;
    setPosition({
      left: Math.min(
        Math.max(edge, drag.originLeft + deltaX),
        window.innerWidth - size - edge,
      ),
      top: Math.min(
        Math.max(edge, drag.originTop + deltaY),
        window.innerHeight - size - edge,
      ),
    });
  }

  function dragEnd(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || sending) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "admin", text }]);
    setSending(true);
    try {
      const reply = await askCatalogAiAssistant(text);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: reply.answer },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: errorMessage(error) },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`fixed z-[100] h-14 w-14 ${position ? "" : "bottom-6 right-6"}`}
      style={position ?? undefined}
    >
      {open ? (
        <section
          aria-label="FlowIA"
          className={`absolute flex h-[min(620px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_70px_rgba(0,0,0,.48)] ${panelOpensBelow ? "top-[68px]" : "bottom-[68px]"} ${panelAlignsRight ? "right-0" : "left-0"}`}
        >
          <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <span className="rounded-xl bg-[var(--color-primary)]/15 p-2 text-[var(--color-primary)]">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[var(--color-text)]">
                FlowIA
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Asistente administrativo de MusicFlow
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
              aria-label="Cerrar FlowIA"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div
            className="flex-1 space-y-3 overflow-y-auto p-4"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <p
                key={`${message.role}-${index}`}
                className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-5 ${message.role === "admin" ? "ml-auto bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-alt)] text-[var(--color-text)]"}`}
              >
                {message.text}
              </p>
            ))}
            {sending ? (
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" /> Consultando NVIDIA…
              </div>
            ) : null}
          </div>
          <form
            onSubmit={submit}
            className="flex items-end gap-2 border-t border-[var(--color-border)] p-3"
          >
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.altKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={600}
              rows={2}
              placeholder="Pregunta sobre MusicFlow…"
              className="min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="submit"
              disabled={!question.trim() || sending}
              className="rounded-xl bg-[var(--color-primary)] p-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Enviar pregunta"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onPointerDown={dragStart}
        onPointerMove={dragMove}
        onPointerUp={dragEnd}
        onPointerCancel={dragEnd}
        onClick={() => {
          if (didDragRef.current) {
            didDragRef.current = false;
            return;
          }
          setOpen((current) => !current);
        }}
        className="flex h-14 w-14 touch-none cursor-grab items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_14px_35px_rgba(0,0,0,.42)] transition hover:scale-105 active:cursor-grabbing"
        aria-label="Abrir FlowIA"
        title="FlowIA"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
}

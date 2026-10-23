import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type NoticeTone = "success" | "error";
type Notice = { message: string; tone: NoticeTone; id: number };
const eventName = "musicflow:action-notice";

export function showActionNotice(
  message: string,
  tone: NoticeTone = "success",
) {
  window.dispatchEvent(
    new CustomEvent<Notice>(eventName, {
      detail: { message, tone, id: Date.now() },
    }),
  );
}

/** A branded, centered acknowledgement for completed admin actions. */
export default function ActionNoticeViewport() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const onNotice = (event: Event) => {
      const next = (event as CustomEvent<Notice>).detail;
      setNotice(next);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setNotice(null), 2800);
    };
    window.addEventListener(eventName, onNotice);
    return () => {
      window.removeEventListener(eventName, onNotice);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!notice) return null;
  const success = notice.tone === "success";
  const Icon = success ? CheckCircle2 : XCircle;
  return (
    <div
      className="pointer-events-none fixed left-1/2 top-7 z-[200] -translate-x-1/2 animate-[fadeIn_.2s_ease-out]"
      role="status"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-[0_18px_50px_rgba(0,0,0,.45)] backdrop-blur-xl ${
          success
            ? "border-emerald-400/45 bg-[linear-gradient(135deg,rgba(16,185,129,.28),rgba(10,11,22,.94))] text-emerald-50"
            : "border-rose-400/45 bg-[linear-gradient(135deg,rgba(244,63,94,.28),rgba(10,11,22,.94))] text-rose-50"
        }`}
      >
        <Icon
          className={
            success ? "h-5 w-5 text-emerald-300" : "h-5 w-5 text-rose-300"
          }
        />
        <span>{notice.message}</span>
      </div>
    </div>
  );
}

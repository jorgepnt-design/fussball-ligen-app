import { Bell, BellOff, Send } from "lucide-react";
import type { PushApi } from "../hooks/usePush";

// Schaltet Tor-Benachrichtigungen (Web-Push) ein/aus und bietet einen Test-Knopf.
export function NotificationToggle({ push }: { push: PushApi }) {
  if (!push.supported) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => (push.enabled ? push.disable() : push.enable())}
        disabled={push.busy}
        aria-pressed={push.enabled}
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${push.enabled ? "border-gold bg-gold/15 text-gold" : "border-white/15 bg-night text-white/80 hover:text-white"}`}
      >
        {push.enabled ? <Bell size={16} aria-hidden /> : <BellOff size={16} aria-hidden />}
        {push.busy ? "…" : push.enabled ? "Tor-Alarm an" : "Tor-Alarm"}
      </button>
      {push.enabled && (
        <button
          type="button"
          onClick={() => push.test()}
          title="Test-Benachrichtigung senden"
          className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-night px-2.5 py-2 text-xs font-bold text-white/70 transition-colors hover:text-white"
        >
          <Send size={14} aria-hidden /> Test
        </button>
      )}
    </div>
  );
}

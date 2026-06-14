import { Bell, BellOff } from "lucide-react";

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

// Schaltet Tor-Benachrichtigungen ein/aus und holt bei Bedarf die Browser-Erlaubnis.
export function NotificationToggle({ enabled, onChange }: Props) {
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  const toggle = async () => {
    if (enabled) {
      onChange(false);
      return;
    }
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission === "granted") {
      onChange(true);
      try {
        new Notification("🔔 Tor-Benachrichtigungen aktiv", {
          body: "Du wirst bei Toren deiner markierten Vereine benachrichtigt – solange die App geöffnet ist.",
          icon: `${import.meta.env.BASE_URL}icon-192.png`,
        });
      } catch {
        /* ignore */
      }
    } else {
      onChange(false);
      alert("Benachrichtigungen sind im Browser blockiert. Bitte erlaube sie in den Browser-Einstellungen für diese Seite.");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition-colors ${enabled ? "border-gold bg-gold/15 text-gold" : "border-white/15 bg-night text-white/80 hover:text-white"}`}
    >
      {enabled ? <Bell size={16} aria-hidden /> : <BellOff size={16} aria-hidden />}
      {enabled ? "Tor-Alarm an" : "Tor-Alarm"}
    </button>
  );
}

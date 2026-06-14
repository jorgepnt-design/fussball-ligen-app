import { useCallback, useEffect, useState } from "react";
import { PUSH_BASE_URL, VAPID_PUBLIC_KEY } from "../config/push";

const isSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const urlBase64ToUint8Array = (base64: string): Uint8Array<ArrayBuffer> => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

const getRegistration = async (): Promise<ServiceWorkerRegistration> => {
  const existing = await navigator.serviceWorker.getRegistration();
  const reg = existing ?? (await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`));
  await navigator.serviceWorker.ready;
  return reg;
};

const getSubscription = async (): Promise<PushSubscription | null> => {
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
};

const postJson = (path: string, body: unknown) =>
  fetch(`${PUSH_BASE_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export interface PushApi {
  supported: boolean;
  enabled: boolean;
  busy: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  test: () => Promise<void>;
}

// Verwaltet das Web-Push-Abo (für Tor-Benachrichtigungen, auch bei geschlossener App).
// `teams` = zu beobachtende Vereinsnamen; bei Änderung wird das Abo aktualisiert.
export function usePush(teams: string[]): PushApi {
  const supported = isSupported();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const teamsKey = teams.join("|");

  // Bestehendes Abo beim Start erkennen.
  useEffect(() => {
    if (!supported) return;
    getSubscription()
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, [supported]);

  const enable = useCallback(async () => {
    if (!supported) {
      alert("Push wird hier nicht unterstützt. Auf dem iPhone: in Safari über Teilen und Zum Home-Bildschirm installieren, dann dort aktivieren.");
      return;
    }
    setBusy(true);
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Benachrichtigungen wurden nicht erlaubt. Bitte im Browser für diese Seite erlauben.");
        return;
      }
      const reg = await getRegistration();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
      await postJson("/subscribe", { subscription: sub.toJSON(), teams });
      setEnabled(true);
    } catch (e) {
      alert("Konnte Tor-Alarm nicht aktivieren: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }, [supported, teams]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const sub = await getSubscription();
      if (sub) {
        await postJson("/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setEnabled(false);
    } finally {
      setBusy(false);
    }
  }, []);

  const test = useCallback(async () => {
    const sub = await getSubscription();
    if (!sub) {
      alert("Bitte zuerst den Tor-Alarm aktivieren.");
      return;
    }
    const res = await postJson("/test", { subscription: sub.toJSON() })
      .then((r) => r.json())
      .catch(() => ({ ok: false }));
    if (!res.ok) alert(`Test-Push fehlgeschlagen (Status ${res.status ?? "?"}). Auf dem iPhone klappt Push nur als installierte App.`);
  }, []);

  // Beobachtete Vereine aktualisieren, solange aktiv.
  useEffect(() => {
    if (!enabled || !supported) return;
    getSubscription()
      .then((sub) => {
        if (sub) postJson("/subscribe", { subscription: sub.toJSON(), teams }).catch(() => {});
      })
      .catch(() => {});
    // teamsKey deckt Änderungen der Vereinsliste ab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamsKey, enabled, supported]);

  return { supported, enabled, busy, enable, disable, test };
}

/* Service Worker für Tor-Push. Zeigt Benachrichtigungen auch bei geschlossener App. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "⚽ Tor!", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    (async () => {
      // Ist die App gerade sichtbar offen, übernimmt die In-App-Benachrichtigung (kein Doppel).
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((c) => c.visibilityState === "visible")) return;
      await self.registration.showNotification(data.title || "⚽ Tor!", {
        body: data.body || "",
        icon: "/fussball-ligen-app/icon-192.png",
        badge: "/fussball-ligen-app/icon-192.png",
        tag: data.tag,
        data: { url: data.url || "/fussball-ligen-app/" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/fussball-ligen-app/";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of windows) if (c.url.includes("/fussball-ligen-app") && "focus" in c) return c.focus();
      return self.clients.openWindow(url);
    })(),
  );
});

# Push-Worker (Tor-Benachrichtigungen)

Cloudflare-Worker, der Web-Push-Abos verwaltet und per Cron (jede Minute) OpenLigaDB
(bl1/bl2) auf neue Tore prüft und Push verschickt. **Nur deutsche Ligen** haben Live-Spiele.

Live: `https://ligen-push.jorge-ligen.workers.dev` (Account jorge-ligen, gleiche Subdomain wie der Proxy).

## Dateien
- `src/worker.js` – Endpunkte `/subscribe`, `/unsubscribe`, `/test` + Cron-Handler (`scheduled`).
- `src/webpush.js` – Web-Push-Krypto (RFC 8291 aes128gcm + RFC 8292 VAPID) mit WebCrypto.
  Gegen den RFC-8291-Testvektor verifiziert: `node test-webpush.mjs`.
- `wrangler.toml` – Cron, KV-Binding (`SUBS`), VAPID-Public + Subject + App-URL.

## Einrichtung (einmalig, ist bereits erledigt)
```bash
cd push
# 1. VAPID-Schlüssel erzeugen (Public kommt in wrangler.toml + ins Frontend src/config/push.ts):
npx web-push generate-vapid-keys --json
# 2. KV-Namespace anlegen, id in wrangler.toml eintragen:
npx wrangler kv namespace create SUBS
# 3. Privaten VAPID-Schlüssel als Secret (NICHT committen!):
printf '<PRIVATE_KEY>' | npx wrangler secret put VAPID_PRIVATE
# 4. Deployen (inkl. Cron):
npx wrangler deploy
```

## Schlüssel rotieren
Neue VAPID-Keys erzeugen → `VAPID_PUBLIC` in `wrangler.toml` **und** `src/config/push.ts`
(Frontend) ersetzen → `VAPID_PRIVATE`-Secret neu setzen → `wrangler deploy` → App neu bauen.
Bestehende Abos werden ungültig (Nutzer müssen den Tor-Alarm einmal neu aktivieren).

## Logs ansehen (zum Debuggen)
```bash
npx wrangler tail
```

## Sicherheit
- Der **private** VAPID-Schlüssel liegt nur als Cloudflare-Secret, nie im Repo.
- KV speichert Push-Abos (`sub:<hash>`) und die zuletzt gesehenen Spielstände (`scores`).

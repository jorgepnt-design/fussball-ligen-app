# Push-Worker (Tor-Benachrichtigungen)

Cloudflare-Worker, der Web-Push-Abos verwaltet und per Cron (jede Minute) OpenLigaDB
(bl1/bl2) auf neue Tore prÃ¼ft und Push verschickt. **Nur deutsche Ligen** haben Live-Spiele.

Live: `https://ligen-push.jorge-ligen.workers.dev` (Account jorge-ligen, gleiche Subdomain wie der Proxy).

## Dateien
- `src/worker.js` â€“ Endpunkte `/subscribe`, `/unsubscribe`, `/test` + Cron-Handler (`scheduled`).
- `src/webpush.js` â€“ Web-Push-Krypto (RFC 8291 aes128gcm + RFC 8292 VAPID) mit WebCrypto.
  Gegen den RFC-8291-Testvektor verifiziert: `node test-webpush.mjs`.
- `wrangler.toml` â€“ Cron, KV-Binding (`SUBS`), VAPID-Public + Subject + App-URL.

## Einrichtung (einmalig, ist bereits erledigt)
```bash
cd push
# 1. VAPID-SchlÃ¼ssel erzeugen (Public kommt in wrangler.toml + ins Frontend src/config/push.ts):
npx web-push generate-vapid-keys --json
# 2. KV-Namespace anlegen, id in wrangler.toml eintragen:
npx wrangler kv namespace create SUBS
# 3. Privaten VAPID-SchlÃ¼ssel als Secret (NICHT committen!):
printf '<PRIVATE_KEY>' | npx wrangler secret put VAPID_PRIVATE
# 4. Deployen (inkl. Cron):
npx wrangler deploy
```

## SchlÃ¼ssel rotieren
Neue VAPID-Keys erzeugen â†’ `VAPID_PUBLIC` in `wrangler.toml` **und** `src/config/push.ts`
(Frontend) ersetzen â†’ `VAPID_PRIVATE`-Secret neu setzen â†’ `wrangler deploy` â†’ App neu bauen.
Bestehende Abos werden ungÃ¼ltig (Nutzer mÃ¼ssen den Tor-Alarm einmal neu aktivieren).

## Logs ansehen (zum Debuggen)
```bash
npx wrangler tail
```

## Sicherheit
- Der **private** VAPID-Schluessel liegt nur als Cloudflare-Secret, nie im Repo.
- KV speichert Push-Abos (`sub:<hash>`), den Abo-Index (`sub:index`) und die zuletzt gesehenen Spielstaende (`scores`).
- Der Cron nutzt kein `KV.list()` mehr. Dadurch wird das kostenlose Cloudflare-Workers-KV-List-Limit nicht taeglich durch den Minutentakt verbraucht.

Wenn alte Abos vor dieser Index-Version gespeichert wurden, muessen Nutzer den Tor-Alarm einmal deaktivieren und wieder aktivieren. Dadurch wird ihr Abo automatisch in `sub:index` uebernommen.

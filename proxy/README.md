# Daten-Proxy (Cloudflare Worker)

Versteckt den API-Football-Key und löst CORS, damit die statische App keybasierte Ligen
(Primeira Liga & alle weiteren) im Browser laden kann.

## Einmalig einrichten

1. **API-Football-Key holen**
   - Konto auf <https://www.api-football.com/> (oder via RapidAPI) anlegen.
   - Free-Tier: 100 Anfragen/Tag. Den `x-apisports-key` kopieren.

2. **Cloudflare-Konto** (kostenlos) anlegen: <https://dash.cloudflare.com/sign-up>

3. **Worker deployen**
   ```bash
   cd proxy
   npm install -g wrangler        # oder: npx wrangler ...
   npx wrangler login
   npx wrangler secret put API_FOOTBALL_KEY   # Key einfügen, Enter
   npx wrangler deploy
   ```

4. Wrangler gibt eine URL aus, z. B. `https://ligen-proxy.dein-name.workers.dev`.
   Diese in die `.env` der App eintragen:
   ```
   VITE_PROXY_BASE_URL=https://ligen-proxy.dein-name.workers.dev
   ```
   Danach App neu starten/bauen.

## Test
```
https://ligen-proxy.dein-name.workers.dev/api/status
```
sollte ein JSON mit deinem Kontingent zurückgeben.

## Sicherheit
- Der Key liegt nur als Cloudflare-Secret, niemals im Frontend.
- Optional kannst du im Worker `Access-Control-Allow-Origin` auf deine GitHub-Pages-Domain
  einschränken, statt `*`.

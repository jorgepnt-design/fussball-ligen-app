# Fussball-Ligen Companion

Spielplan, Tabellen und Torschützen mehrerer Fußball-Ligen in einer App – **Liga Portugal
(Primeira Liga)**, **Bundesliga 1 & 2** und beliebig erweiterbar. Schwesterprojekt der
WM-2026-App, aber für Vereinsligen.

## Funktionen
- Liga- und Saison-Umschalter
- Spielplan (Live, Anstehend, letzte Ergebnisse) mit Vereinslogos
- Tabelle mit internationalen Plätzen / Abstiegszone
- Torschützenliste mit hervorgehobenem Führenden
- Mobil-optimiert, dunkles Design

## Datenquellen
- **Bundesliga 1/2/3:** [OpenLigaDB](https://api.openligadb.de/) – kostenlos, ohne API-Key.
- **Primeira Liga & weitere:** [API-Football](https://www.api-football.com/) über einen
  Cloudflare-Worker-Proxy, der den API-Key versteckt. Einrichtung: [`proxy/README.md`](proxy/README.md).

Ohne konfigurierten Proxy funktionieren die deutschen Ligen sofort; keybasierte Ligen zeigen
einen Hinweis.

## Start
```bash
npm install
npm run dev
```
Optional `.env` aus `.env.example` anlegen und `VITE_PROXY_BASE_URL` setzen (für Primeira Liga).

## Build
```bash
npm run build
```

## Neue Liga hinzufügen
Einen Eintrag in [`src/config/leagues.ts`](src/config/leagues.ts) ergänzen:
- Deutsche Liga → `provider: "openliga"` + `openLigaShortcut`
- Sonstige → `provider: "apifootball"` + `apiFootballId`

## Struktur
```
src/
  config/leagues.ts        Liga-Registry (hier erweitern)
  services/providers/      ein Modul je Datenquelle (LeagueProvider)
  services/leagueService   Fassade für die UI
  hooks/useLeagueData      lädt Spiele/Tabelle/Torschützen
  components/ · pages/      quellenunabhängige UI
proxy/                     Cloudflare-Worker (API-Key + CORS)
```

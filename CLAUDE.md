# CLAUDE.md – Fussball-Ligen Companion

Kontext für Claude Code, damit eine neue Sitzung sofort weiterarbeiten kann.

## Was das ist
Multi-Liga-Fussball-App (Spielplan, Tabelle, Torschützen) – Schwesterprojekt der WM-2026-App
(`wm-2026-companion`), aber für **Vereinsligen**. Besitzer ist Portugal-Fan; Standard-Liga ist
**Liga Portugal (Primeira Liga)**, dazu **Bundesliga 1 & 2**, beliebig erweiterbar.

Stack: Vite + React 19 + TypeScript + Tailwind 3 (identisch zur WM-App). Reines Frontend,
deploybar auf GitHub Pages. Zusätzlich ein **Cloudflare-Worker-Proxy** in `proxy/`.

## Architektur – das Wichtigste
Die UI ist **quellenunabhängig**. Jede Liga hängt an einem Provider, der Rohdaten auf die
normalisierten Typen in `src/types/index.ts` mappt (`Match`, `StandingRow`, `ScorerRow`, `Team`).

- `src/config/leagues.ts` – **Liga-Registry**. Neue Liga = ein Eintrag hier.
- `src/services/providers/` – ein Modul pro Datenquelle, alle erfüllen `LeagueProvider`:
  - `openLigaProvider.ts` – **OpenLigaDB**, kostenlos, ohne Key, CORS-ok. Deckt `bl1/bl2/bl3`.
    Endpunkte: `getmatchdata/{kürzel}/{saison}`, `getbltable/...`, `getgoalgetters/...`.
  - `apiFootballProvider.ts` – **API-Football v3** über den Proxy. Liga-IDs z. B.
    Primeira Liga = 94, La Liga = 140, Premier League = 39, Serie A = 135, Ligue 1 = 61.
    Liest `VITE_PROXY_BASE_URL`; ohne Proxy wirft es `ProxyNotConfiguredError`.
  - `index.ts` – `getProvider(league)` wählt nach `league.provider`.
- `src/services/leagueService.ts` – dünne Fassade, die die UI aufruft.
- `src/hooks/useLeagueData.ts` – lädt Spiele/Tabelle/Torschützen parallel (`Promise.allSettled`).
- `src/App.tsx` – Liga-/Saison-Auswahl + 3 Tabs (Spielplan, Tabelle, Torschützen).

## Datenquellen-Strategie (verifiziert am 14.06.2026)
- **Deutsche Ligen → OpenLigaDB** (gratis, kein Key, läuft direkt im Browser). Volle Funktion.
- **Alle anderen → API-Football** (Key nötig). Der Key darf NICHT ins Frontend → Cloudflare-Worker
  in `proxy/` versteckt ihn und fügt CORS hinzu. Setup-Anleitung: `proxy/README.md`.
- Es gibt KEINE einzige kostenlose, schlüsselfreie Quelle für alle Ligen (die FIFA-API der
  WM-App war ein Sonderfall nur für FIFA-Turniere).

## Aktueller Stand
- Grundgerüst steht und **läuft mit OpenLigaDB** (Bundesliga 1/2) out-of-the-box (`npm run dev`).
- API-Football/Primeira Liga ist **vollständig verdrahtet, aber inaktiv**, bis Proxy + Key stehen
  (siehe `proxy/README.md`, dann `VITE_PROXY_BASE_URL` in `.env`). Ohne Proxy zeigt die Liga
  einen klaren Hinweis statt eines Absturzes.
- Noch **kein** GitHub-Repo angelegt/gepusht, **kein** Deployment eingerichtet.

## Sinnvolle nächste Schritte
1. Proxy deployen (Cloudflare), Key setzen, `VITE_PROXY_BASE_URL` eintragen → Primeira Liga testen.
2. GitHub-Repo `fussball-ligen-app` anlegen, pushen, GitHub-Pages-Workflow ergänzen
   (analog zur WM-App: `.github/workflows/deploy-pages.yml`). `vite.config.ts` `base` ggf. anpassen.
3. Optionale Ausbauten: Favoriten-Team je Liga (`favoriteTeamName` setzen + UI), Spieltag-Filter,
   Auto-Refresh für Live-Spiele, Match-Detail (Aufstellungen/Statistik – bei API-Football via
   `fixtures/lineups`, `fixtures/statistics`, `fixtures/events`; bei OpenLigaDB begrenzt).
4. Weitere Ligen: nur `src/config/leagues.ts` erweitern (Provider + ID/Kürzel + Saisons).

## Befehle
- `npm install` · `npm run dev` · `npm run build` (führt `tsc -b` mit, strenge TS-Optionen).
- Proxy: siehe `proxy/README.md`.

## Konventionen
- Deutschsprachige UI-Texte und Kommentare.
- TS strikt (`noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax`) – Type-only-Importe
  mit `import type`.

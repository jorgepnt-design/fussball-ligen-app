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
  - Saison-Auswahl inkl. **kommender Saison 2026/27** (`openLigaSeasons` in `leagues.ts`). In der
    Sommerpause ist der Spielplan noch leer → `SchedulePage` zeigt einen Hinweis; Paarungen/Termine
    erscheinen automatisch, sobald OpenLigaDB sie freigibt. API-Football-Ligen (Free-Plan) können
    die kommende Saison nicht zeigen (nur 2022–2024).
- **Proxy + Liga Portugal sind live und verifiziert** (an echten Daten getestet, Tabelle
  2024/25: Sporting CP Meister). Cloudflare-Worker: `ligen-proxy.jorge-ligen.workers.dev`
  (Account Cloudflare/api-football = jorgepnt@gmail.com, API-Football Free-Plan, 100 Anfragen/Tag).
  - **Wichtig – Free-Plan deckt nur Saisons 2022–2024**, NICHT die laufende Saison. Darum nutzt
    Liga Portugal in `leagues.ts` die Saisons 2022–2024 (Standard 2024). Erst ein bezahlter Plan
    gibt 2025+ frei → dann `apiFootballFreeSeasons` in `leagues.ts` erweitern.
  - Worker cached erfolgreiche Antworten 10 Min am Edge (Fehler nie) → schont das Tageskontingent.
  - Konfiguriert via `.env` (lokal, `VITE_PROXY_BASE_URL`, gitignored) **und** GitHub-Actions-
    **Repo-Variable** `VITE_PROXY_BASE_URL` (für die Live-Seite, wird in `deploy-pages.yml` gelesen).
  - Worker neu deployen: `cd proxy && npx wrangler deploy` (Login/Secret bleiben bestehen).
- **GitHub-Repo + Deployment stehen:** Repo `jorgepnt-design/fussball-ligen-app` (öffentlich),
  GitHub-Pages-Workflow `.github/workflows/deploy-pages.yml` deployt bei jedem Push auf `main`.
  **Live:** https://jorgepnt-design.github.io/fussball-ligen-app/ (Pages-Quelle = GitHub Actions).

## Umgesetzte Features (Auswahl)
- **Ligen:** Liga Portugal (94), La Liga (140), Premier League (39), Ligue 1 (61), Serie A (135)
  über API-Football; Bundesliga 1/2 über OpenLigaDB. Weitere Liga = ein Eintrag in `src/config/leagues.ts`.
- **Favoriten-Vereine selbst wählbar (mehrere):** `FavoriteSelector` (Header, Dropdown zum
  Hinzufügen + ×-Chips) + `useFavoriteTeams`-Hook (localStorage `favoriteTeams`, je Liga als
  String-Array, migriert altes Einzelwert-Format). Markiert alle gewählten Vereine in Tabelle &
  Spielplan (gold). Eigene Wahl hat Vorrang vor dem statischen `favoriteTeamName` aus `leagues.ts`
  (Default z. B. Darmstadt in bl2); `[]` = bewusst keiner. Team-Liste kommt aus der Tabelle
  (sonst aus den Spielen).
- **Zuletzt gewählte Liga + Saison werden gemerkt** (localStorage `lastLeague`/`lastSeason`, in
  `App.tsx`). Die App öffnet dort wieder, wo man war – so ist der markierte Verein sofort sichtbar
  (vorher startete sie immer auf Liga Portugal, wodurch Favoriten „verschwunden" wirkten).
- **Vereins-Filter im Spielplan (Mehrfachauswahl):** Toggle-Buttons „Alle Spiele" + je ein Button
  pro Favorit (`SchedulePage`, localStorage `scheduleFilter` = JSON-Array gewählter Vereinsnamen,
  `[]` = alle; migriert altes Einzelwert-Format). Mehrere Vereine gleichzeitig aktivierbar → zeigt
  alle Spiele der gewählten Vereine zusammen (vergangene + kommende, Heim & Auswärts). Es greifen nur
  Vereine, die in der aktuellen Liga Favorit sind; provider-unabhängig – funktioniert in allen Ligen.
- **Match-Detail (Torschützen + Statistik):** aufklappbar pro Spiel in `MatchCard`,
  `LeagueProvider.getMatchDetails?` (optional). API-Football lädt `fixtures/events` +
  `fixtures/statistics` on-demand (Proxy-Cache schont das Kontingent); OpenLigaDB liefert
  Torschützen inline, aber KEINE Statistik (klarer Hinweis statt Fehler).

- **Tor-Benachrichtigung (echtes Web-Push, auch bei geschlossener App):**
  - **Backend:** Cloudflare-Worker in `push/` (`ligen-push.jorge-ligen.workers.dev`), Cron jede
    Minute → pollt OpenLigaDB (bl1/bl2), erkennt Tor-Anstiege, sendet Web-Push an passende Abos.
    KV `SUBS` (Abos `sub:<hash>` + `scores`). VAPID: Public in `wrangler.toml`/`src/config/push.ts`,
    Private als Worker-Secret. Krypto (RFC 8291/8292, WebCrypto) gegen RFC-Testvektor verifiziert
    (`push/test-webpush.mjs`). Setup/Details: `push/README.md`.
  - **Frontend:** Service Worker `public/sw.js` (zeigt Push, unterdrückt Dublette wenn App sichtbar),
    `usePush`-Hook (Abo/__abmelden__/Test, abonniert die Vereinsnamen aller Liga-Favoriten),
    `NotificationToggle` (Header, „Tor-Alarm" + Test-Knopf). Zusätzlich `useGoalNotifications`
    (In-App-Notification alle 30 s, solange offen) für sofortige Anzeige.
  - **Grenzen:** iOS nur als installierte PWA (Home-Bildschirm, iOS 16.4+). Faktisch nur deutsche
    Ligen (nur die haben Live-Spiele). Cron-Takt = 1 Min, also bis zu ~1 Min Verzögerung.
- **Live-Auto-Refresh:** `useLeagueData` lädt alle 30 s still nach, solange ein Spiel
  `status: "live"` hat (Badge im Spielplan; behält bei Fehlern die alten Daten). Greift faktisch
  nur für deutsche Ligen (OpenLigaDB, laufende Saison, gratis/ungedrosselt) – API-Football-Ligen
  zeigen im Free-Plan nur abgeschlossene Saisons 2022–2024, also nie Live-Spiele.

## Sinnvolle nächste Schritte
1. Optionale Ausbauten: Spieltag-Filter, **Aufstellungen** (API-Football `fixtures/lineups`).
2. Weitere Ligen: nur `src/config/leagues.ts` erweitern (Provider + ID/Kürzel + Saisons).

## Befehle
- `npm install` · `npm run dev` · `npm run build` (führt `tsc -b` mit, strenge TS-Optionen).
- Proxy: siehe `proxy/README.md`.

## Konventionen
- Deutschsprachige UI-Texte und Kommentare.
- TS strikt (`noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax`) – Type-only-Importe
  mit `import type`.

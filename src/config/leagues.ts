import type { LeagueConfig } from "../types";

// Liga-Registry. Neue Liga hinzufuegen = hier einen Eintrag ergaenzen.
// - Deutsche Ligen: provider "openliga" (kostenlos, ohne Key) + openLigaShortcut.
// - Alle anderen: provider "apifootball" (ueber Cloudflare-Proxy) + apiFootballId.
//   API-Football-Liga-IDs: Primeira Liga = 94, La Liga = 140, Premier League = 39,
//   Serie A = 135, Ligue 1 = 61, Eredivisie = 88 (siehe API-Football-Doku).

const recentSeasons = ["2025", "2024", "2023"];

export const leagues: LeagueConfig[] = [
  {
    id: "primeira-liga",
    name: "Liga Portugal",
    country: "Portugal",
    flag: "🇵🇹",
    provider: "apifootball",
    apiFootballId: 94,
    seasons: recentSeasons,
    defaultSeason: "2025",
  },
  {
    id: "bundesliga-1",
    name: "Bundesliga",
    country: "Deutschland",
    flag: "🇩🇪",
    provider: "openliga",
    openLigaShortcut: "bl1",
    seasons: recentSeasons,
    defaultSeason: "2025",
  },
  {
    id: "bundesliga-2",
    name: "2. Bundesliga",
    country: "Deutschland",
    flag: "🇩🇪",
    provider: "openliga",
    openLigaShortcut: "bl2",
    seasons: recentSeasons,
    defaultSeason: "2025",
  },
];

export const defaultLeagueId = "primeira-liga";

export const getLeague = (id: string): LeagueConfig => leagues.find((l) => l.id === id) ?? leagues[0];

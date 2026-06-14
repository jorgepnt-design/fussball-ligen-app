import type { LeagueConfig } from "../types";

// Liga-Registry. Neue Liga hinzufuegen = hier einen Eintrag ergaenzen.
// - Deutsche Ligen: provider "openliga" (kostenlos, ohne Key) + openLigaShortcut.
// - Alle anderen: provider "apifootball" (ueber Cloudflare-Proxy) + apiFootballId.
//   API-Football-Liga-IDs: Primeira Liga = 94, La Liga = 140, Premier League = 39,
//   Serie A = 135, Ligue 1 = 61, Eredivisie = 88 (siehe API-Football-Doku).

// OpenLigaDB (deutsche Ligen): inkl. kommender Saison 2026/27. Solange die Liga den
// Spielplan noch nicht freigegeben hat, ist sie leer – die Paarungen/Termine erscheinen
// automatisch, sobald OpenLigaDB sie veröffentlicht (Spieltag-Struktur existiert bereits).
const openLigaSeasons = ["2026", "2025", "2024", "2023"];
// API-Football Free-Plan deckt nur die Saisons 2022–2024 ab (keine laufende/kommende Saison).
// Eigene Liste für key-basierte Ligen, damit out-of-the-box echte Daten erscheinen.
const apiFootballFreeSeasons = ["2024", "2023", "2022"];

export const leagues: LeagueConfig[] = [
  {
    id: "primeira-liga",
    name: "Liga Portugal",
    country: "Portugal",
    flag: "🇵🇹",
    provider: "apifootball",
    apiFootballId: 94,
    seasons: apiFootballFreeSeasons,
    defaultSeason: "2024",
  },
  {
    id: "bundesliga-1",
    name: "Bundesliga",
    country: "Deutschland",
    flag: "🇩🇪",
    provider: "openliga",
    openLigaShortcut: "bl1",
    seasons: openLigaSeasons,
    defaultSeason: "2025",
  },
  {
    id: "bundesliga-2",
    name: "2. Bundesliga",
    country: "Deutschland",
    flag: "🇩🇪",
    provider: "openliga",
    openLigaShortcut: "bl2",
    seasons: openLigaSeasons,
    defaultSeason: "2025",
    favoriteTeamName: "Darmstadt", // Lieblingsverein – wird in Tabelle & Spielplan hervorgehoben
  },
  {
    id: "la-liga",
    name: "La Liga",
    country: "Spanien",
    flag: "🇪🇸",
    provider: "apifootball",
    apiFootballId: 140,
    seasons: apiFootballFreeSeasons,
    defaultSeason: "2024",
  },
  {
    id: "premier-league",
    name: "Premier League",
    country: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    provider: "apifootball",
    apiFootballId: 39,
    seasons: apiFootballFreeSeasons,
    defaultSeason: "2024",
  },
  {
    id: "ligue-1",
    name: "Ligue 1",
    country: "Frankreich",
    flag: "🇫🇷",
    provider: "apifootball",
    apiFootballId: 61,
    seasons: apiFootballFreeSeasons,
    defaultSeason: "2024",
  },
  {
    id: "serie-a",
    name: "Serie A",
    country: "Italien",
    flag: "🇮🇹",
    provider: "apifootball",
    apiFootballId: 135,
    seasons: apiFootballFreeSeasons,
    defaultSeason: "2024",
  },
];

export const defaultLeagueId = "primeira-liga";

export const getLeague = (id: string): LeagueConfig => leagues.find((l) => l.id === id) ?? leagues[0];

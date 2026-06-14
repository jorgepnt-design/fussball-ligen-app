// Normalisierte Datenmodelle – fuer ALLE Ligen/Provider identisch.
// Jeder Provider (OpenLigaDB, API-Football, ...) mappt seine Rohdaten auf diese Typen,
// damit die UI-Komponenten quellenunabhaengig bleiben.

export type MatchStatus = "scheduled" | "live" | "finished";

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface GoalEvent {
  minute?: string;
  scorer: string;
  team?: "home" | "away"; // welche Mannschaft traf (zur seitenrichtigen Anzeige)
  assist?: string; // Vorlagengeber (sofern die Quelle ihn liefert)
  isPenalty?: boolean;
  isOwnGoal?: boolean;
  score?: string; // Zwischenstand, z. B. "2:1"
}

// Eine Statistik-Zeile eines Spiels (Heim vs. Auswärts), z. B. Ballbesitz, Torschüsse.
export interface MatchStat {
  type: string; // deutsches Label, z. B. "Ballbesitz"
  home: string | number | null;
  away: string | number | null;
}

// Detaildaten zu einem einzelnen Spiel – on-demand geladen (Torschützen + Statistik).
export interface MatchDetails {
  goals: GoalEvent[];
  statistics: MatchStat[];
}

export interface Match {
  id: string;
  dateUtc: string;
  matchday?: string;
  status: MatchStatus;
  liveMinute?: string | null;
  home: Team;
  away: Team;
  scoreHome: number | null;
  scoreAway: number | null;
  goals?: GoalEvent[];
  venue?: string;
}

export interface StandingRow {
  rank: number;
  team: Team;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface ScorerRow {
  rank: number;
  name: string;
  team?: Team;
  goals: number;
  assists?: number;
  penalties?: number;
}

export type ProviderId = "openliga" | "apifootball";

export interface LeagueConfig {
  id: string; // "bundesliga-1"
  name: string; // "Bundesliga"
  country: string; // "Deutschland"
  flag: string; // Emoji
  provider: ProviderId;
  seasons: string[]; // Startjahre, neueste zuerst
  defaultSeason: string;
  // Provider-spezifisch:
  openLigaShortcut?: string; // "bl1"
  apiFootballId?: number; // 94 = Primeira Liga
  favoriteTeamName?: string; // optional optisch hervorheben
}

// Was jeder Provider liefern koennen muss. Nicht jede Quelle kann alles –
// nicht unterstuetzte Methoden werfen einen klaren Fehler, die UI zeigt einen Hinweis.
export interface LeagueProvider {
  getMatches(league: LeagueConfig, season: string): Promise<Match[]>;
  getStandings(league: LeagueConfig, season: string): Promise<StandingRow[]>;
  getScorers(league: LeagueConfig, season: string): Promise<ScorerRow[]>;
  // Optional: Torschützen + Statistik zu EINEM Spiel (on-demand). Quellen ohne
  // Detail-Endpunkte (z. B. OpenLigaDB hat keine Statistik) lassen das weg.
  getMatchDetails?(league: LeagueConfig, match: Match): Promise<MatchDetails>;
}

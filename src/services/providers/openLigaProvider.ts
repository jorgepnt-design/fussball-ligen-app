import type { LeagueConfig, LeagueProvider, Match, MatchStatus, ScorerRow, StandingRow, Team } from "../../types";

// OpenLigaDB – kostenlos, ohne API-Key, CORS-freundlich. Deckt bl1 / bl2 / bl3 ab.
// Doku: https://api.openligadb.de/
const BASE = "https://api.openligadb.de";

interface OlTeam {
  teamId: number;
  teamName: string;
  shortName?: string;
  teamIconUrl?: string;
}
interface OlResult {
  resultTypeID: number; // 2 = Endergebnis
  pointsTeam1: number;
  pointsTeam2: number;
}
interface OlGoal {
  matchMinute: number | null;
  goalGetterName: string;
  scoreTeam1: number;
  scoreTeam2: number;
  isPenalty: boolean;
  isOwnGoal: boolean;
}
interface OlMatch {
  matchID: number;
  matchDateTimeUTC: string;
  group?: { groupName?: string; groupOrderID?: number };
  team1: OlTeam;
  team2: OlTeam;
  matchIsFinished: boolean;
  matchResults: OlResult[];
  goals: OlGoal[];
  location?: { locationStadium?: string; locationCity?: string } | null;
}
interface OlTableRow {
  teamName: string;
  shortName?: string;
  teamIconUrl?: string;
  points: number;
  goals: number;
  opponentGoals: number;
  matches: number;
  won: number;
  lost: number;
  draw: number;
  goalDiff: number;
}
interface OlScorer {
  goalGetterName: string;
  goalCount: number;
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`OpenLigaDB-Anfrage fehlgeschlagen (HTTP ${response.status})`);
  return (await response.json()) as T;
};

const toTeam = (t: OlTeam): Team => ({
  id: String(t.teamId),
  name: t.teamName,
  shortName: t.shortName,
  logoUrl: t.teamIconUrl,
});

const finalScore = (match: OlMatch): { home: number | null; away: number | null } => {
  if (match.matchResults.length > 0) {
    const end = match.matchResults.find((r) => r.resultTypeID === 2) ?? match.matchResults[match.matchResults.length - 1];
    return { home: end.pointsTeam1, away: end.pointsTeam2 };
  }
  // Live ohne Endergebnis: aktuellen Stand aus dem letzten Tor ableiten.
  if (match.goals.length > 0) {
    const last = match.goals[match.goals.length - 1];
    return { home: last.scoreTeam1, away: last.scoreTeam2 };
  }
  return { home: null, away: null };
};

const statusOf = (match: OlMatch): MatchStatus => {
  if (match.matchIsFinished) return "finished";
  const kickoff = new Date(match.matchDateTimeUTC).getTime();
  const now = Date.now();
  // Heuristik: angepfiffen, noch nicht beendet, innerhalb ~3h Fenster => live.
  if (kickoff <= now && now - kickoff < 3 * 60 * 60 * 1000) return "live";
  return "scheduled";
};

export const openLigaProvider: LeagueProvider = {
  async getMatches(league: LeagueConfig, season: string): Promise<Match[]> {
    const data = await fetchJson<OlMatch[]>(`${BASE}/getmatchdata/${league.openLigaShortcut}/${season}`);
    return data
      .map((m) => {
        const score = finalScore(m);
        return {
          id: String(m.matchID),
          dateUtc: m.matchDateTimeUTC,
          matchday: m.group?.groupName,
          status: statusOf(m),
          home: toTeam(m.team1),
          away: toTeam(m.team2),
          scoreHome: score.home,
          scoreAway: score.away,
          venue: m.location?.locationStadium ?? undefined,
          goals: m.goals.map((g) => ({
            minute: g.matchMinute != null ? `${g.matchMinute}'` : undefined,
            scorer: g.goalGetterName,
            isPenalty: g.isPenalty,
            isOwnGoal: g.isOwnGoal,
            score: `${g.scoreTeam1}:${g.scoreTeam2}`,
          })),
        } satisfies Match;
      })
      .sort((a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime());
  },

  async getStandings(league: LeagueConfig, season: string): Promise<StandingRow[]> {
    const data = await fetchJson<OlTableRow[]>(`${BASE}/getbltable/${league.openLigaShortcut}/${season}`);
    return data.map((row, index) => ({
      rank: index + 1,
      team: { id: row.teamName, name: row.teamName, shortName: row.shortName, logoUrl: row.teamIconUrl },
      played: row.matches,
      won: row.won,
      draw: row.draw,
      lost: row.lost,
      goalsFor: row.goals,
      goalsAgainst: row.opponentGoals,
      goalDiff: row.goalDiff,
      points: row.points,
    }));
  },

  async getScorers(league: LeagueConfig, season: string): Promise<ScorerRow[]> {
    const data = await fetchJson<OlScorer[]>(`${BASE}/getgoalgetters/${league.openLigaShortcut}/${season}`);
    return data
      .filter((s) => s.goalCount > 0)
      .sort((a, b) => b.goalCount - a.goalCount)
      .map((s, index) => ({ rank: index + 1, name: s.goalGetterName, goals: s.goalCount }));
  },
};

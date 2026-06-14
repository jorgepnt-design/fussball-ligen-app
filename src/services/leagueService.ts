import type { LeagueConfig, Match, MatchDetails, ScorerRow, StandingRow } from "../types";
import { getProvider } from "./providers";

// Duenne Fassade ueber den jeweiligen Provider – die UI ruft nur diese Methoden auf.
export const leagueService = {
  getMatches(league: LeagueConfig, season: string): Promise<Match[]> {
    return getProvider(league).getMatches(league, season);
  },
  getStandings(league: LeagueConfig, season: string): Promise<StandingRow[]> {
    return getProvider(league).getStandings(league, season);
  },
  getScorers(league: LeagueConfig, season: string): Promise<ScorerRow[]> {
    return getProvider(league).getScorers(league, season);
  },
  // Liefert die jeweilige Quelle Spieldetails (Torschützen + Statistik)?
  supportsMatchDetails(league: LeagueConfig): boolean {
    return typeof getProvider(league).getMatchDetails === "function";
  },
  getMatchDetails(league: LeagueConfig, match: Match): Promise<MatchDetails> {
    const provider = getProvider(league);
    if (!provider.getMatchDetails) {
      return Promise.reject(new Error("Für diese Liga sind keine Spieldetails verfügbar."));
    }
    return provider.getMatchDetails(league, match);
  },
};

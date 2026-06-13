import type { LeagueConfig, Match, ScorerRow, StandingRow } from "../types";
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
};

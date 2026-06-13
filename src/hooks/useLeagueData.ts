import { useEffect, useState } from "react";
import { leagueService } from "../services/leagueService";
import type { LeagueConfig, Match, ScorerRow, StandingRow } from "../types";

interface State {
  matches: Match[];
  standings: StandingRow[];
  scorers: ScorerRow[];
  isLoading: boolean;
  error: string | null;
}

const empty: State = { matches: [], standings: [], scorers: [], isLoading: true, error: null };

// Laedt Spiele, Tabelle und Torschuetzen einer Liga/Saison parallel.
export const useLeagueData = (league: LeagueConfig, season: string) => {
  const [state, setState] = useState<State>(empty);

  useEffect(() => {
    let cancelled = false;
    setState({ ...empty, isLoading: true });

    Promise.allSettled([
      leagueService.getMatches(league, season),
      leagueService.getStandings(league, season),
      leagueService.getScorers(league, season),
    ]).then(([matches, standings, scorers]) => {
      if (cancelled) return;
      // Ein gemeinsamer Fehler reicht der UI; einzelne leere Teile bleiben einfach leer.
      const firstError = [matches, standings, scorers].find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      setState({
        matches: matches.status === "fulfilled" ? matches.value : [],
        standings: standings.status === "fulfilled" ? standings.value : [],
        scorers: scorers.status === "fulfilled" ? scorers.value : [],
        isLoading: false,
        error:
          matches.status === "rejected" && standings.status === "rejected" && scorers.status === "rejected"
            ? firstError?.reason instanceof Error
              ? firstError.reason.message
              : "Daten konnten nicht geladen werden."
            : null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [league, season]);

  return state;
};

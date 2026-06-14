import { useCallback, useEffect, useRef, useState } from "react";
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

// Wie oft bei laufenden Spielen aktualisiert wird (analog zur WM-App).
const LIVE_REFRESH_MS = 30_000;

// Laedt Spiele, Tabelle und Torschuetzen einer Liga/Saison parallel.
// Solange ein Spiel live ist, wird im Hintergrund alle 30 s still nachgeladen.
export const useLeagueData = (league: LeagueConfig, season: string) => {
  const [state, setState] = useState<State>(empty);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // silent = Hintergrund-Refresh (kein Lade-Spinner, behält bei Fehlern die alten Daten).
  const load = useCallback(
    async (silent: boolean) => {
      if (!silent) setState((s) => ({ ...s, isLoading: true, error: null }));

      const results = await Promise.allSettled([
        leagueService.getMatches(league, season),
        leagueService.getStandings(league, season),
        leagueService.getScorers(league, season),
      ]);
      if (!mounted.current) return;

      const [matches, standings, scorers] = results;
      const allRejected = matches.status === "rejected" && standings.status === "rejected" && scorers.status === "rejected";
      const firstError = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;

      setState((prev) => ({
        matches: matches.status === "fulfilled" ? matches.value : silent ? prev.matches : [],
        standings: standings.status === "fulfilled" ? standings.value : silent ? prev.standings : [],
        scorers: scorers.status === "fulfilled" ? scorers.value : silent ? prev.scorers : [],
        isLoading: false,
        error: silent ? prev.error : allRejected ? (firstError?.reason instanceof Error ? firstError.reason.message : "Daten konnten nicht geladen werden.") : null,
      }));
    },
    [league, season],
  );

  // Erstladen + Neuladen bei Liga-/Saison-Wechsel.
  useEffect(() => {
    setState({ ...empty, isLoading: true });
    void load(false);
  }, [load]);

  // Auto-Refresh, solange mindestens ein Spiel live ist.
  const isLive = state.matches.some((m) => m.status === "live");
  useEffect(() => {
    if (!isLive) return;
    const id = window.setInterval(() => void load(true), LIVE_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [isLive, load]);

  return { ...state, isLive };
};

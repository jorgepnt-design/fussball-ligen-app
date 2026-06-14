import { useMemo, useState } from "react";
import { MatchCard } from "../components/MatchCard";
import { EmptyState } from "../components/states";
import type { LeagueConfig, Match } from "../types";

interface Props {
  matches: Match[];
  league: LeagueConfig;
  season: string;
  favoriteTeams?: string[];
  isLive?: boolean; // mind. ein Spiel läuft → Auto-Aktualisierung aktiv
}

// "2026" -> "2026/27"
const seasonLabel = (season: string): string => {
  const start = Number(season);
  return Number.isFinite(start) ? `${start}/${String((start + 1) % 100).padStart(2, "0")}` : season;
};

const FILTER_KEY = "fussball-ligen:scheduleFilter";
const safeGet = (key: string): string => {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
};
const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* localStorage nicht verfügbar */
  }
};

export function SchedulePage({ matches, league, season, favoriteTeams = [], isLive }: Props) {
  // Welcher Verein wird angezeigt? "" = alle Ligaspiele. Sonst genau dieser Favorit.
  const [storedFilter, setStoredFilter] = useState<string>(() => safeGet(FILTER_KEY));
  const chooseFilter = (team: string) => {
    setStoredFilter(team);
    safeSet(FILTER_KEY, team);
  };
  // Gilt nur, wenn der gemerkte Verein in dieser Liga überhaupt Favorit ist.
  const filterTeam = storedFilter && favoriteTeams.includes(storedFilter) ? storedFilter : "";

  // Auf den gewählten Verein eingrenzen (Heim- oder Auswärtsspiele).
  const visible = useMemo(() => {
    if (!filterTeam) return matches;
    return matches.filter((m) => m.home.name.includes(filterTeam) || m.away.name.includes(filterTeam));
  }, [matches, filterTeam]);

  const { upcoming, results } = useMemo(() => {
    const upcoming = visible.filter((m) => m.status !== "finished");
    const finished = visible.filter((m) => m.status === "finished").reverse();
    // Bei Vereins-Filter alle Spiele zeigen; sonst die letzten 30 (Übersicht).
    const results = filterTeam ? finished : finished.slice(0, 30);
    return { upcoming, results };
  }, [visible, filterTeam]);

  if (matches.length === 0) {
    return (
      <EmptyState title={`Spielplan ${seasonLabel(season)} noch nicht verfügbar`}>
        Für diese Saison liegen noch keine Spielpaarungen vor. Sobald die Liga den Spielplan
        veröffentlicht, erscheinen Begegnungen und Termine hier automatisch.
      </EmptyState>
    );
  }

  const pill = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${active ? "bg-gold text-night" : "border border-white/15 bg-white/5 text-white/80 hover:text-white"}`;

  return (
    <div className="space-y-6">
      {favoriteTeams.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-bold text-white/60">Anzeigen:</span>
          <button type="button" onClick={() => chooseFilter("")} className={pill(filterTeam === "")}>
            Alle Spiele
          </button>
          {favoriteTeams.map((team) => (
            <button key={team} type="button" onClick={() => chooseFilter(team)} className={pill(filterTeam === team)}>
              {team}
            </button>
          ))}
        </div>
      )}

      {filterTeam && visible.length === 0 ? (
        <EmptyState title={`Keine Spiele für ${filterTeam}`}>
          In dieser Liga/Saison sind keine Begegnungen dieses Vereins vorhanden.
        </EmptyState>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-xl font-black">Kommende Spiele & Live</h2>
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-ember/15 px-2 py-1 text-xs font-bold text-ember">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-ember" aria-hidden />
                    Live · Auto-Aktualisierung alle 30 s
                  </span>
                )}
              </div>
              <div className="grid gap-3">
                {upcoming.map((m) => (
                  <MatchCard key={m.id} match={m} league={league} favoriteTeams={favoriteTeams} />
                ))}
              </div>
            </section>
          )}
          {results.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-black">{filterTeam ? "Ergebnisse" : "Letzte Ergebnisse"}</h2>
              <div className="grid gap-3">
                {results.map((m) => (
                  <MatchCard key={m.id} match={m} league={league} favoriteTeams={favoriteTeams} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

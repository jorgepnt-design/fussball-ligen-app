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
const readFilter = (): string[] => {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string");
    } catch {
      /* altes Einzelwert-Format (ein Vereinsname) */
    }
    return [raw];
  } catch {
    return [];
  }
};
const writeFilter = (teams: string[]) => {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(teams));
  } catch {
    /* localStorage nicht verfügbar */
  }
};

export function SchedulePage({ matches, league, season, favoriteTeams = [], isLive }: Props) {
  // Welche Vereine werden angezeigt? Leer = alle Ligaspiele. Sonst diese Favoriten (Mehrfachauswahl).
  const [storedFilter, setStoredFilter] = useState<string[]>(readFilter);
  const setFilter = (teams: string[]) => {
    setStoredFilter(teams);
    writeFilter(teams);
  };
  // Nur Vereine berücksichtigen, die in dieser Liga überhaupt Favorit sind.
  const selected = useMemo(() => storedFilter.filter((t) => favoriteTeams.includes(t)), [storedFilter, favoriteTeams]);
  const filterActive = selected.length > 0;

  const toggleTeam = (team: string) => {
    setFilter(selected.includes(team) ? selected.filter((t) => t !== team) : [...selected, team]);
  };

  // Auf die gewählten Vereine eingrenzen (Heim- oder Auswärtsspiele eines davon).
  const visible = useMemo(() => {
    if (!filterActive) return matches;
    return matches.filter((m) => selected.some((f) => m.home.name.includes(f) || m.away.name.includes(f)));
  }, [matches, filterActive, selected]);

  const { upcoming, results } = useMemo(() => {
    const upcoming = visible.filter((m) => m.status !== "finished");
    const finished = visible.filter((m) => m.status === "finished").reverse();
    // Bei Vereins-Filter alle Spiele zeigen; sonst die letzten 30 (Übersicht).
    const results = filterActive ? finished : finished.slice(0, 30);
    return { upcoming, results };
  }, [visible, filterActive]);

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
          <button type="button" onClick={() => setFilter([])} className={pill(!filterActive)}>
            Alle Spiele
          </button>
          {favoriteTeams.map((team) => (
            <button key={team} type="button" onClick={() => toggleTeam(team)} aria-pressed={selected.includes(team)} className={pill(selected.includes(team))}>
              {team}
            </button>
          ))}
        </div>
      )}

      {filterActive && visible.length === 0 ? (
        <EmptyState title="Keine Spiele für die gewählten Vereine">
          In dieser Liga/Saison sind keine Begegnungen der gewählten Vereine vorhanden.
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
              <h2 className="mb-3 text-xl font-black">{filterActive ? "Ergebnisse" : "Letzte Ergebnisse"}</h2>
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

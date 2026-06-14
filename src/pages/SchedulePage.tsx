import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { MatchCard } from "../components/MatchCard";
import { EmptyState } from "../components/states";
import type { LeagueConfig, Match } from "../types";

interface Props {
  matches: Match[];
  league: LeagueConfig;
  season: string;
  favoriteTeamName?: string;
  isLive?: boolean; // mind. ein Spiel läuft → Auto-Aktualisierung aktiv
}

// "2026" -> "2026/27"
const seasonLabel = (season: string): string => {
  const start = Number(season);
  return Number.isFinite(start) ? `${start}/${String((start + 1) % 100).padStart(2, "0")}` : season;
};

const ONLY_FAV_KEY = "fussball-ligen:onlyFavorite";

export function SchedulePage({ matches, league, season, favoriteTeamName, isLive }: Props) {
  const [onlyFavorite, setOnlyFavorite] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONLY_FAV_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggleOnly = (value: boolean) => {
    setOnlyFavorite(value);
    try {
      localStorage.setItem(ONLY_FAV_KEY, value ? "1" : "0");
    } catch {
      /* localStorage nicht verfügbar */
    }
  };

  // Nur sinnvoll, wenn überhaupt ein Verein markiert ist.
  const filterActive = onlyFavorite && !!favoriteTeamName;

  // Auf den gewählten Verein eingrenzen (Heim- oder Auswärtsspiele).
  const visible = useMemo(() => {
    const fav = favoriteTeamName;
    if (!filterActive || !fav) return matches;
    return matches.filter((m) => m.home.name.includes(fav) || m.away.name.includes(fav));
  }, [matches, filterActive, favoriteTeamName]);

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

  return (
    <div className="space-y-6">
      {favoriteTeamName && (
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={onlyFavorite}
            onChange={(e) => toggleOnly(e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          <Filter size={15} className="text-gold" aria-hidden />
          Nur {favoriteTeamName}
        </label>
      )}

      {filterActive && visible.length === 0 ? (
        <EmptyState title={`Keine Spiele für ${favoriteTeamName}`}>
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
                  <MatchCard key={m.id} match={m} league={league} favoriteTeamName={favoriteTeamName} />
                ))}
              </div>
            </section>
          )}
          {results.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-black">{filterActive ? "Ergebnisse" : "Letzte Ergebnisse"}</h2>
              <div className="grid gap-3">
                {results.map((m) => (
                  <MatchCard key={m.id} match={m} league={league} favoriteTeamName={favoriteTeamName} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

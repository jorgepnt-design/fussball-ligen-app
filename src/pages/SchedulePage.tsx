import { useMemo } from "react";
import { MatchCard } from "../components/MatchCard";
import { EmptyState } from "../components/states";
import type { LeagueConfig, Match } from "../types";

interface Props {
  matches: Match[];
  league: LeagueConfig;
  season: string;
  favoriteTeamName?: string;
}

// "2026" -> "2026/27"
const seasonLabel = (season: string): string => {
  const start = Number(season);
  return Number.isFinite(start) ? `${start}/${String((start + 1) % 100).padStart(2, "0")}` : season;
};

export function SchedulePage({ matches, league, season, favoriteTeamName }: Props) {
  const { upcoming, results } = useMemo(() => {
    const upcoming = matches.filter((m) => m.status !== "finished");
    // Ergebnisse: neueste zuerst, auf die letzten 30 begrenzt (Performance/Übersicht).
    const results = matches.filter((m) => m.status === "finished").reverse().slice(0, 30);
    return { upcoming, results };
  }, [matches]);

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
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-black">Kommende Spiele & Live</h2>
          <div className="grid gap-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} league={league} favoriteTeamName={favoriteTeamName} />
            ))}
          </div>
        </section>
      )}
      {results.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-black">Letzte Ergebnisse</h2>
          <div className="grid gap-3">
            {results.map((m) => (
              <MatchCard key={m.id} match={m} league={league} favoriteTeamName={favoriteTeamName} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

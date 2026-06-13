import { useMemo } from "react";
import { MatchCard } from "../components/MatchCard";
import { EmptyState } from "../components/states";
import type { LeagueConfig, Match } from "../types";

interface Props {
  matches: Match[];
  league: LeagueConfig;
}

export function SchedulePage({ matches, league }: Props) {
  const { upcoming, results } = useMemo(() => {
    const upcoming = matches.filter((m) => m.status !== "finished");
    // Ergebnisse: neueste zuerst, auf die letzten 30 begrenzt (Performance/Übersicht).
    const results = matches.filter((m) => m.status === "finished").reverse().slice(0, 30);
    return { upcoming, results };
  }, [matches]);

  if (matches.length === 0) return <EmptyState title="Keine Spiele gefunden">Für diese Liga/Saison liegen keine Spieldaten vor.</EmptyState>;

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-black">Live & Anstehend</h2>
          <div className="grid gap-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} league={league} />
            ))}
          </div>
        </section>
      )}
      {results.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-black">Letzte Ergebnisse</h2>
          <div className="grid gap-3">
            {results.map((m) => (
              <MatchCard key={m.id} match={m} league={league} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

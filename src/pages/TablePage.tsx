import { StandingsTable } from "../components/StandingsTable";
import { EmptyState } from "../components/states";
import type { StandingRow } from "../types";

interface Props {
  standings: StandingRow[];
  favoriteTeamName?: string;
}

export function TablePage({ standings, favoriteTeamName }: Props) {
  if (standings.length === 0)
    return <EmptyState title="Keine Tabelle verfügbar">Für diese Liga/Saison liegen noch keine Tabellendaten vor.</EmptyState>;
  return (
    <div className="space-y-3">
      <StandingsTable rows={standings} favoriteTeamName={favoriteTeamName} />
      <p className="text-xs text-white/40">
        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-pitch align-middle" /> internationale Plätze ·
        <span className="mx-1 inline-block h-2.5 w-2.5 rounded-full bg-ember/70 align-middle" /> Abstieg (je Liga unterschiedlich)
      </p>
    </div>
  );
}

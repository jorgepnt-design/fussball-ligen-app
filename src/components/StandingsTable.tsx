import type { LeagueConfig, StandingRow } from "../types";
import { ClubLogo } from "./ClubLogo";

interface Props {
  rows: StandingRow[];
  league: LeagueConfig;
}

// Erste Plaetze = Champions-League-Raenge (rein optisch, je Liga unterschiedlich).
const rankColor = (rank: number) => (rank <= 4 ? "bg-pitch" : rank <= 6 ? "bg-gold/70" : rank >= 16 ? "bg-ember/70" : "bg-white/15");

export function StandingsTable({ rows, league }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <table className="w-full text-sm">
        <thead className="bg-night/80 text-xs uppercase tracking-wide text-white/55">
          <tr>
            <th className="py-2.5 pl-3 text-left" aria-label="Platz">#</th>
            <th className="py-2.5 text-left">Team</th>
            <th className="px-1.5 py-2.5 text-center">Sp</th>
            <th className="hidden px-1.5 py-2.5 text-center sm:table-cell">S</th>
            <th className="hidden px-1.5 py-2.5 text-center sm:table-cell">U</th>
            <th className="hidden px-1.5 py-2.5 text-center sm:table-cell">N</th>
            <th className="px-1.5 py-2.5 text-center">Tore</th>
            <th className="px-1.5 py-2.5 text-center">Diff</th>
            <th className="px-1.5 py-2.5 pr-3 text-center">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const favorite = league.favoriteTeamName && row.team.name.includes(league.favoriteTeamName);
            return (
              <tr key={row.team.id} className={`border-t border-white/5 ${favorite ? "bg-gold/15 text-gold" : ""}`}>
                <td className="py-2.5 pl-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-4 w-1 rounded-full ${rankColor(row.rank)}`} aria-hidden />
                    <span className="font-bold tabular-nums">{row.rank}</span>
                  </span>
                </td>
                <td className="w-full max-w-0 truncate py-2.5 pr-1 font-bold">
                  <span className="mr-2 inline-flex align-middle"><ClubLogo team={row.team} className="h-5 w-5" /></span>
                  <span className="sm:hidden">{row.team.shortName ?? row.team.name}</span>
                  <span className="hidden sm:inline">{row.team.name}</span>
                </td>
                <td className="px-1.5 text-center tabular-nums">{row.played}</td>
                <td className="hidden px-1.5 text-center tabular-nums sm:table-cell">{row.won}</td>
                <td className="hidden px-1.5 text-center tabular-nums sm:table-cell">{row.draw}</td>
                <td className="hidden px-1.5 text-center tabular-nums sm:table-cell">{row.lost}</td>
                <td className="px-1.5 text-center tabular-nums">{row.goalsFor}:{row.goalsAgainst}</td>
                <td className="px-1.5 text-center tabular-nums">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
                <td className="px-1.5 pr-3 text-center font-black tabular-nums">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

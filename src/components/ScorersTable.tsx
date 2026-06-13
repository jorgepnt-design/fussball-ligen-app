import { Crown } from "lucide-react";
import type { ScorerRow } from "../types";
import { ClubLogo } from "./ClubLogo";

export function ScorersTable({ rows }: { rows: ScorerRow[] }) {
  const hasExtras = rows.some((r) => r.assists != null || r.penalties != null);
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <table className="w-full text-sm">
        <thead className="bg-night/80 text-xs uppercase tracking-wide text-white/55">
          <tr>
            <th className="py-2.5 pl-4 text-left" aria-label="Rang">#</th>
            <th className="py-2.5 text-left">Spieler</th>
            {hasExtras && <th className="hidden px-2 py-2.5 text-center sm:table-cell" title="Elfmeter">11m</th>}
            {hasExtras && <th className="hidden px-2 py-2.5 text-center sm:table-cell" title="Vorlagen">Vorl.</th>}
            <th className="py-2.5 pr-4 text-center">Tore</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const leader = row.rank === 1;
            return (
              <tr key={`${row.rank}-${row.name}`} className={`border-t border-white/5 ${leader ? "bg-gold/15" : ""}`}>
                <td className="py-2.5 pl-4">
                  <span className="inline-flex items-center gap-1.5 font-bold tabular-nums">
                    {leader && <Crown className="text-gold" size={14} aria-hidden />}
                    {row.rank}
                  </span>
                </td>
                <td className="max-w-0 py-2.5 pr-2">
                  <div className="flex items-center gap-2">
                    {row.team && <span className="shrink-0"><ClubLogo team={row.team} className="h-5 w-5" /></span>}
                    <div className="min-w-0">
                      <p className={`truncate font-bold ${leader ? "text-gold" : ""}`}>{row.name}</p>
                      {row.team && <p className="truncate text-xs text-white/45">{row.team.name}</p>}
                    </div>
                  </div>
                </td>
                {hasExtras && <td className="hidden px-2 text-center align-middle tabular-nums text-white/55 sm:table-cell">{row.penalties || "–"}</td>}
                {hasExtras && <td className="hidden px-2 text-center align-middle tabular-nums text-white/55 sm:table-cell">{row.assists || "–"}</td>}
                <td className="py-2.5 pr-4 text-center align-middle text-lg font-black tabular-nums">{row.goals}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

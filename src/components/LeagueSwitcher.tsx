import { leagues } from "../config/leagues";
import type { LeagueConfig } from "../types";

interface Props {
  league: LeagueConfig;
  season: string;
  onLeagueChange: (id: string) => void;
  onSeasonChange: (season: string) => void;
}

const seasonLabel = (start: string) => `${start}/${String(Number(start) + 1).slice(2)}`;

export function LeagueSwitcher({ league, season, onLeagueChange, onSeasonChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={league.id}
        onChange={(e) => onLeagueChange(e.target.value)}
        className="min-h-11 rounded-md border border-white/15 bg-night px-3 py-2 font-bold text-white"
        aria-label="Liga wählen"
      >
        {leagues.map((l) => (
          <option key={l.id} value={l.id}>
            {l.flag} {l.name} · {l.country}
          </option>
        ))}
      </select>
      <select
        value={season}
        onChange={(e) => onSeasonChange(e.target.value)}
        className="min-h-11 rounded-md border border-white/15 bg-night px-3 py-2 font-bold text-white"
        aria-label="Saison wählen"
      >
        {league.seasons.map((s) => (
          <option key={s} value={s}>
            Saison {seasonLabel(s)}
          </option>
        ))}
      </select>
    </div>
  );
}

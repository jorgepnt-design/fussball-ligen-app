import { MapPin } from "lucide-react";
import type { LeagueConfig, Match } from "../types";
import { ClubLogo } from "./ClubLogo";

interface Props {
  match: Match;
  league: LeagueConfig;
}

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
const fmtTime = (iso: string) => new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function StatusBadge({ match }: { match: Match }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-ember px-2.5 py-1 text-xs font-black uppercase text-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />
        Live{match.liveMinute ? ` · ${match.liveMinute}` : ""}
      </span>
    );
  }
  if (match.status === "finished") return <span className="rounded-md bg-pitch/15 px-2.5 py-1 text-xs font-bold uppercase text-pitch">Beendet</span>;
  return <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold uppercase text-white/70">Geplant</span>;
}

const isFav = (league: LeagueConfig, name: string) => league.favoriteTeamName && name.includes(league.favoriteTeamName);

export function MatchCard({ match, league }: Props) {
  const favorite = isFav(league, match.home.name) || isFav(league, match.away.name);
  const showScore = match.status !== "scheduled" && match.scoreHome != null && match.scoreAway != null;

  return (
    <article className={`rounded-lg border p-4 ${match.status === "live" ? "border-ember/50 bg-ember/10" : favorite ? "border-gold bg-gold/10" : "border-white/10 bg-white/5"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">
          {fmtDate(match.dateUtc)} · {fmtTime(match.dateUtc)}
          {match.matchday ? ` · ${match.matchday}` : ""}
        </p>
        <StatusBadge match={match} />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <p className="inline-flex min-w-0 items-center gap-2 text-base font-black sm:text-lg">
          <ClubLogo team={match.home} className="h-6 w-6 shrink-0" />
          <span className="truncate">{match.home.name}</span>
        </p>
        <div className={`rounded-md px-3 py-2 text-center font-black tabular-nums ${match.status === "live" ? "bg-ember text-white" : "bg-night"}`}>
          {showScore ? `${match.scoreHome} : ${match.scoreAway}` : <span className="text-white/70">{fmtTime(match.dateUtc)}</span>}
        </div>
        <p className="inline-flex min-w-0 items-center justify-end gap-2 text-right text-base font-black sm:text-lg">
          <span className="truncate">{match.away.name}</span>
          <ClubLogo team={match.away} className="h-6 w-6 shrink-0" />
        </p>
      </div>
      {match.goals && match.goals.length > 0 && (
        <ul className="mt-3 space-y-0.5 border-t border-white/10 pt-3 text-sm text-white/70">
          {match.goals.map((g, i) => (
            <li key={i}>
              <span className="mr-2 inline-block w-9 text-right font-bold tabular-nums text-gold">{g.minute ?? ""}</span>
              ⚽ {g.scorer || "Tor"}
              {g.isPenalty && <span className="ml-1 text-xs text-white/45">(Elfm.)</span>}
              {g.isOwnGoal && <span className="ml-1 text-xs text-white/45">(ET)</span>}
            </li>
          ))}
        </ul>
      )}
      {match.venue && (
        <p className="mt-3 flex items-center gap-1 text-xs text-white/45">
          <MapPin size={13} aria-hidden /> {match.venue}
        </p>
      )}
    </article>
  );
}

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { leagueService } from "../services/leagueService";
import type { GoalEvent, LeagueConfig, Match, MatchDetails, MatchStat } from "../types";
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

// Torschützen-Liste: Heimtore links, Auswärtstore rechtsbündig (seitenrichtig).
function GoalList({ goals }: { goals: GoalEvent[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {goals.map((g, i) => {
        const right = g.team === "away";
        return (
          <li key={i} className={`flex items-baseline gap-2 ${right ? "flex-row-reverse text-right" : ""}`}>
            <span className="w-9 shrink-0 font-bold tabular-nums text-gold">{g.minute ?? ""}</span>
            <span className="text-white/85">
              ⚽ {g.scorer || "Tor"}
              {g.assist && <span className="text-white/45"> (Vorlage: {g.assist})</span>}
              {g.isPenalty && <span className="ml-1 text-xs text-white/45">(Elfm.)</span>}
              {g.isOwnGoal && <span className="ml-1 text-xs text-white/45">(ET)</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const toNum = (v: string | number | null): number | null => {
  if (v == null) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};
const fmtStat = (v: string | number | null): string => (v == null || v === "" ? "–" : String(v));

// Statistik als Vergleichsbalken (Heim = Pitch-Grün, Auswärts = Gold).
function StatBars({ stats }: { stats: MatchStat[] }) {
  return (
    <div className="space-y-2">
      {stats.map((s, i) => {
        const h = toNum(s.home);
        const a = toNum(s.away);
        const total = (h ?? 0) + (a ?? 0);
        const homePct = total > 0 && h != null ? (h / total) * 100 : 50;
        return (
          <div key={i}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold tabular-nums text-white">{fmtStat(s.home)}</span>
              <span className="text-white/60">{s.type}</span>
              <span className="font-bold tabular-nums text-white">{fmtStat(s.away)}</span>
            </div>
            <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="bg-pitch" style={{ width: `${homePct}%` }} />
              <div className="bg-gold/70" style={{ width: `${100 - homePct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type DetailState = { status: "idle" | "loading" | "done" | "error"; data?: MatchDetails; error?: string };

export function MatchCard({ match, league }: Props) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DetailState>({ status: "idle" });

  const favorite = isFav(league, match.home.name) || isFav(league, match.away.name);
  const showScore = match.status !== "scheduled" && match.scoreHome != null && match.scoreAway != null;
  const inlineGoals = match.goals ?? []; // OpenLigaDB liefert Torschützen direkt mit.
  const supportsDetails = leagueService.supportsMatchDetails(league); // API-Football: events + statistics
  // Aufklappbar, wenn es etwas zu zeigen gibt: Inline-Tore ODER ladbare Details.
  const expandable = match.status !== "scheduled" && (inlineGoals.length > 0 || supportsDetails);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && supportsDetails && detail.status === "idle") {
      setDetail({ status: "loading" });
      leagueService
        .getMatchDetails(league, match)
        .then((data) => setDetail({ status: "done", data }))
        .catch((e: unknown) => setDetail({ status: "error", error: e instanceof Error ? e.message : "Details konnten nicht geladen werden." }));
    }
  };

  // Welche Tore im aufgeklappten Bereich? Geladene Details bevorzugt, sonst Inline.
  const panelGoals = detail.data?.goals.length ? detail.data.goals : inlineGoals;

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

      {expandable && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="mt-3 flex w-full items-center justify-center gap-1 border-t border-white/10 pt-3 text-xs font-bold uppercase tracking-wide text-white/55 transition-colors hover:text-white"
        >
          {open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
          {open ? "Details verbergen" : "Tore & Statistik"}
        </button>
      )}

      {open && (
        <div className="mt-3 space-y-4">
          {/* Torschützen */}
          <section>
            <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-white/45">Tore</h4>
            {detail.status === "loading" && panelGoals.length === 0 ? (
              <p className="text-sm text-white/50">Lade Torschützen…</p>
            ) : panelGoals.length > 0 ? (
              <GoalList goals={panelGoals} />
            ) : (
              <p className="text-sm text-white/45">Keine Torschützen-Daten für dieses Spiel.</p>
            )}
          </section>

          {/* Statistik */}
          <section>
            <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-white/45">Statistik</h4>
            {!supportsDetails ? (
              <p className="text-sm text-white/45">Erweiterte Statistik für diese Liga (Quelle OpenLigaDB) nicht verfügbar.</p>
            ) : detail.status === "loading" ? (
              <p className="text-sm text-white/50">Lade Statistik…</p>
            ) : detail.status === "error" ? (
              <p className="text-sm text-ember">{detail.error}</p>
            ) : detail.data && detail.data.statistics.length > 0 ? (
              <StatBars stats={detail.data.statistics} />
            ) : (
              <p className="text-sm text-white/45">Für dieses Spiel liegt keine Statistik vor.</p>
            )}
          </section>
        </div>
      )}

      {match.venue && (
        <p className="mt-3 flex items-center gap-1 text-xs text-white/45">
          <MapPin size={13} aria-hidden /> {match.venue}
        </p>
      )}
    </article>
  );
}

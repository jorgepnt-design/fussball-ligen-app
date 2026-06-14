import type { GoalEvent, LeagueConfig, LeagueProvider, Match, MatchDetails, MatchStat, MatchStatus, ScorerRow, StandingRow, Team } from "../../types";

// API-Football (v3) ueber einen Cloudflare-Worker-Proxy, der den API-Key versteckt
// und CORS hinzufuegt. Der Proxy leitet /api/<pfad> an https://v3.football.api-sports.io/<pfad> weiter.
// Proxy-URL kommt aus VITE_PROXY_BASE_URL (.env). Ohne URL -> klarer Hinweis in der UI.
const PROXY = (import.meta.env.VITE_PROXY_BASE_URL as string | undefined)?.replace(/\/$/, "");

export class ProxyNotConfiguredError extends Error {
  constructor() {
    super(
      "Für diese Liga ist noch kein Daten-Proxy konfiguriert. Lege VITE_PROXY_BASE_URL an (Cloudflare-Worker mit API-Football-Key) – siehe proxy/README.md.",
    );
    this.name = "ProxyNotConfiguredError";
  }
}

interface AfTeam {
  id: number;
  name: string;
  logo?: string;
}

const liveCodes = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);
const finishedCodes = new Set(["FT", "AET", "PEN"]);
const mapStatus = (short: string): MatchStatus => (finishedCodes.has(short) ? "finished" : liveCodes.has(short) ? "live" : "scheduled");

const toTeam = (t: AfTeam): Team => ({ id: String(t.id), name: t.name, logoUrl: t.logo });

// API-Football-Statistik-Typen (englisch) → deutsches Label, in Anzeige-Reihenfolge.
const STAT_LABELS: Array<[string, string]> = [
  ["Ball Possession", "Ballbesitz"],
  ["expected_goals", "xG (erwartete Tore)"],
  ["Total Shots", "Torschüsse"],
  ["Shots on Goal", "Schüsse aufs Tor"],
  ["Shots off Goal", "Schüsse daneben"],
  ["Blocked Shots", "Geblockte Schüsse"],
  ["Corner Kicks", "Eckbälle"],
  ["Offsides", "Abseits"],
  ["Fouls", "Fouls"],
  ["Yellow Cards", "Gelbe Karten"],
  ["Red Cards", "Rote Karten"],
  ["Goalkeeper Saves", "Paraden"],
  ["Total passes", "Pässe gesamt"],
  ["Passes accurate", "Pässe angekommen"],
  ["Passes %", "Passquote"],
];

const request = async <T>(path: string, params: Record<string, string | number>): Promise<T> => {
  if (!PROXY) throw new ProxyNotConfiguredError();
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const response = await fetch(`${PROXY}/api/${path}?${query}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Datenanbieter-Anfrage fehlgeschlagen (HTTP ${response.status})`);
  const json = (await response.json()) as { response?: T; errors?: unknown };
  // API-Football meldet Fehler je nach Fall als Array ODER als Objekt
  // (z. B. { plan: "..." } bei fehlendem Saison-Zugang, { rateLimit: "..." } bei Limit).
  // Beide Formen einsammeln und die Originalmeldung in der UI sichtbar machen.
  const errs = json.errors;
  const messages = Array.isArray(errs)
    ? errs.map(String)
    : errs && typeof errs === "object"
      ? Object.values(errs as Record<string, unknown>).map(String)
      : [];
  if (messages.length > 0) {
    throw new Error(`Datenanbieter meldete einen Fehler: ${messages.join(" ")}`);
  }
  return (json.response ?? []) as T;
};

export const apiFootballProvider: LeagueProvider = {
  async getMatches(league: LeagueConfig, season: string): Promise<Match[]> {
    interface AfFixture {
      fixture: { id: number; date: string; status: { short: string; elapsed: number | null }; venue?: { name?: string } };
      teams: { home: AfTeam; away: AfTeam };
      goals: { home: number | null; away: number | null };
      league?: { round?: string };
    }
    const data = await request<AfFixture[]>("fixtures", { league: league.apiFootballId ?? 0, season });
    return data
      .map((f) => ({
        id: String(f.fixture.id),
        dateUtc: f.fixture.date,
        matchday: f.league?.round,
        status: mapStatus(f.fixture.status.short),
        liveMinute: f.fixture.status.elapsed != null ? `${f.fixture.status.elapsed}'` : null,
        home: toTeam(f.teams.home),
        away: toTeam(f.teams.away),
        scoreHome: f.goals.home,
        scoreAway: f.goals.away,
        venue: f.fixture.venue?.name,
      }))
      .sort((a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime());
  },

  async getStandings(league: LeagueConfig, season: string): Promise<StandingRow[]> {
    interface AfStandingsResponse {
      league: { standings: Array<Array<{ rank: number; team: AfTeam; all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }; goalsDiff: number; points: number }>> };
    }
    const data = await request<AfStandingsResponse[]>("standings", { league: league.apiFootballId ?? 0, season });
    const table = data[0]?.league.standings[0] ?? [];
    return table.map((row) => ({
      rank: row.rank,
      team: toTeam(row.team),
      played: row.all.played,
      won: row.all.win,
      draw: row.all.draw,
      lost: row.all.lose,
      goalsFor: row.all.goals.for,
      goalsAgainst: row.all.goals.against,
      goalDiff: row.goalsDiff,
      points: row.points,
    }));
  },

  async getScorers(league: LeagueConfig, season: string): Promise<ScorerRow[]> {
    interface AfScorer {
      player: { name: string };
      statistics: Array<{ team: AfTeam; goals: { total: number | null; assists: number | null }; penalty: { scored: number | null } }>;
    }
    const data = await request<AfScorer[]>("players/topscorers", { league: league.apiFootballId ?? 0, season });
    return data.map((s, index) => {
      const stat = s.statistics[0];
      return {
        rank: index + 1,
        name: s.player.name,
        team: stat ? toTeam(stat.team) : undefined,
        goals: stat?.goals.total ?? 0,
        assists: stat?.goals.assists ?? undefined,
        penalties: stat?.penalty.scored ?? undefined,
      };
    });
  },

  async getMatchDetails(_league: LeagueConfig, match: Match): Promise<MatchDetails> {
    interface AfEvent {
      time: { elapsed: number | null; extra: number | null };
      team: { id: number };
      player: { name: string | null };
      assist: { name: string | null };
      type: string; // "Goal" | "Card" | "subst" | "Var"
      detail: string; // "Normal Goal" | "Penalty" | "Own Goal" | "Missed Penalty"
    }
    interface AfStatsTeam {
      team: { id: number };
      statistics: Array<{ type: string; value: string | number | null }>;
    }

    // Beide Detail-Endpunkte parallel; jeweils ein Aufruf pro Spiel (durch den
    // Proxy 10 Min gecacht, schont das Free-Tier-Kontingent).
    const [events, statsTeams] = await Promise.all([
      request<AfEvent[]>("fixtures/events", { fixture: match.id }),
      request<AfStatsTeam[]>("fixtures/statistics", { fixture: match.id }),
    ]);

    const goals: GoalEvent[] = events
      .filter((e) => e.type === "Goal" && e.detail !== "Missed Penalty")
      .map((e) => {
        const extra = e.time.extra ? `+${e.time.extra}` : "";
        return {
          minute: e.time.elapsed != null ? `${e.time.elapsed}${extra}'` : undefined,
          scorer: e.player.name ?? "Tor",
          assist: e.assist.name ?? undefined,
          team: String(e.team.id) === match.home.id ? "home" : "away",
          isPenalty: e.detail === "Penalty",
          isOwnGoal: e.detail === "Own Goal",
        };
      });

    const findVal = (teamId: string, type: string): string | number | null => {
      const item = statsTeams.find((s) => String(s.team.id) === teamId)?.statistics.find((x) => x.type === type);
      return item ? item.value : null;
    };
    const statistics: MatchStat[] = STAT_LABELS.map(([eng, de]) => ({
      type: de,
      home: findVal(match.home.id, eng),
      away: findVal(match.away.id, eng),
    })).filter((s) => s.home != null || s.away != null);

    return { goals, statistics };
  },
};

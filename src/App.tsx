import { BarChart3, CalendarDays, Goal } from "lucide-react";
import { useMemo, useState } from "react";
import { FavoriteSelector } from "./components/FavoriteSelector";
import { LeagueSwitcher } from "./components/LeagueSwitcher";
import { NotificationToggle } from "./components/NotificationToggle";
import { ErrorState, LoadingState } from "./components/states";
import { defaultLeagueId, getLeague, leagues } from "./config/leagues";
import { useFavoriteTeams } from "./hooks/useFavoriteTeams";
import { useGoalNotifications } from "./hooks/useGoalNotifications";
import { useLeagueData } from "./hooks/useLeagueData";
import { usePush } from "./hooks/usePush";
import { SchedulePage } from "./pages/SchedulePage";
import { ScorersPage } from "./pages/ScorersPage";
import { TablePage } from "./pages/TablePage";

type Tab = "schedule" | "table" | "scorers";

// Zuletzt gewählte Liga/Saison merken, damit die App dort wieder öffnet
// (und der markierte Verein direkt sichtbar ist).
const LS_LEAGUE = "fussball-ligen:lastLeague";
const LS_SEASON = "fussball-ligen:lastSeason";
const FAVORITES_KEY = "fussball-ligen:favoriteTeams";
const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* localStorage nicht verfügbar */
  }
};

const tabs = [
  { id: "schedule", label: "Spielplan", icon: CalendarDays },
  { id: "table", label: "Tabelle", icon: BarChart3 },
  { id: "scorers", label: "Torschützen", icon: Goal },
] as const;

export default function App() {
  const [leagueId, setLeagueId] = useState(() => {
    const saved = safeGet(LS_LEAGUE);
    return saved && leagues.some((l) => l.id === saved) ? saved : defaultLeagueId;
  });
  const league = getLeague(leagueId);
  const [season, setSeason] = useState(() => {
    const saved = safeGet(LS_SEASON);
    return saved && league.seasons.includes(saved) ? saved : league.defaultSeason;
  });
  const [tab, setTab] = useState<Tab>("schedule");

  const { matches, standings, scorers, isLoading, error, isLive } = useLeagueData(league, season);

  // Selbst gewählte Lieblingsvereine (mehrere möglich, je Liga, im Browser gespeichert).
  const { stored: storedFavorites, setFavorites } = useFavoriteTeams(league.id);

  // Vereinsliste der aktuellen Liga/Saison – primär aus der Tabelle, sonst aus den Spielen.
  const teams = useMemo(() => {
    const set = new Set<string>();
    for (const row of standings) set.add(row.team.name);
    if (set.size === 0) {
      for (const m of matches) {
        set.add(m.home.name);
        set.add(m.away.name);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [standings, matches]);

  // Default-Favorit (z. B. Darmstadt) als vollständigen Vereinsnamen auflösen.
  const defaultFavorites = useMemo(() => {
    const fav = league.favoriteTeamName;
    if (!fav) return [];
    return [teams.find((t) => t.includes(fav)) ?? fav];
  }, [teams, league.favoriteTeamName]);

  // Eigene Wahl hat Vorrang ([] = bewusst keiner); sonst Liga-Default.
  const favoriteTeams = storedFavorites !== undefined ? storedFavorites : defaultFavorites;

  // Tor-Benachrichtigungen: Push-Abo über alle als Favorit markierten Vereine (alle Ligen).
  // Nur deutsche Ligen liefern Live-Tore, aber zusätzliche Namen schaden nicht.
  const allFavoriteTeams = useMemo(() => {
    const set = new Set<string>(favoriteTeams);
    try {
      const map = JSON.parse(safeGet(FAVORITES_KEY) ?? "{}") as Record<string, unknown>;
      for (const value of Object.values(map)) if (Array.isArray(value)) for (const t of value) if (typeof t === "string") set.add(t);
    } catch {
      /* ignore */
    }
    return [...set];
  }, [favoriteTeams]);

  const push = usePush(allFavoriteTeams);
  // In-App-Benachrichtigung (sofort, solange offen); der Service Worker unterdrückt dann Push-Dubletten.
  useGoalNotifications(matches, favoriteTeams, push.enabled);

  const changeLeague = (id: string) => {
    setLeagueId(id);
    const nextSeason = getLeague(id).defaultSeason;
    setSeason(nextSeason);
    safeSet(LS_LEAGUE, id);
    safeSet(LS_SEASON, nextSeason);
  };

  const changeSeason = (s: string) => {
    setSeason(s);
    safeSet(LS_SEASON, s);
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-4 pb-24">
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">Fussball-Ligen</p>
        <h1 className="mb-3 text-2xl font-black md:text-3xl">
          {league.flag} {league.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <LeagueSwitcher league={league} season={season} onLeagueChange={changeLeague} onSeasonChange={changeSeason} />
          <FavoriteSelector teams={teams} selected={favoriteTeams} onChange={setFavorites} />
          {favoriteTeams.length > 0 && <NotificationToggle push={push} />}
        </div>
      </header>

      <main>
        {error ? (
          <ErrorState>{error}</ErrorState>
        ) : isLoading ? (
          <LoadingState label="Daten werden geladen …" />
        ) : (
          <>
            {tab === "schedule" && <SchedulePage matches={matches} league={league} season={season} favoriteTeams={favoriteTeams} isLive={isLive} />}
            {tab === "table" && <TablePage standings={standings} favoriteTeams={favoriteTeams} />}
            {tab === "scorers" && <ScorersPage scorers={scorers} />}
          </>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-night/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1 px-3 py-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-md text-xs font-bold ${tab === id ? "bg-gold text-night" : "text-white/70"}`}
            >
              <Icon size={19} aria-hidden />
              <span className="mt-1">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

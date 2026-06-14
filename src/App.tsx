import { BarChart3, CalendarDays, Goal } from "lucide-react";
import { useMemo, useState } from "react";
import { FavoriteSelector } from "./components/FavoriteSelector";
import { LeagueSwitcher } from "./components/LeagueSwitcher";
import { ErrorState, LoadingState } from "./components/states";
import { defaultLeagueId, getLeague } from "./config/leagues";
import { useFavoriteTeam } from "./hooks/useFavoriteTeam";
import { useLeagueData } from "./hooks/useLeagueData";
import { SchedulePage } from "./pages/SchedulePage";
import { ScorersPage } from "./pages/ScorersPage";
import { TablePage } from "./pages/TablePage";

type Tab = "schedule" | "table" | "scorers";

const tabs = [
  { id: "schedule", label: "Spielplan", icon: CalendarDays },
  { id: "table", label: "Tabelle", icon: BarChart3 },
  { id: "scorers", label: "Torschützen", icon: Goal },
] as const;

export default function App() {
  const [leagueId, setLeagueId] = useState(defaultLeagueId);
  const league = getLeague(leagueId);
  const [season, setSeason] = useState(league.defaultSeason);
  const [tab, setTab] = useState<Tab>("schedule");

  const { matches, standings, scorers, isLoading, error } = useLeagueData(league, season);

  // Selbst gewählter Lieblingsverein (je Liga, im Browser gespeichert).
  const { stored: storedFavorite, setFavorite } = useFavoriteTeam(league.id);

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
  const defaultFavorite = useMemo(() => {
    const fav = league.favoriteTeamName;
    if (!fav) return "";
    return teams.find((t) => t.includes(fav)) ?? fav;
  }, [teams, league.favoriteTeamName]);

  // Eigene Wahl hat Vorrang; "" = bewusst keiner; sonst Liga-Default.
  const favoriteValue = storedFavorite !== undefined ? storedFavorite : defaultFavorite;
  const favoriteTeamName = favoriteValue || undefined;

  const changeLeague = (id: string) => {
    setLeagueId(id);
    setSeason(getLeague(id).defaultSeason);
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-4 pb-24">
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">Fussball-Ligen</p>
        <h1 className="mb-3 text-2xl font-black md:text-3xl">
          {league.flag} {league.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <LeagueSwitcher league={league} season={season} onLeagueChange={changeLeague} onSeasonChange={setSeason} />
          <FavoriteSelector teams={teams} value={favoriteValue} onChange={setFavorite} />
        </div>
      </header>

      <main>
        {error ? (
          <ErrorState>{error}</ErrorState>
        ) : isLoading ? (
          <LoadingState label="Daten werden geladen …" />
        ) : (
          <>
            {tab === "schedule" && <SchedulePage matches={matches} league={league} season={season} favoriteTeamName={favoriteTeamName} />}
            {tab === "table" && <TablePage standings={standings} favoriteTeamName={favoriteTeamName} />}
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

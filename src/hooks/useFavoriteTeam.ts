import { useCallback, useEffect, useState } from "react";

// Merkt sich je Liga den selbst gewählten Lieblingsverein (im Browser, localStorage).
// Wert-Semantik pro Liga-ID:
//   - nicht vorhanden  -> keine eigene Wahl getroffen (App nutzt ggf. den Default aus leagues.ts)
//   - ""               -> bewusst KEIN Favorit
//   - "<Teamname>"     -> dieser Verein wird markiert
const KEY = "fussball-ligen:favoriteTeams";

type FavMap = Record<string, string>;

const readAll = (): FavMap => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavMap) : {};
  } catch {
    return {};
  }
};

export function useFavoriteTeam(leagueId: string): {
  stored: string | undefined; // exakt wie gespeichert (undefined = keine Wahl)
  setFavorite: (teamName: string | undefined) => void;
} {
  const [map, setMap] = useState<FavMap>(readAll);

  // Über mehrere Tabs/Fenster synchron halten.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setMap(readAll());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setFavorite = useCallback(
    (teamName: string | undefined) => {
      setMap((prev) => {
        const next = { ...prev };
        if (teamName === undefined) delete next[leagueId];
        else next[leagueId] = teamName;
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* localStorage nicht verfügbar – nur In-Memory */
        }
        return next;
      });
    },
    [leagueId],
  );

  return { stored: map[leagueId], setFavorite };
}

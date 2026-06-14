import { useCallback, useEffect, useState } from "react";

// Merkt sich je Liga die selbst gewählten Lieblingsvereine (mehrere möglich, localStorage).
// Wert-Semantik pro Liga-ID:
//   - nicht vorhanden  -> keine eigene Wahl (App nutzt ggf. den Default aus leagues.ts)
//   - []               -> bewusst KEINE Favoriten
//   - ["A","B", …]     -> diese Vereine werden markiert
const KEY = "fussball-ligen:favoriteTeams";

type FavMap = Record<string, string[]>;

const readAll = (): FavMap => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: FavMap = {};
    for (const [league, value] of Object.entries(parsed)) {
      // Altes Format (ein String pro Liga) auf Array migrieren.
      if (typeof value === "string") out[league] = value ? [value] : [];
      else if (Array.isArray(value)) out[league] = value.filter((v): v is string => typeof v === "string");
    }
    return out;
  } catch {
    return {};
  }
};

export function useFavoriteTeams(leagueId: string): {
  stored: string[] | undefined; // undefined = keine eigene Wahl getroffen
  setFavorites: (teamNames: string[]) => void;
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

  const setFavorites = useCallback(
    (teamNames: string[]) => {
      setMap((prev) => {
        const next = { ...prev, [leagueId]: teamNames };
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

  return { stored: map[leagueId], setFavorites };
}

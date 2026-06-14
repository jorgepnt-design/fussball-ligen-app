import { useEffect, useRef } from "react";
import type { Match } from "../types";

const involvesAny = (m: Match, teams: string[]) => teams.some((f) => m.home.name.includes(f) || m.away.name.includes(f));

// Schickt eine Benachrichtigung, sobald in einem Live-Spiel eines markierten Vereins
// ein Tor fällt. Erkennung über den Spielstand-Vergleich zwischen zwei Aktualisierungen
// (useLeagueData lädt bei Live-Spielen alle 30 s nach).
// Hinweis: funktioniert nur, solange die App geöffnet ist (reines Frontend, kein Server).
export function useGoalNotifications(matches: Match[], favoriteTeams: string[], enabled: boolean) {
  const prevScore = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const canNotify = enabled && typeof Notification !== "undefined" && Notification.permission === "granted";

    for (const m of matches) {
      if (m.status !== "live" || m.scoreHome == null || m.scoreAway == null) continue;

      const key = `${m.scoreHome}:${m.scoreAway}`;
      const before = prevScore.current.get(m.id);
      prevScore.current.set(m.id, key);

      // Nur benachrichtigen, wenn wir vorher schon einen Stand kannten und er gestiegen ist.
      if (!canNotify || before === undefined || before === key) continue;
      if (!involvesAny(m, favoriteTeams)) continue;

      const [bh, ba] = before.split(":").map(Number);
      const scored = m.scoreHome > bh || m.scoreAway > ba;
      if (!scored) continue;

      const scoringTeam = m.scoreHome > bh ? m.home.name : m.away.name;
      try {
        new Notification("⚽ Tor!", {
          body: `${scoringTeam}\n${m.home.name} ${m.scoreHome} : ${m.scoreAway} ${m.away.name}`,
          icon: `${import.meta.env.BASE_URL}icon-192.png`,
          tag: `goal-${m.id}-${key}`, // pro Spielstand eindeutig → jedes Tor alarmiert
        });
      } catch {
        /* Notification nicht verfügbar */
      }
    }
  }, [matches, favoriteTeams, enabled]);
}

import { Crown, Trophy } from "lucide-react";
import { ClubLogo } from "../components/ClubLogo";
import { ScorersTable } from "../components/ScorersTable";
import { EmptyState } from "../components/states";
import type { ScorerRow } from "../types";

export function ScorersPage({ scorers }: { scorers: ScorerRow[] }) {
  if (scorers.length === 0) return <EmptyState title="Keine Torschützen">Für diese Liga/Saison liegen keine Torschützendaten vor.</EmptyState>;
  const leader = scorers[0];

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-lg border border-gold/40 bg-[linear-gradient(135deg,rgba(214,168,79,.22),rgba(255,255,255,.05))] p-5 shadow-glow">
        <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-night/60">
            <Crown className="text-gold" size={28} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gold">
              <Trophy size={14} aria-hidden /> Führender Torjäger
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-black md:text-3xl">
              {leader.team && <ClubLogo team={leader.team} className="h-7 w-7" />}
              <span className="truncate">{leader.name}</span>
            </h2>
            <p className="mt-0.5 text-sm text-white/70">
              {leader.team?.name} · <span className="font-black text-gold">{leader.goals} Tore</span>
            </p>
          </div>
        </div>
      </section>
      <ScorersTable rows={scorers} />
    </div>
  );
}

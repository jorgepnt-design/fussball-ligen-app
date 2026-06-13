import type { Team } from "../types";

interface Props {
  team: Team;
  className?: string;
}

// Vereinslogo (OpenLigaDB/API-Football liefern URLs); Fallback: Initialen.
export function ClubLogo({ team, className = "h-5 w-5" }: Props) {
  if (!team.logoUrl) {
    const initials = (team.shortName ?? team.name).slice(0, 3).toUpperCase();
    return (
      <span className={`inline-flex items-center justify-center rounded-sm bg-white/10 text-[9px] font-black ${className}`}>{initials}</span>
    );
  }
  return <img src={team.logoUrl} alt="" loading="lazy" aria-hidden className={`inline-block object-contain ${className}`} />;
}

import { Star } from "lucide-react";

interface Props {
  teams: string[]; // Vereine der aktuellen Liga/Saison
  value: string; // aktuell markierter Verein ("" = keiner)
  onChange: (teamName: string) => void;
}

// Lässt den Nutzer einen Verein der aktuellen Liga markieren (wie Darmstadt).
// Ausgeblendet, solange keine Teams geladen sind (z. B. leere/zukünftige Saison).
export function FavoriteSelector({ teams, value, onChange }: Props) {
  if (teams.length === 0) return null;
  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-night px-3 py-2">
      <Star size={16} className={value ? "fill-gold text-gold" : "text-white/50"} aria-hidden />
      <span className="sr-only">Mein Verein</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-7 bg-transparent font-bold text-white focus:outline-none"
        aria-label="Mein Verein markieren"
      >
        <option value="">Mein Verein wählen …</option>
        {teams.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

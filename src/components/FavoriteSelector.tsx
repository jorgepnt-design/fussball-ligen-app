import { Star, X } from "lucide-react";

interface Props {
  teams: string[]; // Vereine der aktuellen Liga/Saison
  selected: string[]; // bereits markierte Vereine
  onChange: (teamNames: string[]) => void;
}

// Mehrfachauswahl der Lieblingsvereine: hinzufügen per Dropdown, entfernen per ×-Chip.
// Ausgeblendet, solange keine Teams geladen sind (z. B. leere/zukünftige Saison).
export function FavoriteSelector({ teams, selected, onChange }: Props) {
  if (teams.length === 0) return null;

  const available = teams.filter((t) => !selected.includes(t));
  const add = (name: string) => {
    if (name && !selected.includes(name)) onChange([...selected, name]);
  };
  const remove = (name: string) => onChange(selected.filter((n) => n !== name));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-night px-3 py-2">
        <Star size={16} className={selected.length ? "fill-gold text-gold" : "text-white/50"} aria-hidden />
        <select
          value=""
          onChange={(e) => add(e.target.value)}
          className="min-h-7 bg-night font-bold text-white focus:outline-none"
          aria-label="Verein zu Favoriten hinzufügen"
          disabled={available.length === 0}
        >
          {/* Optionen explizit dunkel, sonst rendert die geöffnete Liste weiß (weiße Schrift unsichtbar). */}
          <option value="" className="bg-night text-white">
            {selected.length ? "Verein hinzufügen …" : "Mein Verein wählen …"}
          </option>
          {available.map((t) => (
            <option key={t} value={t} className="bg-night text-white">
              {t}
            </option>
          ))}
        </select>
      </div>

      {selected.map((name) => (
        <span key={name} className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/15 px-2 py-1 text-sm font-bold text-gold">
          {name}
          <button type="button" onClick={() => remove(name)} aria-label={`${name} entfernen`} className="-mr-0.5 rounded p-0.5 hover:bg-gold/20">
            <X size={14} aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}

import {
  CATEGORIES,
  STATUTS,
  TYPES_DIFFUSION,
  type Categorie,
  type Statut,
  type TypeDiffusion,
} from "../../utils/epgHelpers";
import { Icone } from "../ui/kit";

/** Puce catégorie — pastille colorée + libellé. */
export function CategoriePuce({ categorie, compact = false }: { categorie: Categorie; compact?: boolean }) {
  const c = CATEGORIES[categorie];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border font-semibold"
      style={{
        color: c.color,
        borderColor: `${c.color}38`,
        background: `${c.color}0f`,
        fontSize: compact ? 10 : 11,
        padding: compact ? "2px 7px" : "3px 9px",
      }}
    >
      <Icone name={c.icon} size={compact ? 11 : 13} />
      {c.label}
    </span>
  );
}

/** Badge type de diffusion (direct / enregistré / rediffusion). */
export function TypeDiffusionBadge({ type, compact = false }: { type: TypeDiffusion; compact?: boolean }) {
  const t = TYPES_DIFFUSION[type];
  const estDirect = type === "direct";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-mono font-semibold border ${
        estDirect ? "text-live border-live/30 bg-live/5" : "text-ink-500 border-ink-200 bg-ink-50"
      }`}
      style={{ fontSize: compact ? 9.5 : 10.5, padding: compact ? "1.5px 5px" : "2.5px 7px" }}
      title={t.label}
    >
      <Icone name={t.icon} size={compact ? 10 : 12} filled={estDirect} />
      {t.short}
    </span>
  );
}

/** Badge statut de workflow ; `live` force l'affichage "En direct". */
export function StatutBadge({ statut, live = false, compact = false }: { statut: Statut; live?: boolean; compact?: boolean }) {
  if (live) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-md font-bold text-live border border-live/30 bg-live/10"
        style={{ fontSize: compact ? 9.5 : 11, padding: compact ? "1.5px 6px" : "3px 8px" }}
      >
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-live animate-pulse-dot" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-live" />
        </span>
        EN DIRECT
      </span>
    );
  }
  const s = STATUTS[statut];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold ${s.chip}`}
      style={{ fontSize: compact ? 9.5 : 11, padding: compact ? "1.5px 6px" : "3px 8px" }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

/** Pastille ronde d'accent chaîne. */
export function PastilleChaine({ nom, accent, compact = false }: { nom: string; accent: string; compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold text-ink-600"
      style={{ fontSize: compact ? 10 : 11.5 }}
    >
      <span className="w-2 h-2 rounded-[3px] flex-none" style={{ background: accent }} />
      {nom}
    </span>
  );
}

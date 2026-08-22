export type Role = "admin" | "directeur" | "regie";
export type Statut = "brouillon" | "en_attente_validation" | "valide" | "diffusion";
export type TypeDiffusion = "direct" | "enregistre" | "rediffusion";
export type Categorie = "information" | "divertissement" | "sport" | "culture" | "film";

export interface Chaine {
  id: string;
  nom: string;
  accent: string;
}

export interface Emission {
  id: string;
  titre: string;
  chaine: string;
  jour: string; // YYYY-MM-DD
  debut: string; // HH:MM
  fin: string; // HH:MM
  description: string;
  statut: Statut;
  type_diffusion: TypeDiffusion;
  categorie: Categorie;
  commentaire_rejet?: string;
  updated_at: number;
}

export interface User {
  id: string;
  nom: string;
  email: string;
  role: Role;
}

/* ——— Référentiels ——— */

export const STATUTS: Record<Statut, { label: string; dot: string; text: string; chip: string }> = {
  brouillon: {
    label: "Brouillon",
    dot: "#94948e",
    text: "#6e6e68",
    chip: "bg-ink-100 text-ink-600 border-ink-200",
  },
  en_attente_validation: {
    label: "À valider",
    dot: "#b26a00",
    text: "#b26a00",
    chip: "bg-amber-50 text-warn border-amber-200",
  },
  valide: {
    label: "Validée",
    dot: "#2e7d32",
    text: "#2e7d32",
    chip: "bg-emerald-50 text-ok border-emerald-200",
  },
  diffusion: {
    label: "En diffusion",
    dot: "#e53935",
    text: "#e53935",
    chip: "bg-red-50 text-live border-red-200",
  },
};

export const CATEGORIES: Record<Categorie, { label: string; color: string; icon: string }> = {
  information: { label: "Information", color: "#0f62b0", icon: "newspaper" },
  divertissement: { label: "Divertissement", color: "#c2185b", icon: "celebration" },
  sport: { label: "Sport", color: "#2e7d32", icon: "sports_soccer" },
  culture: { label: "Culture", color: "#9a6a00", icon: "museum" },
  film: { label: "Film & série", color: "#00796b", icon: "movie" },
};

export const TYPES_DIFFUSION: Record<TypeDiffusion, { label: string; icon: string; short: string }> = {
  direct: { label: "Direct", icon: "cell_tower", short: "DIR" },
  enregistre: { label: "Enregistré", icon: "fiber_manual_record", short: "ENR" },
  rediffusion: { label: "Rediffusion", icon: "repeat", short: "RED" },
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  directeur: "Directeur d'Antenne",
  regie: "Régie de diffusion",
};

export const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/* ——— Dates & heures ——— */

export function isoJour(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}

export function parseJour(iso: string): Date {
  const [y, m, j] = iso.split("-").map(Number);
  return new Date(y, m - 1, j);
}

export function lundiDe(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (out.getDay() + 6) % 7; // 0 = lundi
  out.setDate(out.getDate() - day);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function semaineDe(lundi: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => isoJour(addDays(lundi, i)));
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS_LONG = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export function fmtJourLong(iso: string): string {
  const d = parseJour(iso);
  return `${JOURS_LONG[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

export function fmtJourCourt(iso: string): string {
  const d = parseJour(iso);
  return `${JOURS_COURT[(d.getDay() + 6) % 7]} ${d.getDate()} ${MOIS_COURT[d.getMonth()]}`;
}

export function fmtSemaine(lundi: Date): string {
  const fin = addDays(lundi, 6);
  const memeMois = lundi.getMonth() === fin.getMonth();
  return `Semaine du ${lundi.getDate()} ${memeMois ? "au" : MOIS_COURT[lundi.getMonth()] + " au"} ${fin.getDate()} ${MOIS_COURT[fin.getMonth()]}`;
}

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function finEnMin(e: Emission): number {
  const m = toMin(e.fin);
  return m === 0 ? 1440 : m; // "00:00" = minuit fin de journée
}

export function dureeLabel(debut: string, fin: string): string {
  const d = finEnMin({ fin } as Emission) - toMin(debut);
  const h = Math.floor(d / 60);
  const m = d % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/* ——— Logique EPG ——— */

export function chevauche(a: Emission, b: Emission): boolean {
  return (
    a.chaine === b.chaine &&
    a.jour === b.jour &&
    toMin(a.debut) < finEnMin(b) &&
    toMin(b.debut) < finEnMin(a)
  );
}

export function conflitsDe(e: Emission, toutes: Emission[]): Emission[] {
  return toutes.filter((x) => x.id !== e.id && chevauche(e, x));
}

export function estEnDirect(e: Emission, now: Date): boolean {
  if (e.statut !== "valide" && e.statut !== "diffusion") return false;
  if (isoJour(now) !== e.jour) return false;
  const m = now.getHours() * 60 + now.getMinutes();
  return m >= toMin(e.debut) && m < finEnMin(e);
}

export function estPasse(e: Emission, now: Date): boolean {
  const today = isoJour(now);
  if (e.jour < today) return true;
  if (e.jour > today) return false;
  const m = now.getHours() * 60 + now.getMinutes();
  return m >= finEnMin(e);
}

export function progresPct(e: Emission, now: Date): number {
  const m = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const debut = toMin(e.debut);
  const fin = finEnMin(e);
  return Math.min(100, Math.max(0, ((m - debut) / (fin - debut)) * 100));
}

export function enDirectSurChaine(emissions: Emission[], chaineId: string, now: Date): Emission | undefined {
  return emissions.find((e) => e.chaine === chaineId && estEnDirect(e, now));
}

export function prochaineSurChaine(emissions: Emission[], chaineId: string, now: Date): Emission | undefined {
  const today = isoJour(now);
  const m = now.getHours() * 60 + now.getMinutes();
  return emissions
    .filter((e) => e.chaine === chaineId && e.jour === today && toMin(e.debut) >= m && (e.statut === "valide" || e.statut === "diffusion"))
    .sort((a, b) => toMin(a.debut) - toMin(b.debut))[0];
}

export function trousAntenne(emissions: Emission[], chaineId: string, jour: string): string[] {
  const valides = emissions
    .filter((e) => e.chaine === chaineId && e.jour === jour && (e.statut === "valide" || e.statut === "diffusion"))
    .sort((a, b) => toMin(a.debut) - toMin(b.debut));
  const trous: string[] = [];
  let curseur = 0;
  for (const e of valides) {
    if (toMin(e.debut) > curseur) trous.push(`${toHHMM(curseur)} – ${e.debut}`);
    curseur = Math.max(curseur, finEnMin(e));
  }
  if (curseur < 1440) trous.push(`${toHHMM(curseur)} – 00:00`);
  return trous;
}

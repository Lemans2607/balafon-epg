import type { Emission, Grille } from "../types";

/* ——— Temps ——— */

export const toMin = (s: string): number => {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const toHHMM = (min: number): string => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** fin « 00:00 » = minuit → 1440 */
export const finEnMin = (e: Emission): number => {
  const f = toMin(e.fin);
  return f === 0 ? 1440 : f;
};

/* ——— Dates ——— */

export const parseJour = (s: string): Date => new Date(`${s}T12:00:00`);

export const isoJour = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
};

export const lundiDe = (d: Date): Date => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const decal = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - decal);
  return x;
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const JOURS_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export const fmtJour = (iso: string): string => {
  const d = parseJour(iso);
  const idx = (d.getDay() + 6) % 7;
  return `${JOURS_LONG[idx]} ${d.getDate()} ${d.toLocaleDateString("fr-FR", { month: "short" })}`;
};

export const fmtJourCourt = (iso: string): string => {
  const d = parseJour(iso);
  return `${JOURS_COURT[(d.getDay() + 6) % 7]} ${d.getDate()}`;
};

export const fmtSemaine = (lundiIso: string): string => {
  const l = parseJour(lundiIso);
  const dim = addDays(l, 6);
  const f = (x: Date) => x.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `Semaine du ${f(l)} au ${f(dim)}`;
};

export const joursSemaine = (lundiIso: string): string[] =>
  Array.from({ length: 7 }, (_, i) => isoJour(addDays(parseJour(lundiIso), i)));

/* ——— Logique EPG ——— */

export const chevauche = (a: Emission, b: Emission): boolean =>
  a.jour === b.jour && toMin(a.debut) < finEnMin(b) && toMin(b.debut) < finEnMin(a);

export const conflitsDe = (grille: Grille): [Emission, Emission][] => {
  const out: [Emission, Emission][] = [];
  const parJour = new Map<string, Emission[]>();
  for (const e of grille.emissions) {
    if (!parJour.has(e.jour)) parJour.set(e.jour, []);
    parJour.get(e.jour)!.push(e);
  }
  for (const list of parJour.values()) {
    const tri = [...list].sort((a, b) => toMin(a.debut) - toMin(b.debut));
    for (let i = 0; i < tri.length; i++) {
      for (let j = i + 1; j < tri.length; j++) {
        if (chevauche(tri[i], tri[j])) out.push([tri[i], tri[j]]);
      }
    }
  }
  return out;
};

/** % de la journée (1440 min) couverte par la grille pour un jour donné */
export const couvertureJour = (grille: Grille, jour: string): number => {
  const total = grille.emissions
    .filter((e) => e.jour === jour)
    .reduce((s, e) => s + Math.max(0, finEnMin(e) - toMin(e.debut)), 0);
  return Math.min(100, Math.round((total / 1440) * 100));
};

export const couvertureMoyenne = (grille: Grille): number => {
  const jours = joursSemaine(grille.semaineDebut);
  const vals = jours.map((j) => couvertureJour(grille, j));
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

export const dureeLabel = (debut: string, fin: string): string => {
  const m = finEnMin({ fin } as Emission) - toMin(debut);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, "0")}` : `${h} h`;
};

/* ——— Direct / à suivre ——— */

export const minutesJour = (d: Date): number => d.getHours() * 60 + d.getMinutes();

export const estEnDirect = (e: Emission, now: Date): boolean => {
  const m = minutesJour(now);
  return e.jour === isoJour(now) && m >= toMin(e.debut) && m < finEnMin(e);
};

export const estPasse = (e: Emission, now: Date): boolean =>
  e.jour < isoJour(now) || (e.jour === isoJour(now) && minutesJour(now) >= finEnMin(e));

export const progresPct = (e: Emission, now: Date): number => {
  const m = minutesJour(now);
  const d = toMin(e.debut);
  const f = finEnMin(e);
  return Math.max(0, Math.min(100, ((m - d) / (f - d)) * 100));
};

export const emissionLive = (grille: Grille, now: Date): Emission | null =>
  grille.emissions.find((e) => estEnDirect(e, now)) ?? null;

export const emissionSuivante = (grille: Grille, now: Date): Emission | null => {
  const m = minutesJour(now);
  const auj = isoJour(now);
  const candidats = grille.emissions
    .filter((e) => e.jour === auj && toMin(e.debut) >= m)
    .sort((a, b) => toMin(a.debut) - toMin(b.debut));
  return candidats[0] ?? null;
};

export const ilYa = (ts: number): string => {
  const min = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
};

export const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

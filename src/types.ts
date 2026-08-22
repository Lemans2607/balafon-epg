/* ——— Modèle métier BALAFON+ Guide ——— */

export type Role = "directeur" | "regie" | "telespectateur";

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  role: Role;
}

export type StatutGrille = "brouillon" | "en_attente" | "valide" | "supprimee";

export type Categorie =
  | "information"
  | "divertissement"
  | "sport"
  | "culture"
  | "film"
  | "jeunesse";

export type TypeDiffusion = "direct" | "enregistre" | "rediffusion";

export interface Chaine {
  id: string;
  nom: string;
  short: string;
  accent: string;
}

export interface Emission {
  id: string;
  titre: string;
  jour: string; // YYYY-MM-DD
  debut: string; // HH:MM
  fin: string; // HH:MM (00:00 = minuit fin de journée)
  categorie: Categorie;
  type: TypeDiffusion;
  description: string;
  image?: string;
}

export interface Grille {
  id: string;
  nom: string;
  chaineId: string;
  semaineDebut: string; // lundi (ISO)
  statut: StatutGrille;
  emissions: Emission[];
  creePar: string;
  majLe: number;
  commentaireRejet?: string;
}

export type MediaType = "video" | "audio" | "affiche" | "sous-titres";

export interface MediaItem {
  id: string;
  nom: string;
  type: MediaType;
  tailleMo: number;
  duree?: string;
  emisPar: string;
  emisLe: number;
  statut: "transcodage" | "pret";
  progression: number; // 0–100 (transcodage)
}

export interface VodItem {
  id: string;
  titre: string;
  sousTitre?: string;
  chaine: string;
  categorie: Categorie;
  art: [string, string];
  image?: string;
  duree: string;
  annee: number;
  note: number;
  badge?: "REPLAY" | "NOUVEAU" | "EXCLUSIF";
  progression?: number; // « Reprendre la lecture »
}

export interface ActiviteEntry {
  id: string;
  ts: number;
  acteur: string;
  role: Role | "systeme";
  action: string;
  cible: string;
}

export interface Db {
  version: number;
  semaine: string;
  grilles: Grille[];
  medias: MediaItem[];
  activite: ActiviteEntry[];
}

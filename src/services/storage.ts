/**
 * Système de Planification / Stockage — simulé côté frontend.
 *
 * Reproduit le comportement d'un backend : persistance (localStorage),
 * latence réseau simulée, journal d'activité, et synchronisation temps réel
 * entre onglets via BroadcastChannel (plusieurs consoles ouvertes se voient
 * instantanément — testez Directeur + Régie côte à côte).
 */
import type { ActiviteEntry, Db, Emission, Grille, MediaItem, MediaType, Role, Utilisateur } from "../types";
import { DEMO_ACCOUNTS, buildSeed } from "../data/mock";
import { isoJour, lundiDe, uid } from "../utils/epg";

const KEY = "balafon_guide_v1";
const CANAL = "balafon-guide-sync";
const SKEY = "balafon_session";

const delay = (ms = 260) => new Promise<void>((r) => setTimeout(r, ms + Math.random() * 240));

let cache: Db | null = null;
let bc: BroadcastChannel | null = null;
const listeners = new Set<() => void>();

function canal(): BroadcastChannel | null {
  if (bc) return bc;
  try {
    bc = new BroadcastChannel(CANAL);
    bc.addEventListener("message", () => {
      cache = readRaw();
      listeners.forEach((l) => l());
    });
  } catch {
    bc = null;
  }
  return bc;
}

function readRaw(): Db | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Db) : null;
  } catch {
    return null;
  }
}

function getDb(): Db {
  if (cache) return cache;
  const semaine = isoJour(lundiDe(new Date()));
  let db = readRaw();
  if (!db || db.version !== 1 || db.semaine !== semaine) {
    db = { version: 1, semaine, ...buildSeed() };
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* stockage indisponible */
    }
  }
  cache = db;
  return db;
}

function commit(db: Db): void {
  cache = { ...db };
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* stockage indisponible */
  }
  listeners.forEach((l) => l());
  try {
    canal()?.postMessage("sync");
  } catch {
    /* pas de BroadcastChannel */
  }
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  canal();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = readRaw();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function snapshot(): Db {
  return getDb();
}

function log(db: Db, acteur: Utilisateur | null, action: string, cible: string): void {
  const entry: ActiviteEntry = {
    id: uid("act"),
    ts: Date.now(),
    acteur: acteur?.nom ?? "Système",
    role: (acteur?.role ?? "systeme") as Role | "systeme",
    action,
    cible,
  };
  db.activite = [entry, ...db.activite].slice(0, 40);
}

function trouveGrille(db: Db, id: string): Grille {
  const g = db.grilles.find((x) => x.id === id);
  if (!g) throw new Error("Grille introuvable.");
  return g;
}

/* ——— Session ——— */

export function getSession(): Utilisateur | null {
  try {
    const raw = sessionStorage.getItem(SKEY);
    return raw ? (JSON.parse(raw) as Utilisateur) : null;
  } catch {
    return null;
  }
}

export function setSession(u: Utilisateur | null): void {
  try {
    if (u) sessionStorage.setItem(SKEY, JSON.stringify(u));
    else sessionStorage.removeItem(SKEY);
  } catch {
    /* stockage indisponible */
  }
}

export async function login(email: string, password: string): Promise<Utilisateur> {
  await delay(550);
  const compte = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
  );
  if (!compte) throw new Error("Email ou mot de passe incorrect.");
  setSession(compte.user);
  return compte.user;
}

/* ——— Grilles EPG ——— */

export async function createGrille(
  input: { nom: string; chaineId: string; semaineDebut: string; emissions?: Emission[] },
  acteur: Utilisateur
): Promise<Grille> {
  await delay();
  const db = getDb();
  if (db.grilles.some((g) => g.statut !== "supprimee" && g.nom.trim().toLowerCase() === input.nom.trim().toLowerCase())) {
    throw new Error("Une grille porte déjà ce nom.");
  }
  const grille: Grille = {
    id: uid("g"),
    nom: input.nom.trim(),
    chaineId: input.chaineId,
    semaineDebut: input.semaineDebut,
    statut: "brouillon",
    emissions: input.emissions ?? [],
    creePar: acteur.nom,
    majLe: Date.now(),
  };
  db.grilles = [grille, ...db.grilles];
  log(db, acteur, "a créé la grille", grille.nom);
  commit(db);
  return grille;
}

export async function ajouterEmission(grilleId: string, data: Omit<Emission, "id">, acteur: Utilisateur): Promise<void> {
  await delay();
  const db = getDb();
  const g = trouveGrille(db, grilleId);
  g.emissions = [...g.emissions, { ...data, id: uid("em") }];
  g.majLe = Date.now();
  delete g.commentaireRejet;
  log(db, acteur, "a ajouté une émission à", g.nom);
  commit(db);
}

export async function majEmission(grilleId: string, emissionId: string, patch: Partial<Emission>, acteur: Utilisateur): Promise<void> {
  await delay();
  const db = getDb();
  const g = trouveGrille(db, grilleId);
  g.emissions = g.emissions.map((e) => (e.id === emissionId ? { ...e, ...patch } : e));
  g.majLe = Date.now();
  log(db, acteur, "a modifié la grille", g.nom);
  commit(db);
}

export async function retirerEmission(grilleId: string, emissionId: string, acteur: Utilisateur): Promise<void> {
  await delay();
  const db = getDb();
  const g = trouveGrille(db, grilleId);
  g.emissions = g.emissions.filter((e) => e.id !== emissionId);
  g.majLe = Date.now();
  log(db, acteur, "a retiré une émission de", g.nom);
  commit(db);
}

export async function soumettreGrille(id: string, acteur: Utilisateur): Promise<void> {
  await delay();
  const db = getDb();
  const g = trouveGrille(db, id);
  if (g.emissions.length === 0) throw new Error("Impossible : la grille ne contient aucune émission.");
  g.statut = "en_attente";
  g.majLe = Date.now();
  delete g.commentaireRejet;
  log(db, acteur, "a soumis pour validation", g.nom);
  commit(db);
}

export async function validerGrille(id: string, acteur: Utilisateur): Promise<void> {
  await delay(420);
  const db = getDb();
  const g = trouveGrille(db, id);
  g.statut = "valide";
  g.majLe = Date.now();
  delete g.commentaireRejet;
  log(db, acteur, "a validé", g.nom);
  commit(db);
}

export async function rejeterGrille(id: string, commentaire: string, acteur: Utilisateur): Promise<void> {
  await delay(420);
  const db = getDb();
  const g = trouveGrille(db, id);
  g.statut = "brouillon";
  g.commentaireRejet = commentaire.trim();
  g.majLe = Date.now();
  log(db, acteur, "a rejeté", g.nom);
  commit(db);
}

export async function supprimerGrille(id: string, acteur: Utilisateur): Promise<void> {
  await delay();
  const db = getDb();
  const g = trouveGrille(db, id);
  g.statut = "supprimee";
  g.majLe = Date.now();
  log(db, acteur, "a supprimé", g.nom);
  commit(db);
}

export async function restaurerGrille(id: string, acteur: Utilisateur): Promise<void> {
  await delay();
  const db = getDb();
  const g = trouveGrille(db, id);
  g.statut = "brouillon";
  g.majLe = Date.now();
  log(db, acteur, "a restauré", g.nom);
  commit(db);
}

export async function detruireGrille(id: string, acteur: Utilisateur): Promise<void> {
  await delay();
  const db = getDb();
  const g = trouveGrille(db, id);
  db.grilles = db.grilles.filter((x) => x.id !== id);
  log(db, acteur, "a détruit définitivement", g.nom);
  commit(db);
}

/* ——— Import de médias (Stockage simulé) ——— */

export async function importerMedia(
  input: { nom: string; type: MediaType; tailleMo: number; duree?: string },
  acteur: Utilisateur
): Promise<MediaItem> {
  await delay(350);
  const db = getDb();
  const item: MediaItem = {
    id: uid("m"),
    nom: input.nom,
    type: input.type,
    tailleMo: input.tailleMo,
    duree: input.duree,
    emisPar: acteur.nom,
    emisLe: Date.now(),
    statut: "transcodage",
    progression: 6,
  };
  db.medias = [item, ...db.medias];
  log(db, acteur, "a importé dans le Stockage", input.nom);
  commit(db);
  return item;
}

export function avancerTranscodage(id: string, progression: number): void {
  const db = getDb();
  const m = db.medias.find((x) => x.id === id);
  if (!m) return;
  m.progression = Math.min(99, progression);
  commit(db);
}

export function finaliserMedia(id: string): void {
  const db = getDb();
  const m = db.medias.find((x) => x.id === id);
  if (!m) return;
  m.statut = "pret";
  m.progression = 100;
  commit(db);
}

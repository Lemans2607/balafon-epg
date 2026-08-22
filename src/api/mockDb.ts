import type { Chaine, Emission, Categorie, TypeDiffusion, Statut } from "../utils/epgHelpers";
import { isoJour, lundiDe, semaineDe } from "../utils/epgHelpers";

/**
 * Adaptateur de démonstration : reproduit le contrat REST du backend Django
 * (voir backend/) avec persistance localStorage et temps réel simulé via
 * BroadcastChannel — plusieurs onglets ouverts se synchronisent réellement.
 */

export const CANAL_WS = "balafon-plus-ws";

export interface VmixStatut {
  en_ligne: boolean;
  version: string;
  latence_ms: number;
  derniere_sync: string | null;
}

export interface VmixJournalEntry {
  id: string;
  heure: string; // HH:MM:SS
  action: string;
  element: string;
  succes: boolean;
}

export interface DemandeAcces {
  id: string;
  nom: string;
  email: string;
  date: number;
}

interface Db {
  version: number;
  semaine: string; // lundi ISO de la semaine seedée
  emissions: Emission[];
  demandes: DemandeAcces[];
  vmix: VmixStatut;
  journal: VmixJournalEntry[];
}

const DB_KEY = "balafon_plus_db_v3";
const VERSION = 3;

export const CHAINES: Chaine[] = [
  { id: "btv", nom: "Balafon TV", accent: "#a43700" },
  { id: "binfo", nom: "Balafon Info", accent: "#005faf" },
  { id: "bsport", nom: "Balafon Sport", accent: "#2e7d32" },
];

export const USERS = [
  { id: "u1", nom: "Sylvie Ekotto", email: "admin@balafon.cm", password: "balafon237", role: "admin" as const },
  { id: "u2", nom: "Martin Njoya", email: "direction@balafon.cm", password: "balafon237", role: "directeur" as const },
  { id: "u3", nom: "Josué Talla", email: "regie@balafon.cm", password: "balafon237", role: "regie" as const },
];

const DESC: Record<Categorie, string[]> = {
  information: [
    "L'essentiel de l'actualité du Cameroun et de la sous-région, analysée par la rédaction.",
    "Reportages, interviews et décryptages pour comprendre les enjeux du jour.",
    "Le rendez-vous de la rédaction avec les grandes voix qui font l'actualité.",
  ],
  divertissement: [
    "Humour, musique et bonne humeur : le plateau qui réunit toute la famille.",
    "Les talents d'ici à l'honneur dans une ambiance 100 % conviviale.",
    "Divertissement et surprises avec les animateurs phares de l'antenne.",
  ],
  sport: [
    "Toute l'actualité sportive, du championnat Elite One aux Lions Indomptables.",
    "Analyses tactiques, réactions à chaud et images exclusives des stades.",
    "Le magazine des sports : football, athlétisme, basket et disciplines émergentes.",
  ],
  culture: [
    "Patrimoine, traditions et création contemporaine au cœur du Mboa.",
    "Un voyage au pays des rythmes, des masques et des grandes traditions.",
    "Portraits d'artistes et d'artisans qui font rayonner la culture camerounaise.",
  ],
  film: [
    "Une sélection de fictions et de séries, d'ici et d'ailleurs.",
    "Le grand rendez-vous cinéma de la semaine, en version originale sous-titrée.",
    "Séries et longs métrages primés dans les grands festivals panafricains.",
  ],
};

function buildSeed(): Emission[] {
  const lundi = lundiDe(new Date());
  const jours = semaineDe(lundi); // [lun..dim]
  const out: Emission[] = [];
  let n = 0;

  const t = (
    chaine: string,
    idxJours: number[],
    debut: string,
    fin: string,
    titre: string,
    categorie: Categorie,
    type_diffusion: TypeDiffusion,
    statut: Statut = "valide",
    commentaire_rejet?: string
  ) => {
    for (const i of idxJours) {
      n += 1;
      const pool = DESC[categorie];
      out.push({
        id: `seed-${n}`,
        chaine,
        jour: jours[i],
        debut,
        fin,
        titre,
        categorie,
        type_diffusion,
        statut,
        commentaire_rejet,
        description: pool[(n + titre.length) % pool.length],
        updated_at: Date.now() - (n % 40) * 3600_000,
      });
    }
  };

  const SEM = [0, 1, 2, 3, 4];
  const WEEKEND = [5, 6];
  const TOUS = [0, 1, 2, 3, 4, 5, 6];

  /* ——— Balafon TV ——— */
  const btv = "btv";
  t(btv, TOUS, "00:00", "06:00", "La Nuit Balafon — Rediffusions", "divertissement", "rediffusion");
  t(btv, SEM, "06:00", "09:00", "Matinale Balafon", "information", "direct");
  t(btv, WEEKEND, "07:00", "09:00", "Week-end Matin", "divertissement", "enregistre");
  t(btv, TOUS, "09:00", "09:30", "Télé Boutique", "divertissement", "enregistre");
  t(btv, SEM, "09:30", "10:30", "Rediff : Grand Débat Citoyen", "information", "rediffusion");
  t(btv, WEEKEND, "09:30", "10:30", "Échappées du Littoral", "culture", "enregistre");
  t(btv, TOUS, "10:30", "11:30", "Cuisine du Terroir", "divertissement", "enregistre");
  t(btv, TOUS, "11:30", "12:00", "Documentaire : Terres du Cameroun", "culture", "enregistre");
  t(btv, TOUS, "12:00", "12:45", "Journal de la Mi-Journée", "information", "direct");
  t(btv, TOUS, "12:45", "13:30", "Série : Les Bâtisseurs", "film", "enregistre");
  t(btv, TOUS, "13:30", "15:00", "Ciné Après-midi", "film", "enregistre");
  t(btv, SEM, "15:00", "16:00", "Dessins Animés Mboa", "divertissement", "enregistre");
  t(btv, SEM, "16:00", "17:00", "Club Jeunesse", "culture", "enregistre");
  t(btv, WEEKEND, "15:00", "17:00", "Ligue Elite One — Direct Stade", "sport", "direct");
  t(btv, SEM, "17:00", "18:00", "Ngondo, Racines & Traditions", "culture", "enregistre");
  t(btv, [5], "17:00", "18:00", "Magazine : Douala by Night", "divertissement", "enregistre");
  t(btv, SEM, "18:00", "19:00", "Talents du Mboa", "divertissement", "enregistre");
  t(btv, [5], "18:00", "19:00", "Concert : Makossa Live Session", "divertissement", "direct");
  t(btv, TOUS, "19:00", "19:30", "Météo & Trafic Douala / Yaoundé", "information", "enregistre");
  t(btv, TOUS, "19:30", "20:15", "Journal Télévisé — 19h30", "information", "direct");
  t(btv, SEM, "20:15", "20:30", "Le Fait du Jour", "information", "direct");
  t(btv, WEEKEND, "20:15", "20:30", "L'Image de la Semaine", "information", "enregistre");
  t(btv, [0, 1, 2, 3], "20:30", "21:30", "Grand Débat Citoyen", "information", "direct");
  t(btv, [4], "20:30", "22:00", "Vendredi Stand-Up", "divertissement", "direct");
  t(btv, [5], "20:30", "22:00", "Makossa Night Live", "divertissement", "direct");
  t(btv, [6], "20:30", "22:30", "Ciné Dimanche : « La Plantation »", "film", "enregistre");
  t(btv, [0, 1, 2, 3], "21:30", "22:30", "Série : Les Bâtisseurs — Ép. du soir", "film", "enregistre");
  t(btv, TOUS, "22:30", "23:00", "Journal de la Nuit", "information", "direct");
  t(btv, TOUS, "23:00", "00:00", "Rediff : Best-of de la Matinale", "information", "rediffusion");

  /* ——— Balafon Info ——— */
  const binfo = "binfo";
  t(binfo, TOUS, "00:00", "06:00", "Boucle Info Nuit", "information", "rediffusion");
  t(binfo, SEM, "06:00", "10:00", "La Grande Matinale Info", "information", "direct");
  t(binfo, [5], "06:00", "10:00", "La Grande Matinale Info", "information", "direct");
  t(binfo, [6], "07:00", "10:00", "La Grande Matinale Info — Dimanche", "information", "direct");
  t(binfo, TOUS, "10:00", "12:30", "Le Flux Continu", "information", "direct");
  t(binfo, TOUS, "12:30", "13:00", "Le Journal — 12h30", "information", "direct");
  t(binfo, TOUS, "13:00", "17:00", "L'Après-midi Info", "information", "direct");
  t(binfo, TOUS, "17:00", "18:00", "L'Invité de la Rédaction", "information", "direct");
  t(binfo, TOUS, "18:00", "19:00", "Économie & Vous", "information", "enregistre");
  t(binfo, TOUS, "19:00", "20:00", "Débat du Soir", "information", "direct");
  t(binfo, TOUS, "20:00", "21:00", "Le Journal — Édition 20h", "information", "direct");
  t(binfo, TOUS, "21:00", "22:00", "La Grande Interview", "information", "enregistre");
  t(binfo, TOUS, "22:00", "00:00", "Soirée Continue — Rediffusions", "information", "rediffusion");

  /* ——— Balafon Sport ——— */
  const bs = "bsport";
  t(bs, TOUS, "00:00", "06:00", "La Nuit du Sport — Rediffusions", "sport", "rediffusion");
  t(bs, TOUS, "06:00", "08:00", "Réveil Sportif", "sport", "enregistre");
  t(bs, TOUS, "08:00", "10:00", "Matchs de Légende", "sport", "rediffusion");
  t(bs, TOUS, "10:00", "12:00", "Zone Mixte", "sport", "enregistre");
  t(bs, TOUS, "12:00", "13:00", "Sport Midi", "sport", "direct");
  t(bs, TOUS, "13:00", "15:00", "Rediff : Ligue Elite One", "sport", "rediffusion");
  t(bs, SEM, "15:00", "17:00", "L'Analyse Technique", "sport", "enregistre");
  t(bs, WEEKEND, "15:00", "17:00", "Ligue Elite One — Multistade", "sport", "direct");
  t(bs, TOUS, "17:00", "18:30", "Plateau Foot", "sport", "direct");
  t(bs, TOUS, "18:30", "20:00", "Mag des Sports", "sport", "enregistre");
  t(bs, [2, 5], "20:00", "22:00", "Soirée Coupes d'Europe", "sport", "direct");
  t(bs, [0, 1, 3, 4, 6], "20:00", "22:00", "Documentaire : Lions Indomptables", "sport", "enregistre");
  t(bs, TOUS, "22:00", "00:00", "La Nuit du Sport — Débrief", "sport", "rediffusion");

  /* ——— Éléments de workflow (démo des rôles) ——— */
  const dimanche = jours[6];
  const samedi = jours[5];
  const vendredi = jours[4];

  n += 1;
  out.push({
    id: `wf-${n}`,
    chaine: btv,
    jour: dimanche,
    debut: "17:00",
    fin: "18:00",
    titre: "Nuit du Bikutsi — Session Live",
    categorie: "culture",
    type_diffusion: "direct",
    statut: "brouillon",
    description: "Une heure de bikutsi en direct depuis la case des arts, avec trois groupes invités.",
    updated_at: Date.now() - 2 * 3600_000,
  });

  n += 1;
  out.push({
    id: `wf-${n}`,
    chaine: btv,
    jour: dimanche,
    debut: "19:00",
    fin: "19:30",
    titre: "Flash Spécial — Tirage au sort CAN",
    categorie: "sport",
    type_diffusion: "enregistre",
    statut: "en_attente_validation",
    description: "Édition spéciale consacrée au tirage au sort de la phase finale de la CAN.",
    updated_at: Date.now() - 40 * 60_000,
  });

  n += 1;
  out.push({
    id: `wf-${n}`,
    chaine: binfo,
    jour: samedi,
    debut: "21:00",
    fin: "23:00",
    titre: "Nuit Électorale — Édition Spéciale",
    categorie: "information",
    type_diffusion: "direct",
    statut: "en_attente_validation",
    description: "Soirée électorale en direct : résultats, réactions et analyses depuis le plateau central.",
    updated_at: Date.now() - 25 * 60_000,
  });

  n += 1;
  out.push({
    id: `wf-${n}`,
    chaine: bs,
    jour: vendredi,
    debut: "22:00",
    fin: "23:30",
    titre: "La Nuit du Sport — Le Grand Débrief",
    categorie: "sport",
    type_diffusion: "enregistre",
    statut: "brouillon",
    commentaire_rejet: "Format trop long pour la case ; proposer 45 min maximum. — Direction d'Antenne",
    description: "Le débrief complet de la journée sportive, avec consultants et images exclusives.",
    updated_at: Date.now() - 5 * 3600_000,
  });

  return out;
}

function seedVmix(): VmixStatut {
  return { en_ligne: true, version: "vMix 27.0.0.52", latence_ms: 38, derniere_sync: null };
}

function seedJournal(): VmixJournalEntry[] {
  const now = new Date();
  const h = (offsetMin: number) => {
    const d = new Date(now.getTime() - offsetMin * 60_000);
    return d.toTimeString().slice(0, 8);
  };
  return [
    { id: "j1", heure: h(4), action: "Connexion API", element: "vMix 27.0.0.52 — localhost:8088", succes: true },
    { id: "j2", heure: h(38), action: "Envoi playlist", element: "Balafon TV — 24 éléments", succes: true },
    { id: "j3", heure: h(39), action: "Envoi playlist", element: "Balafon Info — 14 éléments", succes: true },
    { id: "j4", heure: h(40), action: "Envoi playlist", element: "Balafon Sport — 13 éléments", succes: true },
    { id: "j5", heure: h(62), action: "Bascule input", element: "Input 4 — Journal Télévisé", succes: true },
    { id: "j6", heure: h(130), action: "Ping timeout", element: "Nouvelle tentative de connexion", succes: false },
  ];
}

function freshDb(): Db {
  return {
    version: VERSION,
    semaine: isoJour(lundiDe(new Date())),
    emissions: buildSeed(),
    demandes: [
      { id: "dem1", nom: "Clarisse Mbarga", email: "c.mbarga@balafon.cm", date: Date.now() - 26 * 3600_000 },
    ],
    vmix: seedVmix(),
    journal: seedJournal(),
  };
}

export function loadDb(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw) as Db;
      const semaineCourante = isoJour(lundiDe(new Date()));
      if (db.version === VERSION && db.semaine === semaineCourante && Array.isArray(db.emissions)) {
        return db;
      }
    }
  } catch {
    /* re-seed */
  }
  const db = freshDb();
  saveDb(db);
  return db;
}

export function saveDb(db: Db): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* stockage indisponible : mode mémoire uniquement */
  }
}

export function emitWs(type: "grille.mise_a_jour" | "grille.validee" | "regie.vmix", emission?: Emission): void {
  try {
    const bc = new BroadcastChannel(CANAL_WS);
    bc.postMessage({ type, emission, ts: Date.now() });
    bc.close();
  } catch {
    /* BroadcastChannel indisponible */
  }
}

export function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

import type {
  ActiviteEntry,
  Categorie,
  Chaine,
  Emission,
  Grille,
  MediaItem,
  TypeDiffusion,
  Utilisateur,
  VodItem,
} from "../types";
import { addDays, isoJour, lundiDe, parseJour, uid } from "../utils/epg";
import { Baby, Clapperboard, Landmark, Newspaper, RotateCcw, Radio, Sparkles, Trophy, Video } from "lucide-react";

/* ——— Visuels ——— */

export const IMG = {
  hero: "https://image.qwenlm.ai/generated-images/e49a45aa-5fb8-4de4-90d4-85fe40f86977/_result.png",
  concert: "https://image.qwenlm.ai/generated-images/cdc99cb2-31c3-440c-9851-0a6071d98d7a/_result.png",
  foot: "https://image.qwenlm.ai/generated-images/35ebf37b-7285-42f8-af6f-845662fc4e5e/_result.png",
  drama: "https://image.qwenlm.ai/generated-images/5e028aa0-b1bc-4c8e-b427-5a3cf29cc796/_result.png",
  studio: "https://image.qwenlm.ai/generated-images/f7e55388-64f2-49c0-a8d6-b5f448353a8d/_result.png",
};

/* ——— Référentiels ——— */

export const CHAINES: Chaine[] = [
  { id: "bmtv", nom: "Balafon TV", short: "BMTV", accent: "#FF5722" },
  { id: "binfo", nom: "Balafon Info", short: "INFO", accent: "#4C9AFF" },
  { id: "bsport", nom: "Balafon Sport", short: "SPORT", accent: "#66BB6A" },
  { id: "bcine", nom: "Balafon Ciné", short: "CINÉ", accent: "#B39DDB" },
  { id: "bkids", nom: "Balafon Kids", short: "KIDS", accent: "#FFD54F" },
];

export const chaineDe = (id: string): Chaine => CHAINES.find((c) => c.id === id) ?? CHAINES[0];

export const CATS: Record<Categorie, { label: string; color: string; Icon: typeof Newspaper }> = {
  information: { label: "Information", color: "#4C9AFF", Icon: Newspaper },
  divertissement: { label: "Divertissement", color: "#F06292", Icon: Sparkles },
  sport: { label: "Sport", color: "#66BB6A", Icon: Trophy },
  culture: { label: "Culture", color: "#FFB74D", Icon: Landmark },
  film: { label: "Cinéma & Séries", color: "#4DB6AC", Icon: Clapperboard },
  jeunesse: { label: "Jeunesse", color: "#B39DDB", Icon: Baby },
};

export const TYPES: Record<TypeDiffusion, { label: string; short: string; Icon: typeof Radio }> = {
  direct: { label: "Direct", short: "DIRECT", Icon: Radio },
  enregistre: { label: "Enregistré", short: "ENR", Icon: Video },
  rediffusion: { label: "Rediffusion", short: "REDIF", Icon: RotateCcw },
};

/* ——— Comptes de démonstration ——— */

export const DEMO_PASSWORD = "balafon237";

export const DEMO_ACCOUNTS: { email: string; password: string; user: Utilisateur }[] = [
  {
    email: "directeur@balafon.cm",
    password: DEMO_PASSWORD,
    user: { id: "u1", nom: "Sylvie Ekotto", email: "directeur@balafon.cm", role: "directeur" },
  },
  {
    email: "regie@balafon.cm",
    password: DEMO_PASSWORD,
    user: { id: "u2", nom: "Josué Talla", email: "regie@balafon.cm", role: "regie" },
  },
  {
    email: "telespectateur@balafon.cm",
    password: DEMO_PASSWORD,
    user: { id: "u3", nom: "Amina Bello", email: "telespectateur@balafon.cm", role: "telespectateur" },
  },
];

/* ——— Templates hebdomadaires (24 h continues par chaîne) ——— */

type Row = [debut: string, fin: string, titre: string, categorie: Categorie, type: TypeDiffusion];

interface Template {
  sem: Row[];
  sam: Row[];
  dim: Row[];
  patch?: { jourIdx: number; debut: string; row: Row }[];
}

const T: Record<string, Template> = {
  bmtv: {
    sem: [
      ["00:00", "06:00", "La Nuit Balafon — Rediffusions", "divertissement", "rediffusion"],
      ["06:00", "09:00", "Matinale Balafon", "information", "direct"],
      ["09:00", "10:00", "Télé Boutique", "divertissement", "enregistre"],
      ["10:00", "11:00", "Cuisine du Terroir", "culture", "enregistre"],
      ["11:00", "12:00", "Terres du Cameroun — Documentaire", "culture", "enregistre"],
      ["12:00", "12:45", "Journal de la Mi-Journée", "information", "direct"],
      ["12:45", "14:00", "Ciné Après-midi", "film", "enregistre"],
      ["14:00", "16:00", "Club Jeunesse", "jeunesse", "enregistre"],
      ["16:00", "17:00", "Ngondo, Racines & Traditions", "culture", "enregistre"],
      ["17:00", "18:00", "Talents du Mboa", "divertissement", "enregistre"],
      ["18:00", "19:00", "Série : Les Bâtisseurs", "film", "enregistre"],
      ["19:00", "19:30", "Météo & Trafic Douala / Yaoundé", "information", "enregistre"],
      ["19:30", "20:15", "Journal Télévisé — 19h30", "information", "direct"],
      ["20:15", "21:30", "Grand Débat Citoyen", "information", "direct"],
      ["21:30", "22:30", "Les Bâtisseurs — épisode du soir", "film", "enregistre"],
      ["22:30", "23:00", "Journal de la Nuit", "information", "direct"],
      ["23:00", "00:00", "Best-of de la Matinale", "information", "rediffusion"],
    ],
    sam: [
      ["00:00", "06:00", "La Nuit Balafon — Rediffusions", "divertissement", "rediffusion"],
      ["06:00", "07:00", "Réveil en Musique", "divertissement", "enregistre"],
      ["07:00", "09:00", "Week-end Matin", "divertissement", "direct"],
      ["09:00", "10:00", "Télé Boutique", "divertissement", "enregistre"],
      ["10:00", "11:00", "Échappées du Littoral — Kribi", "culture", "enregistre"],
      ["11:00", "12:00", "Cuisine du Terroir", "culture", "enregistre"],
      ["12:00", "12:45", "Journal de la Mi-Journée", "information", "direct"],
      ["12:45", "14:00", "Ciné Après-midi", "film", "enregistre"],
      ["14:00", "16:00", "Ligue Elite One — Direct Stade", "sport", "direct"],
      ["16:00", "17:00", "Plateau Foot d'Après-match", "sport", "direct"],
      ["17:00", "18:00", "Makossa Classics", "divertissement", "enregistre"],
      ["18:00", "19:00", "Documentaire : Douala by Night", "culture", "enregistre"],
      ["19:00", "19:30", "Météo & Trafic Douala / Yaoundé", "information", "enregistre"],
      ["19:30", "20:15", "Journal Télévisé — 19h30", "information", "direct"],
      ["20:15", "22:30", "Makossa Night Show", "divertissement", "direct"],
      ["22:30", "23:00", "Journal de la Nuit", "information", "direct"],
      ["23:00", "00:00", "Best-of de la Matinale", "information", "rediffusion"],
    ],
    dim: [
      ["00:00", "06:00", "La Nuit Balafon — Rediffusions", "divertissement", "rediffusion"],
      ["06:00", "08:00", "Cultures & Spiritualités", "culture", "enregistre"],
      ["08:00", "09:30", "Week-end Matin", "divertissement", "direct"],
      ["09:30", "10:30", "Échappées du Littoral — Kribi", "culture", "enregistre"],
      ["10:30", "12:00", "Cuisine du Terroir — Spécial Fêtes", "culture", "enregistre"],
      ["12:00", "12:45", "Journal de la Mi-Journée", "information", "direct"],
      ["12:45", "14:30", "Ciné Après-midi : Comédies Mboa", "film", "enregistre"],
      ["14:30", "16:30", "Ligue Elite One — Direct Stade", "sport", "direct"],
      ["16:30", "17:30", "Plateau Foot d'Après-match", "sport", "direct"],
      ["17:30", "19:00", "Talents du Mboa", "divertissement", "enregistre"],
      ["19:00", "19:30", "Météo & Trafic Douala / Yaoundé", "information", "enregistre"],
      ["19:30", "20:15", "Journal Télévisé — 19h30", "information", "direct"],
      ["20:15", "22:30", "Ciné Dimanche : « La Plantation »", "film", "enregistre"],
      ["22:30", "23:00", "Journal de la Nuit", "information", "direct"],
      ["23:00", "00:00", "Best-of de la Matinale", "information", "rediffusion"],
    ],
  },
  binfo: {
    sem: [
      ["00:00", "06:00", "Boucle Info Nuit", "information", "rediffusion"],
      ["06:00", "10:00", "La Grande Matinale Info", "information", "direct"],
      ["10:00", "12:30", "Le Flux Continu", "information", "direct"],
      ["12:30", "13:00", "Le Journal — 12h30", "information", "direct"],
      ["13:00", "17:00", "L'Après-midi Info", "information", "direct"],
      ["17:00", "18:00", "L'Invité de la Rédaction", "information", "direct"],
      ["18:00", "19:00", "Économie & Vous", "information", "enregistre"],
      ["19:00", "20:00", "Débat du Soir", "information", "direct"],
      ["20:00", "21:00", "Le Journal — Édition 20h", "information", "direct"],
      ["21:00", "22:00", "La Grande Interview", "information", "enregistre"],
      ["22:00", "00:00", "Soirée Continue — Rediffusions", "information", "rediffusion"],
    ],
    sam: [],
    dim: [],
  },
  bsport: {
    sem: [
      ["00:00", "06:00", "La Nuit du Sport — Rediffusions", "sport", "rediffusion"],
      ["06:00", "08:00", "Réveil Sportif", "sport", "enregistre"],
      ["08:00", "10:00", "Matchs de Légende", "sport", "rediffusion"],
      ["10:00", "12:00", "Zone Mixte", "sport", "enregistre"],
      ["12:00", "13:00", "Sport Midi", "sport", "direct"],
      ["13:00", "15:00", "Rediff : Ligue Elite One", "sport", "rediffusion"],
      ["15:00", "17:00", "L'Analyse Technique", "sport", "enregistre"],
      ["17:00", "18:30", "Plateau Foot", "sport", "direct"],
      ["18:30", "20:00", "Mag des Sports", "sport", "enregistre"],
      ["20:00", "22:00", "Documentaire : Lions Indomptables", "sport", "enregistre"],
      ["22:00", "00:00", "La Nuit du Sport — Débrief", "sport", "rediffusion"],
    ],
    sam: [
      ["00:00", "06:00", "La Nuit du Sport — Rediffusions", "sport", "rediffusion"],
      ["06:00", "08:00", "Réveil Sportif", "sport", "enregistre"],
      ["08:00", "10:00", "Matchs de Légende", "sport", "rediffusion"],
      ["10:00", "12:00", "Zone Mixte", "sport", "enregistre"],
      ["12:00", "13:00", "Sport Midi", "sport", "direct"],
      ["13:00", "15:00", "Rediff : Ligue Elite One", "sport", "rediffusion"],
      ["15:00", "17:00", "Ligue Elite One — Multistade", "sport", "direct"],
      ["17:00", "18:30", "Plateau Foot", "sport", "direct"],
      ["18:30", "20:00", "Mag des Sports", "sport", "enregistre"],
      ["20:00", "22:00", "Soirée Coupes d'Europe", "sport", "direct"],
      ["22:00", "00:00", "La Nuit du Sport — Débrief", "sport", "rediffusion"],
    ],
    dim: [
      ["00:00", "06:00", "La Nuit du Sport — Rediffusions", "sport", "rediffusion"],
      ["06:00", "08:00", "Réveil Sportif", "sport", "enregistre"],
      ["08:00", "10:00", "Matchs de Légende", "sport", "rediffusion"],
      ["10:00", "12:00", "Zone Mixte", "sport", "enregistre"],
      ["12:00", "13:00", "Sport Midi", "sport", "direct"],
      ["13:00", "15:00", "Rediff : Ligue Elite One", "sport", "rediffusion"],
      ["15:00", "17:00", "Ligue Elite One — Multistade", "sport", "direct"],
      ["17:00", "18:30", "Plateau Foot", "sport", "direct"],
      ["18:30", "20:00", "Mag des Sports", "sport", "enregistre"],
      ["20:00", "22:00", "Documentaire : Lions Indomptables", "sport", "enregistre"],
      ["22:00", "00:00", "La Nuit du Sport — Débrief", "sport", "rediffusion"],
    ],
    patch: [{ jourIdx: 4, debut: "20:00", row: ["20:00", "22:00", "Soirée Coupes d'Europe", "sport", "direct"] }],
  },
  bcine: {
    sem: [
      ["00:00", "06:00", "Nuit Ciné — Classiques", "film", "rediffusion"],
      ["06:00", "08:00", "Classiques du Matin", "film", "enregistre"],
      ["08:00", "10:00", "Ciné Famille", "jeunesse", "enregistre"],
      ["10:00", "12:00", "Rétro Nollywood", "film", "enregistre"],
      ["12:00", "14:00", "Midi Fiction", "film", "enregistre"],
      ["14:00", "16:00", "Les Bâtisseurs — S2 (double épisode)", "film", "enregistre"],
      ["16:00", "18:00", "Courts Métrages Mboa", "film", "enregistre"],
      ["18:00", "20:00", "Ciné Première Partie", "film", "enregistre"],
      ["20:00", "22:30", "Grande Soirée Cinéma", "film", "enregistre"],
      ["22:30", "00:00", "Ciné de Minuit", "film", "enregistre"],
    ],
    sam: [],
    dim: [],
  },
  bkids: {
    sem: [
      ["00:00", "06:00", "La Nuit des Rêves", "jeunesse", "rediffusion"],
      ["06:00", "08:00", "Réveil Cartoons", "jeunesse", "enregistre"],
      ["08:00", "10:00", "Mini-Z'école", "jeunesse", "enregistre"],
      ["10:00", "12:00", "Aventures Animées", "jeunesse", "enregistre"],
      ["12:00", "13:00", "Goûter Télé", "jeunesse", "enregistre"],
      ["13:00", "15:00", "Super Héros du Mboa", "jeunesse", "enregistre"],
      ["15:00", "17:00", "Ateliers Créatifs", "jeunesse", "enregistre"],
      ["17:00", "18:30", "Les Dessins du Soir", "jeunesse", "enregistre"],
      ["18:30", "19:00", "Histoires du Village", "jeunesse", "enregistre"],
      ["19:00", "19:30", "Berceuses & Comptines", "jeunesse", "enregistre"],
      ["19:30", "00:00", "La Nuit des Rêves — Boucle", "jeunesse", "rediffusion"],
    ],
    sam: [],
    dim: [],
  },
};

const DESC: Record<Categorie, string[]> = {
  information: [
    "L'essentiel de l'actualité du Cameroun et de la sous-région, analysé par la rédaction.",
    "Reportages, interviews et décryptages pour comprendre les enjeux du jour.",
    "Le rendez-vous de la rédaction avec celles et ceux qui font l'actualité.",
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
    "Le grand rendez-vous cinéma de la semaine, primé dans les festivals panafricains.",
    "Séries et longs métrages en version originale sous-titrée.",
  ],
  jeunesse: [
    "Des programmes ludo-éducatifs pensés pour les 4–12 ans.",
    "Aventures animées, ateliers et histoires pour grandir en s'amusant.",
    "Le rendez-vous des petits héros du Mboa, chaque jour sur l'antenne.",
  ],
};

const imgFor = (titre: string): string | undefined => {
  const t = titre.toLowerCase();
  if (t.includes("makossa")) return IMG.concert;
  if (t.includes("elite one") || t.includes("lions") || t.includes("plateau foot")) return IMG.foot;
  if (t.includes("bâtisseurs") || t.includes("plantation")) return IMG.drama;
  return undefined;
};

function lignesSemaine(chaineId: string, semaineDebut: string): Emission[] {
  const tmpl = T[chaineId];
  const jours = Array.from({ length: 7 }, (_, i) => isoJour(addDays(parseJour(semaineDebut), i)));
  const out: Emission[] = [];
  for (let i = 0; i < 7; i++) {
    const rows: Row[] = tmpl.sem.length === 0 || (i === 5 && tmpl.sam.length) || (i === 6 && tmpl.dim.length)
      ? i === 5 && tmpl.sam.length
        ? tmpl.sam
        : i === 6 && tmpl.dim.length
        ? tmpl.dim
        : tmpl.sem
      : tmpl.sem;
    for (const [debut, fin, titre, categorie, type] of rows) {
      out.push({
        id: uid("em"),
        titre,
        jour: jours[i],
        debut,
        fin,
        categorie,
        type,
        description: DESC[categorie][(titre.length + i) % DESC[categorie].length],
        image: imgFor(titre),
      });
    }
  }
  for (const p of tmpl.patch ?? []) {
    const jour = jours[p.jourIdx];
    const idx = out.findIndex((e) => e.jour === jour && e.debut === p.debut);
    if (idx >= 0) {
      const [debut, fin, titre, categorie, type] = p.row;
      out[idx] = { ...out[idx], debut, fin, titre, categorie, type, image: imgFor(titre) };
    }
  }
  return out;
}

/* ——— Seed ——— */

export function buildSeed(): { grilles: Grille[]; medias: MediaItem[]; activite: ActiviteEntry[] } {
  const now = Date.now();
  const lundi = isoJour(lundiDe(new Date()));
  const lundiPro = isoJour(addDays(parseJour(lundi), 7));
  const lundiPrec = isoJour(addDays(parseJour(lundi), -7));

  const grilles: Grille[] = [];

  for (const c of CHAINES) {
    grilles.push({
      id: `g-${c.id}`,
      nom: `${c.nom} · Grille antenne`,
      chaineId: c.id,
      semaineDebut: lundi,
      statut: "valide",
      emissions: lignesSemaine(c.id, lundi),
      creePar: "Sylvie Ekotto",
      majLe: now - (CHAINES.indexOf(c) + 2) * 3_600_000,
    });
  }

  const mercrediPro = isoJour(addDays(parseJour(lundiPro), 2));
  const samediPro = isoJour(addDays(parseJour(lundiPro), 5));
  const vendredi = isoJour(addDays(parseJour(lundi), 4));

  const e = (jour: string, debut: string, fin: string, titre: string, categorie: Categorie, type: TypeDiffusion, desc?: string): Emission => ({
    id: uid("em"),
    titre,
    jour,
    debut,
    fin,
    categorie,
    type,
    description: desc ?? DESC[categorie][0],
    image: imgFor(titre),
  });

  // En attente — avec un conflit horaire volontaire (mercredi 20h–22h vs 21h–23h)
  grilles.push({
    id: "g-can2026",
    nom: "Spéciale CAN 2026 — Balafon Sport",
    chaineId: "bsport",
    semaineDebut: lundiPro,
    statut: "en_attente",
    emissions: [
      e(mercrediPro, "18:00", "20:00", "Avant-match : Lions vs Aigles", "sport", "direct"),
      e(mercrediPro, "20:00", "22:00", "Soirée CAN : Lions Indomptables vs Aigles de Carthage", "sport", "direct"),
      e(mercrediPro, "21:00", "23:00", "Débrief CAN — Analyse à chaud", "sport", "enregistre"),
      e(mercrediPro, "23:00", "00:00", "Best-of CAN", "sport", "rediffusion"),
      e(samediPro, "15:00", "17:00", "Quart de finale — Multistade", "sport", "direct"),
      e(samediPro, "17:00", "19:00", "Plateau CAN", "sport", "direct"),
    ],
    creePar: "Sylvie Ekotto",
    majLe: now - 2 * 3_600_000,
  });

  // Brouillon partiel
  grilles.push({
    id: "g-bikutsi",
    nom: "Nuit du Bikutsi — Balafon TV",
    chaineId: "bmtv",
    semaineDebut: lundiPro,
    statut: "brouillon",
    emissions: [
      e(samediPro, "20:15", "22:30", "Nuit du Bikutsi — Session Live", "culture", "direct", "Trois générations de bikutsi réunies sur le plateau central, en direct de la Case des Arts."),
      e(samediPro, "22:30", "23:30", "Coulisses : l'orchestre", "culture", "enregistre"),
    ],
    creePar: "Sylvie Ekotto",
    majLe: now - 45 * 60_000,
  });

  // Brouillon rejeté par la régie
  grilles.push({
    id: "g-debrief",
    nom: "Le Grand Débrief — Nuit Sport",
    chaineId: "bsport",
    semaineDebut: lundi,
    statut: "brouillon",
    emissions: [
      e(vendredi, "22:00", "23:30", "Le Grand Débrief — Nuit Sport", "sport", "enregistre"),
    ],
    creePar: "Sylvie Ekotto",
    majLe: now - 5 * 3_600_000,
    commentaireRejet: "Case de 22 h déjà couverte par le débrief quotidien — proposer un format 45 min le dimanche soir. — Régie Diffusion",
  });

  // Corbeille
  grilles.push({
    id: "g-interim",
    nom: "Grille intérim vacances — Balafon Kids",
    chaineId: "bkids",
    semaineDebut: lundiPrec,
    statut: "supprimee",
    emissions: lignesSemaine("bkids", lundiPrec).slice(0, 21),
    creePar: "Sylvie Ekotto",
    majLe: now - 6 * 86_400_000,
  });

  const medias: MediaItem[] = [
    { id: "m1", nom: "jt_19h30_2026-02-13.mp4", type: "video", tailleMo: 845, duree: "45:12", emisPar: "Sylvie Ekotto", emisLe: now - 3 * 86_400_000, statut: "pret", progression: 100 },
    { id: "m2", nom: "makossa_nights_ep12_master.mov", type: "video", tailleMo: 2140, duree: "1:28:40", emisPar: "Sylvie Ekotto", emisLe: now - 3 * 86_400_000, statut: "pret", progression: 100 },
    { id: "m3", nom: "affiche_bikutsi_session_4k.png", type: "affiche", tailleMo: 18, emisPar: "Sylvie Ekotto", emisLe: now - 86_400_000, statut: "pret", progression: 100 },
    { id: "m4", nom: "lions_doc_promo_v2.mp4", type: "video", tailleMo: 320, duree: "02:15", emisPar: "Sylvie Ekotto", emisLe: now - 2 * 3_600_000, statut: "transcodage", progression: 62 },
  ];

  const activite: ActiviteEntry[] = [
    { id: uid("act"), ts: now - 2 * 3_600_000, acteur: "Sylvie Ekotto", role: "directeur", action: "a soumis pour validation", cible: "Spéciale CAN 2026 — Balafon Sport" },
    { id: uid("act"), ts: now - 5 * 3_600_000, acteur: "Josué Talla", role: "regie", action: "a rejeté", cible: "Le Grand Débrief — Nuit Sport" },
    { id: uid("act"), ts: now - 26 * 3_600_000, acteur: "Josué Talla", role: "regie", action: "a validé", cible: "Balafon Info · Grille antenne" },
    { id: uid("act"), ts: now - 3 * 86_400_000, acteur: "Sylvie Ekotto", role: "directeur", action: "a importé 2 médias dans le Stockage", cible: "makossa_nights_ep12_master.mov…" },
  ];

  return { grilles, medias, activite };
}

/* ——— Catalogue VOD / Replay ——— */

export const VOD: VodItem[] = [
  { id: "v1", titre: "Makossa Nights — La Session Live", sousTitre: "Concert événement", chaine: "bmtv", categorie: "divertissement", art: ["#5c1600", "#FF5722"], image: IMG.concert, duree: "1 h 30", annee: 2026, note: 9.1, badge: "EXCLUSIF" },
  { id: "v2", titre: "Les Bâtisseurs — S2E04", sousTitre: "Série dramatique", chaine: "bcine", categorie: "film", art: ["#123039", "#4DB6AC"], image: IMG.drama, duree: "52 min", annee: 2025, note: 8.7, badge: "REPLAY" },
  { id: "v3", titre: "Lions Indomptables : La Légende", sousTitre: "Documentaire événement", chaine: "bsport", categorie: "sport", art: ["#0e2b12", "#66BB6A"], image: IMG.foot, duree: "1 h 10", annee: 2026, note: 9.4, badge: "NOUVEAU" },
  { id: "v4", titre: "Grand Débat Citoyen — Ép. 32", sousTitre: "Débat politique", chaine: "binfo", categorie: "information", art: ["#0b2b4d", "#4C9AFF"], duree: "1 h 15", annee: 2026, note: 8.2, badge: "REPLAY" },
  { id: "v5", titre: "Cuisine du Terroir — Ndolè royal", sousTitre: "Magazine culinaire", chaine: "bmtv", categorie: "culture", art: ["#4a2c00", "#FFB74D"], duree: "45 min", annee: 2025, note: 8.9, badge: "REPLAY" },
  { id: "v6", titre: "Vendredi Stand-Up — Douala Rires", sousTitre: "One-man-show", chaine: "bmtv", categorie: "divertissement", art: ["#4a0f2e", "#F06292"], duree: "58 min", annee: 2026, note: 8.5, badge: "REPLAY" },
  { id: "v7", titre: "Ngondo — Au fil du fleuve", sousTitre: "Documentaire patrimoine", chaine: "bmtv", categorie: "culture", art: ["#0d3320", "#66BB6A"], duree: "52 min", annee: 2024, note: 9.0, badge: "REPLAY" },
  { id: "v8", titre: "Échappées du Littoral — Kribi", sousTitre: "Évasion", chaine: "bmtv", categorie: "culture", art: ["#003544", "#26C6DA"], duree: "40 min", annee: 2025, note: 8.3, badge: "REPLAY" },
  { id: "v9", titre: "La Plantation", sousTitre: "Long métrage primé", chaine: "bcine", categorie: "film", art: ["#3e1f00", "#E0A458"], duree: "1 h 52", annee: 2023, note: 8.8, badge: "REPLAY" },
  { id: "v10", titre: "Matchs de Légende — CAN 2021", sousTitre: "Football", chaine: "bsport", categorie: "sport", art: ["#143d14", "#8BC34A"], image: IMG.foot, duree: "1 h 45", annee: 2025, note: 9.2 },
  { id: "v11", titre: "Journal de 19h30 — Replay", sousTitre: "Édition du jour", chaine: "binfo", categorie: "information", art: ["#101c2c", "#4C9AFF"], duree: "45 min", annee: 2026, note: 7.9, badge: "REPLAY" },
  { id: "v12", titre: "Talents du Mboa — La Finale", sousTitre: "Télé-crochet", chaine: "bmtv", categorie: "divertissement", art: ["#411f00", "#FF8A50"], duree: "1 h 20", annee: 2026, note: 8.6, badge: "NOUVEAU" },
  { id: "v13", titre: "Super Héros du Mboa — Ép. 8", sousTitre: "Animation jeunesse", chaine: "bkids", categorie: "jeunesse", art: ["#2a1a4d", "#B39DDB"], duree: "24 min", annee: 2025, note: 8.1 },
  { id: "v14", titre: "Bikutsi Sessions — Vol. 3", sousTitre: "Session acoustique", chaine: "bmtv", categorie: "culture", art: ["#3d1200", "#FF7043"], image: IMG.concert, duree: "1 h 05", annee: 2026, note: 9.0, badge: "EXCLUSIF" },
];

export const FEATURED: VodItem = VOD[0];
export const REPRENDRE = [
  { ...VOD[0], progression: 35 },
  { ...VOD[1], progression: 62 },
  { ...VOD[6], progression: 18 },
  { ...VOD[8], progression: 81 },
  { ...VOD[2], progression: 47 },
  { ...VOD[11], progression: 8 },
];
export const TOP10 = ["v3", "v1", "v10", "v2", "v14", "v5", "v9", "v6", "v8", "v13"].map((id) => VOD.find((v) => v.id === id)!);
export const REPLAYS = VOD.filter((v) => v.badge === "REPLAY");

export const vodDe = (id: string): VodItem | undefined => VOD.find((v) => v.id === id);

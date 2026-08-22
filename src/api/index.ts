import type { Chaine, Emission, Statut, User } from "../utils/epgHelpers";
import type { DemandeAcces, VmixJournalEntry, VmixStatut } from "./mockDb";
import { CHAINES, USERS, emitWs, loadDb, nextId, saveDb } from "./mockDb";

/**
 * Client API — bascule automatiquement :
 *  • VITE_API_URL défini  → backend Django (REST + token Bearer)
 *  • sinon                → adaptateur de démo (localStorage + BroadcastChannel)
 */

const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
export const MODE_DEMO = !API_URL;

const SESSION_KEY = "balafon_session_v1";

export function getSession(): { token: string; user: User } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as { token: string; user: User }) : null;
  } catch {
    return null;
  }
}

export function setSession(s: { token: string; user: User } | null): void {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

const wait = (ms?: number) => new Promise((r) => setTimeout(r, ms ?? 220 + Math.random() * 260));

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Token ${session.token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      const detail = body.detail ?? body.message ?? body.non_field_errors;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail)) message = detail.join(" ");
    } catch {
      /* corps non JSON */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ————————————————— Authentification ————————————————— */

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  if (!MODE_DEMO) {
    const res = await fetchJson<{ token: string; user: User }>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return res;
  }
  await wait(500);
  const found = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
  if (!found) throw new Error("Email ou mot de passe incorrect.");
  const { password: _pw, ...user } = found;
  void _pw;
  return { token: `demo-${found.id}`, user };
}

export async function demandeAcces(nom: string, email: string, password: string): Promise<{ message: string }> {
  if (!MODE_DEMO) {
    return fetchJson("/api/auth/demande-acces/", {
      method: "POST",
      body: JSON.stringify({ nom, email, password }),
    });
  }
  await wait(600);
  const db = loadDb();
  db.demandes.push({ id: nextId("dem"), nom, email, date: Date.now() });
  saveDb(db);
  return { message: "Demande transmise. Un administrateur vous recontactera par email." };
}

export async function getDemandes(): Promise<DemandeAcces[]> {
  if (!MODE_DEMO) return fetchJson("/api/auth/demandes/");
  await wait(150);
  return loadDb().demandes;
}

/* ————————————————— Chaînes & émissions ————————————————— */

export async function getChaines(): Promise<Chaine[]> {
  if (!MODE_DEMO) return fetchJson("/api/chaines/");
  await wait(120);
  return [...CHAINES];
}

export async function getEmissions(statut?: Statut): Promise<Emission[]> {
  if (!MODE_DEMO) {
    const q = statut ? `?statut=${statut}` : "";
    return fetchJson(`/api/emissions/${q}`);
  }
  await wait();
  const db = loadDb();
  const list = statut ? db.emissions.filter((e) => e.statut === statut) : db.emissions;
  return [...list];
}

export type EmissionInput = Omit<Emission, "id" | "updated_at"> & { id?: string };

export async function createEmission(data: EmissionInput): Promise<Emission> {
  if (!MODE_DEMO) return fetchJson("/api/emissions/", { method: "POST", body: JSON.stringify(data) });
  await wait();
  const db = loadDb();
  const { id: _id, ...rest } = data;
  void _id;
  const created: Emission = { ...rest, id: nextId("em"), updated_at: Date.now() };
  db.emissions.push(created);
  saveDb(db);
  emitWs("grille.mise_a_jour", created);
  return created;
}

export async function updateEmission(id: string, patch: Partial<EmissionInput>): Promise<Emission> {
  if (!MODE_DEMO) return fetchJson(`/api/emissions/${id}/`, { method: "PATCH", body: JSON.stringify(patch) });
  await wait();
  const db = loadDb();
  const idx = db.emissions.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Émission introuvable.");
  db.emissions[idx] = { ...db.emissions[idx], ...patch, id, updated_at: Date.now() };
  saveDb(db);
  emitWs("grille.mise_a_jour", db.emissions[idx]);
  return db.emissions[idx];
}

export async function deleteEmission(id: string): Promise<void> {
  if (!MODE_DEMO) return fetchJson(`/api/emissions/${id}/`, { method: "DELETE" });
  await wait();
  const db = loadDb();
  const cible = db.emissions.find((e) => e.id === id);
  db.emissions = db.emissions.filter((e) => e.id !== id);
  saveDb(db);
  emitWs("grille.mise_a_jour", cible);
}

export async function soumettreEmission(id: string): Promise<Emission> {
  if (!MODE_DEMO) return fetchJson(`/api/emissions/${id}/soumettre/`, { method: "POST" });
  const updated = await updateEmission(id, { statut: "en_attente_validation", commentaire_rejet: undefined });
  emitWs("grille.mise_a_jour", updated);
  return updated;
}

export async function validerEmission(id: string): Promise<Emission> {
  if (!MODE_DEMO) return fetchJson(`/api/emissions/${id}/valider/`, { method: "POST" });
  await wait();
  const db = loadDb();
  const idx = db.emissions.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Émission introuvable.");
  db.emissions[idx] = { ...db.emissions[idx], statut: "valide", commentaire_rejet: undefined, updated_at: Date.now() };
  saveDb(db);
  emitWs("grille.validee", db.emissions[idx]);
  return db.emissions[idx];
}

export async function rejeterEmission(id: string, commentaire: string): Promise<Emission> {
  if (!MODE_DEMO) {
    return fetchJson(`/api/emissions/${id}/rejeter/`, { method: "POST", body: JSON.stringify({ commentaire }) });
  }
  const updated = await updateEmission(id, { statut: "brouillon", commentaire_rejet: commentaire });
  emitWs("grille.mise_a_jour", updated);
  return updated;
}

/* ————————————————— Régie / vMix ————————————————— */

export async function getVmixStatut(): Promise<VmixStatut> {
  if (!MODE_DEMO) return fetchJson("/api/regie/vmix/statut/");
  await wait(160);
  const db = loadDb();
  return {
    ...db.vmix,
    latence_ms: db.vmix.en_ligne ? 24 + Math.floor(Math.random() * 40) : 0,
  };
}

export async function synchroniserVmix(): Promise<{ message: string; envoyes: number }> {
  if (!MODE_DEMO) return fetchJson("/api/regie/vmix/synchroniser/", { method: "POST" });
  await wait(1400);
  const db = loadDb();
  if (!db.vmix.en_ligne) throw new Error("vMix hors ligne — synchronisation impossible.");
  const heure = new Date().toTimeString().slice(0, 8);
  const valides = db.emissions.filter((e) => e.statut === "valide" || e.statut === "diffusion");
  const entrees: VmixJournalEntry[] = CHAINES.map((c) => {
    const nb = valides.filter((e) => e.chaine === c.id).length;
    return {
      id: nextId("j"),
      heure,
      action: "Envoi playlist",
      element: `${c.nom} — ${nb} éléments`,
      succes: true,
    };
  });
  entrees.unshift({ id: nextId("j"), heure, action: "Synchronisation grille", element: `${valides.length} émissions validées`, succes: true });
  db.journal = [...entrees, ...db.journal].slice(0, 60);
  db.vmix = { ...db.vmix, derniere_sync: new Date().toISOString() };
  saveDb(db);
  emitWs("regie.vmix");
  return { message: "Grille synchronisée avec vMix.", envoyes: valides.length };
}

export async function getVmixJournal(): Promise<VmixJournalEntry[]> {
  if (!MODE_DEMO) return fetchJson("/api/regie/vmix/journal/");
  await wait(160);
  return [...loadDb().journal];
}

/** Démo uniquement : simule une coupure / reconnexion de l'API vMix. */
export async function setVmixEnLigne(enLigne: boolean): Promise<void> {
  if (!MODE_DEMO) return;
  await wait(300);
  const db = loadDb();
  db.vmix = { ...db.vmix, en_ligne: enLigne };
  db.journal = [
    {
      id: nextId("j"),
      heure: new Date().toTimeString().slice(0, 8),
      action: enLigne ? "Connexion API" : "Perte de connexion API",
      element: enLigne ? `${db.vmix.version} — reconnecté` : "vMix injoignable sur localhost:8088",
      succes: enLigne,
    },
    ...db.journal,
  ].slice(0, 60);
  saveDb(db);
  emitWs("regie.vmix");
}

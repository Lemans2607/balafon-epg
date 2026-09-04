/* ——— Validations métier (formulaires Studio & connexion) ——— */

/**
 * Email valide — TOUS les domaines sont acceptés (plus de restriction
 * historique à un domaine interne type @balafon.media).
 */
export function estEmailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function estNomValide(nom: string): boolean {
  return nom.trim().length >= 2;
}

export function estNomGrilleValide(nom: string): boolean {
  return nom.trim().length >= 3;
}

/** Normalisation basique avant envoi au backend. */
export function normaliserEmail(email: string): string {
  return email.trim().toLowerCase();
}

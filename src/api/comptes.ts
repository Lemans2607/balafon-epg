import type { Role } from "../utils/epgHelpers";
import { USERS } from "./mockDb";

export { MODE_DEMO } from "./index";

export interface CompteDemo {
  nom: string;
  email: string;
  password: string;
  role: Role;
}

/** Comptes de démonstration — affichés sur l'écran de connexion en mode démo. */
export const USERS_DEMO: CompteDemo[] = USERS.map(({ nom, email, password, role }) => ({
  nom,
  email,
  password,
  role,
}));

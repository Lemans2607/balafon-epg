import { useCallback, useEffect, useMemo, useState } from "react";

const OFFSET_KEY = "balafon-sim-offset";

function lireOffset(): number {
  try {
    const v = Number(localStorage.getItem(OFFSET_KEY) ?? "0");
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

/**
 * Horloge centrale de l'application.
 *
 * - Par défaut : heure réelle.
 * - Si un décalage de démonstration est actif (horloge de démo des interfaces
 *   opérationnelles — Régie), il est appliqué ici aussi, ce qui synchronise le
 *   playhead, le direct et le programme « Ensuite » sur la même heure.
 *
 * La sélection du programme « Ensuite » reste déterministe : c'est toujours le
 * créneau immédiatement suivant dans la grille (tri par slot), jamais un calcul
 * ambigu basé sur la durée restante.
 */
export function useNow(ms = 1000): Date {
  const [now, setNow] = useState(() => new Date(Date.now() + lireOffset()));

  useEffect(() => {
    const t = setInterval(() => setNow(new Date(Date.now() + lireOffset())), ms);
    const onStorage = (e: StorageEvent) => {
      if (e.key === OFFSET_KEY) setNow(new Date(Date.now() + lireOffset()));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(t);
      window.removeEventListener("storage", onStorage);
    };
  }, [ms]);

  return now;
}

export interface SimClock {
  now: Date;
  simulee: boolean;
  /** Fixe l'heure de démo à HH:MM (aujourd'hui). */
  reglerHeure: (hhmm: string) => void;
  /** Retour au temps réel. */
  reinitialiser: () => void;
}

/** Horloge de démonstration — réservée aux interfaces opérationnelles (Régie). */
export function useSimClock(ms = 1000): SimClock {
  const [offset, setOffset] = useState<number>(lireOffset);
  const now = useNow(ms);

  const persister = useCallback((v: number) => {
    setOffset(v);
    try {
      localStorage.setItem(OFFSET_KEY, String(v));
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const reglerHeure = useCallback(
    (hhmm: string) => {
      const [h, m] = hhmm.split(":").map(Number);
      const cible = new Date();
      cible.setHours(h || 0, m || 0, 0, 0);
      persister(cible.getTime() - Date.now());
    },
    [persister]
  );

  const reinitialiser = useCallback(() => persister(0), [persister]);

  return useMemo(
    () => ({ now, simulee: offset !== 0, reglerHeure, reinitialiser }),
    [now, offset, reglerHeure, reinitialiser]
  );
}

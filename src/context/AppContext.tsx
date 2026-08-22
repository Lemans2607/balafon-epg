import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Db, Grille, MediaItem, ActiviteEntry, Utilisateur } from "../types";
import * as storage from "../services/storage";

interface Ctx {
  user: Utilisateur | null;
  grilles: Grille[]; // hors corbeille
  corbeille: Grille[];
  medias: MediaItem[];
  activite: ActiviteEntry[];
  pret: boolean;
  login: (email: string, password: string) => Promise<Utilisateur>;
  logout: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(() => storage.getSession());
  const [, setTick] = useState(0);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    const unsub = storage.subscribe(() => setTick((t) => t + 1));
    const t = setTimeout(() => setPret(true), 450);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);

  const db: Db = useMemo(() => ({ ...storage.snapshot() }), []);
  // relecture à chaque tick de synchro
  const [dbLive, setDbLive] = useState<Db>(db);
  useEffect(() => {
    setDbLive({ ...storage.snapshot() });
  });

  const grilles = useMemo(
    () => dbLive.grilles.filter((g) => g.statut !== "supprimee").sort((a, b) => b.majLe - a.majLe),
    [dbLive]
  );
  const corbeille = useMemo(
    () => dbLive.grilles.filter((g) => g.statut === "supprimee").sort((a, b) => b.majLe - a.majLe),
    [dbLive]
  );

  const login = useCallback(async (email: string, password: string) => {
    const u = await storage.login(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    storage.setSession(null);
    setUser(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      grilles,
      corbeille,
      medias: dbLive.medias,
      activite: dbLive.activite,
      pret,
      login,
      logout,
    }),
    [user, grilles, corbeille, dbLive, pret, login, logout]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp doit être utilisé sous <AppProvider>");
  return ctx;
}

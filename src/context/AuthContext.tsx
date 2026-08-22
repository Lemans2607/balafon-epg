import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { User } from "../utils/epgHelpers";
import { getSession, login as apiLogin, setSession } from "../api";

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSess] = useState<{ token: string; user: User } | null>(() => getSession());

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setSession(res);
    setSess(res);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setSess(null);
  }, []);

  const value = useMemo(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, login, logout }),
    [session, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth doit être utilisé sous <AuthProvider>");
  return ctx;
}

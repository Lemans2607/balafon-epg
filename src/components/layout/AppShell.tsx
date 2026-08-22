import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ROLE_LABELS, type Role } from "../../utils/epgHelpers";
import { useAuth } from "../../context/AuthContext";
import { Horloge, Icone, LogoBalafon } from "../ui/kit";

const NAV: Record<Role, { to: string; label: string; icon: string }[]> = {
  admin: [
    { to: "/admin", label: "Tableau de bord", icon: "dashboard" },
    { to: "/admin/grille", label: "Éditeur de grille", icon: "calendar_month" },
  ],
  directeur: [{ to: "/directeur", label: "Validation antenne", icon: "fact_check" }],
  regie: [{ to: "/regie", label: "Régie de diffusion", icon: "live_tv" }],
};

export function AppShell({
  titre,
  sousTitre,
  actions,
  dark = false,
  children,
}: {
  titre: string;
  sousTitre?: string;
  actions?: ReactNode;
  dark?: boolean;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const items = user ? [...NAV[user.role], { to: "/grille", label: "Grille publique", icon: "tv" }] : [];

  return (
    <div className={`min-h-screen ${dark ? "dark-roots bg-dark-900 text-white" : "bg-surface"}`}>
      {/* ——— Sidebar ——— */}
      <aside className="fixed inset-y-0 left-0 z-40 w-[228px] hidden lg:flex flex-col bg-ink-900 border-r border-white/5">
        <div className="px-5 pt-6 pb-5">
          <LogoBalafon clair />
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/admin"}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.07] text-white"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-500 transition-all duration-200 ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    }`}
                  />
                  <Icone name={it.icon} size={19} className={isActive ? "text-primary-400" : ""} />
                  {it.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-primary-600/20 text-primary-300 font-display font-bold text-[13px] flex-none">
              {user?.nom
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-white truncate leading-tight">{user?.nom}</span>
              <span className="block text-[10.5px] text-white/40 uppercase tracking-wide truncate">
                {user ? ROLE_LABELS[user.role] : ""}
              </span>
            </span>
            <button
              onClick={logout}
              className="text-white/35 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <Icone name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ——— Colonne principale ——— */}
      <div className="lg:pl-[228px]">
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md ${
            dark ? "bg-dark-900/85 border-dark-line" : "bg-surface/85 border-ink-100"
          }`}
        >
          <div className="flex items-center justify-between gap-4 px-5 sm:px-7 h-[62px]">
            <div className="flex items-center gap-4 min-w-0">
              <span className="lg:hidden">
                <LogoBalafon compact />
              </span>
              <div className="min-w-0">
                <h1 className="font-display font-extrabold tracking-tight text-[17px] leading-none truncate">{titre}</h1>
                {sousTitre && (
                  <p className={`text-[11.5px] mt-1 truncate ${dark ? "text-white/40" : "text-ink-400"}`}>{sousTitre}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-none">
              {actions}
              <Horloge
                secondes
                className={`hidden sm:block text-[13px] font-semibold px-3 py-1.5 rounded-lg border ${
                  dark ? "border-dark-line text-white/70 bg-dark-800" : "border-ink-200 bg-paper text-ink-600"
                }`}
              />
              <NavLink
                to="/grille"
                className={`hidden lg:flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  dark
                    ? "border-dark-line text-white/55 hover:text-white hover:border-dark-600"
                    : "border-ink-200 text-ink-500 hover:text-ink-900 hover:border-ink-300"
                }`}
                title="Voir la grille publique"
              >
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-live animate-pulse-dot" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-live" />
                </span>
                Antenne en direct
              </NavLink>
            </div>
          </div>
          {/* Nav mobile */}
          <nav className={`lg:hidden flex gap-1 px-4 pb-2 overflow-x-auto no-scrollbar ${dark ? "" : ""}`}>
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : dark
                      ? "bg-dark-800 text-white/55"
                      : "bg-ink-100 text-ink-500"
                  }`
                }
              >
                <Icone name={it.icon} size={14} />
                {it.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className={dark ? "bg-dark-900 bg-grid-dark min-h-[calc(100vh-62px)]" : "bg-dots min-h-[calc(100vh-62px)]"}>
          {children}
        </main>
      </div>
    </div>
  );
}

/** Pastille d'état temps réel (TopBar). */
export function PastilleWs({ statut, dark = false }: { statut: "ouvert" | "ferme"; dark?: boolean }) {
  const ouvert = statut === "ouvert";
  return (
    <span
      className={`hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
        dark ? "border-dark-line text-white/50" : "border-ink-200 bg-paper text-ink-500"
      }`}
      title="Connexion temps réel"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ouvert ? "bg-ok" : "bg-live"}`} />
      Temps réel
    </span>
  );
}

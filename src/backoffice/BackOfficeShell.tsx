import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ExternalLink,
  KanbanSquare,
  LayoutTemplate,
  LogOut,
  Radio,
} from "lucide-react";
import type { Role } from "../types";
import { ROLES, ilYa, toHHMM } from "../utils/epg";
import { useNow, useStudio } from "../state/store";
import { LogoTV, useToast } from "../components/shared";

const NAV: { role: Role; label: string; Icon: typeof Radio; desc: string }[] = [
  { role: "admin", label: "Constructeur EPG", Icon: LayoutTemplate, desc: "Bibliothèque → Timeline 24h" },
  { role: "directeur", label: "Validation Éditoriale", Icon: KanbanSquare, desc: "Kanban brouillons → antenne" },
  { role: "regie", label: "Régie Diffusion", Icon: Radio, desc: "Mission control live" },
];

export function BackOfficeShell({ children }: { children: ReactNode }) {
  const { role, setRole, vmix, db } = useStudio();
  const now = useNow(1000);
  const toast = useToast();

  const nbAlertes = db.alertes.filter((a) => !a.acquittee).length;

  return (
    <div className="min-h-screen bg-night text-white">
      {/* Ambiance studio */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-studio-grid opacity-70" />
        <div className="absolute -top-40 right-[-120px] w-[520px] h-[520px] rounded-full bg-bred/[0.05] blur-[130px]" />
        <div className="absolute bottom-[-160px] left-[-120px] w-[460px] h-[460px] rounded-full bg-sgreen/[0.04] blur-[120px]" />
      </div>

      {/* ——— Sidebar ——— */}
      <aside className="fixed inset-y-0 left-0 z-40 w-[232px] hidden lg:flex flex-col glass-pane !border-y-0 !border-l-0">
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.05]">
          <LogoTV compact />
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/30 mt-2.5">
            Balafon+ Guide · Studio
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV.map((n) => {
            const actif = role === n.role;
            return (
              <button
                key={n.role}
                onClick={() => setRole(n.role)}
                className={`group relative w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 ${
                  actif ? "bg-pane2 shadow-card" : "hover:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full transition-all ${actif ? "bg-bred" : "bg-transparent group-hover:bg-white/15"}`}
                />
                <span className={`grid place-items-center w-9 h-9 rounded-lg flex-none transition-colors ${actif ? "bg-bred/15 text-bred" : "bg-white/[0.04] text-white/45 group-hover:text-white/75"}`}>
                  <n.Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] font-bold truncate ${actif ? "text-white" : "text-white/60"}`}>{n.label}</span>
                  <span className="block text-[10px] text-white/30 truncate mt-0.5">{n.desc}</span>
                </span>
                {n.role === "regie" && nbAlertes > 0 && (
                  <span className="ml-auto flex-none font-mono text-[10px] font-bold bg-bred text-white rounded-full px-1.5 py-0.5 animate-blink-alert">
                    {nbAlertes}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.05] space-y-2">
          <Link
            to="/guide"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[12px] font-bold text-white/55 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <ExternalLink size={15} /> Voir le Guide TV public
          </Link>
          <div className="glass-pane rounded-xl px-3.5 py-3 !border-sgreen/20">
            <p className="flex items-center gap-2 text-[11px] font-bold text-sgreen">
              <span className="w-1.5 h-1.5 rounded-full bg-sgreen animate-pulse" /> vMix connecté
            </p>
            <p className="font-mono text-[9.5px] text-white/30 mt-1">
              dernière sync {vmix.lastSync ? toHHMM(new Date(vmix.lastSync).getHours() * 60 + new Date(vmix.lastSync).getMinutes()) : "—"}
            </p>
          </div>
        </div>
      </aside>

      {/* ——— Colonne principale ——— */}
      <div className="lg:pl-[232px] relative">
        {/* Topbar */}
        <header className="sticky top-0 z-30 glass border-b border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 sm:px-7 py-3">
            <div className="lg:hidden">
              <LogoTV compact />
            </div>

            {/* Switcher de rôle (démo) */}
            <div className="flex items-center rounded-xl bg-night2 border border-line p-1">
              {NAV.map((n) => (
                <button
                  key={n.role}
                  onClick={() => {
                    setRole(n.role);
                    toast.push({ type: "info", titre: `Vue ${ROLES[n.role].label}`, message: n.desc });
                  }}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-[11.5px] font-bold transition-all duration-200 ${
                    role === n.role ? "bg-bred text-white shadow-glow-red" : "text-white/45 hover:text-white"
                  }`}
                >
                  {ROLES[n.role].court}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Statut API vMix */}
            <button
              onClick={() => setRole("regie")}
              className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                vmix.syncing ? "border-gold/40 text-gold bg-gold/[0.07]" : "border-sgreen/30 text-sgreen bg-sgreen/[0.06]"
              }`}
              title="Aller à la Régie"
            >
              <span className={`w-2 h-2 rounded-full ${vmix.syncing ? "bg-gold animate-blink-alert" : "bg-sgreen animate-pulse"}`} />
              API vMix : {vmix.syncing ? "Synchronisation…" : "Synchronisée"}
            </button>

            {/* Horloge */}
            <span className="hidden md:block font-mono text-[13px] font-semibold text-white/70 tabular-nums border border-line rounded-lg px-3 py-1.5 bg-night2">
              {toHHMM(now.getHours() * 60 + now.getMinutes())}
              <span className="text-white/30">:{String(now.getSeconds()).padStart(2, "0")}</span>
            </span>

            <button
              onClick={() => setRole("regie")}
              className="relative grid place-items-center w-9 h-9 rounded-lg border border-line text-white/55 hover:text-white transition-colors"
              aria-label="Alertes"
            >
              <Bell size={16} />
              {nbAlertes > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-bred text-white text-[9px] font-black grid place-items-center animate-pulse-red">{nbAlertes}</span>}
            </button>

            <Link to="/login" className="grid place-items-center w-9 h-9 rounded-lg border border-line text-white/55 hover:text-bred hover:border-bred/40 transition-colors" title="Se déconnecter">
              <LogOut size={16} />
            </Link>
          </div>

          {/* Nav mobile */}
          <nav className="lg:hidden flex gap-1.5 px-4 pb-2.5 overflow-x-auto no-scrollbar">
            {NAV.map((n) => (
              <button
                key={n.role}
                onClick={() => setRole(n.role)}
                className={`flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-colors ${
                  role === n.role ? "bg-bred text-white" : "bg-pane text-white/50"
                }`}
              >
                <n.Icon size={13} /> {n.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="relative">{children}</main>

        <footer className="px-5 sm:px-7 py-6 text-[11px] text-white/25 flex flex-wrap items-center justify-between gap-2">
          <span>Balafon+ Guide — Studio de gestion d'antenne · Balafon Media Group</span>
          <span>
            Dernière activité : {db.log[0] ? `${ilYa(db.log[0].ts)}` : "—"}
          </span>
        </footer>
      </div>
    </div>
  );
}

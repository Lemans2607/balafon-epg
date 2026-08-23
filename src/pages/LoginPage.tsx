import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Lock, Mail, MonitorPlay, Radio, ShieldCheck } from "lucide-react";
import type { Role } from "../types";
import { DEMO_COMPTES } from "../data/mock";
import { ROLES } from "../utils/epg";
import { useStudio } from "../state/store";
import { LogoTV } from "../components/shared";

const ROLE_META: Record<Role, { Icon: typeof ShieldCheck; pitch: string; color: string }> = {
  admin: { Icon: ShieldCheck, pitch: "Construit la grille EPG par drag & drop et publie l'antenne.", color: "#FFB800" },
  directeur: { Icon: MonitorPlay, pitch: "Valide éditorialement les grilles avant diffusion.", color: "#00F5A0" },
  regie: { Icon: Radio, pitch: "Supervise le direct et synchronise vMix en temps réel.", color: "#FF3D00" },
};

export function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useStudio();
  const [choix, setChoix] = useState<Role>("admin");
  const [email, setEmail] = useState<string>(DEMO_COMPTES.admin.email);
  const [password, setPassword] = useState("balafon237");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [secousse, setSecousse] = useState(0);

  const choisir = (r: Role) => {
    setChoix(r);
    setEmail(DEMO_COMPTES[r].email);
    setErreur(null);
  };

  const entrer = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErreur("Email et mot de passe obligatoires.");
      setSecousse((s) => s + 1);
      return;
    }
    setChargement(true);
    await new Promise((r) => setTimeout(r, 700));
    setRole(choix);
    navigate("/studio");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-night">
      {/* ——— Panneau marque ——— */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12">
        <div className="absolute inset-0 bg-studio-grid" />
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-bred/[0.08] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full bg-sgreen/[0.06] blur-[110px]" />

        <div className="relative">
          <LogoTV />
        </div>

        <div className="relative max-w-[480px]">
          <p className="inline-flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.24em] text-bred border border-bred/30 bg-bred/10 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-bred animate-pulse-red" /> Back-office · Broadcast Control
          </p>
          <h1 className="font-display font-black text-[44px] leading-[1.05] tracking-tight text-white mt-6">
            La grille d'antenne,
            <br />
            du <span className="text-gold">glisser-déposer</span>
            <br />
            au <span className="text-bred">direct</span> <span className="text-sgreen">validé</span>.
          </h1>
          <p className="text-white/50 text-[14.5px] leading-relaxed mt-5">
            Balafon+ Guide remplace la gestion manuelle de la grille : un constructeur EPG,
            une validation éditoriale et une régie synchronisée vMix — sur une seule plateforme.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { c: "#FFB800", t: "Constructeur EPG 24h — slots de 30 min, contrôle de complétude" },
              { c: "#00F5A0", t: "Kanban de validation — brouillons, attente, antenne" },
              { c: "#FF3D00", t: "Régie temps réel — playhead live, alertes, miroir vMix" },
            ].map((f) => (
              <li key={f.c} className="flex items-center gap-3 text-[13px] text-white/65">
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: f.c }} />
                {f.t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/30 font-medium tracking-wide">
          Balafon Media Group · Douala — Cameroun
        </p>
      </aside>

      {/* ——— Panneau connexion ——— */}
      <main className="flex items-center justify-center px-5 py-10 bg-night2 bg-studio-grid">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-[430px]">
          <div className="lg:hidden mb-8">
            <LogoTV />
          </div>

          <p className="text-[10.5px] font-black uppercase tracking-[0.24em] text-white/35">S'authentifier</p>
          <h2 className="font-display font-extrabold text-[26px] tracking-tight text-white mt-2">Accès au Studio</h2>
          <p className="text-[13px] text-white/45 mt-1.5">Sélectionnez votre rôle — la redirection est automatique.</p>

          <div className="mt-6 space-y-2.5">
            {(Object.keys(ROLE_META) as Role[]).map((r) => {
              const m = ROLE_META[r];
              const actif = choix === r;
              return (
                <button
                  key={r}
                  onClick={() => choisir(r)}
                  className={`w-full flex items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                    actif ? "bg-pane border-transparent shadow-card" : "bg-transparent border-line hover:border-line2"
                  }`}
                  style={actif ? { borderColor: `${m.color}66`, boxShadow: `0 0 0 1px ${m.color}40, 0 10px 30px -12px rgb(0 0 0 / 0.8)` } : undefined}
                >
                  <span className="grid place-items-center w-10 h-10 rounded-lg flex-none" style={{ background: `${m.color}16`, color: m.color, border: `1px solid ${m.color}35` }}>
                    <m.Icon size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-bold text-white">{ROLES[r].label}</span>
                    <span className="block text-[11.5px] text-white/40 leading-snug mt-0.5">{m.pitch}</span>
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-none transition-all ${actif ? "" : "border-white/20"}`}
                    style={actif ? { borderColor: m.color, background: m.color, boxShadow: `0 0 10px ${m.color}80` } : undefined}
                  />
                </button>
              );
            })}
          </div>

          <form key={secousse} onSubmit={entrer} className={`mt-6 space-y-3 ${secousse > 0 && erreur ? "animate-shake" : ""}`}>
            <label className="relative block">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email professionnel"
                className="w-full rounded-xl bg-pane border border-line pl-10 pr-3.5 py-3 text-[13.5px] font-medium text-white placeholder:text-white/25 focus:border-bred/60 transition-colors outline-none"
              />
            </label>
            <label className="relative block">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full rounded-xl bg-pane border border-line pl-10 pr-3.5 py-3 text-[13.5px] font-medium text-white placeholder:text-white/25 focus:border-bred/60 transition-colors outline-none"
              />
              <KeyRound size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20" />
            </label>

            {erreur && <p className="text-[12.5px] font-semibold text-bred flex items-center gap-2">{erreur}</p>}

            <button
              type="submit"
              disabled={chargement}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-bred hover:bg-bred2 py-3 text-[14px] font-bold text-white shadow-glow-red transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {chargement ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <MonitorPlay size={17} />
              )}
              Entrer dans le Studio — {ROLES[choix].court}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/45 hover:text-white transition-colors">
              <ArrowRight size={14} className="rotate-180" /> Portail téléspectateur
            </Link>
            <p className="font-mono text-[10px] text-white/25">démo · mot de passe libre</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

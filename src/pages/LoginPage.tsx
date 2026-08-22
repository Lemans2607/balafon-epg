import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarPlus,
  Clapperboard,
  Eye,
  EyeOff,
  HardDrive,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Radio,
  Tv,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, IMG } from "../data/mock";
import { Logo } from "../components/ui";
import type { Role } from "../types";

export const ROLE_HOME: Record<Role, string> = {
  directeur: "/directeur",
  regie: "/regie",
  telespectateur: "/",
};

const ROLE_ICON: Record<Role, typeof Radio> = {
  directeur: Clapperboard,
  regie: Radio,
  telespectateur: Tv,
};

const ROLE_TITRE: Record<Role, string> = {
  directeur: "Directeur d'Antenne",
  regie: "Régie Diffusion",
  telespectateur: "Téléspectateur",
};

export function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secousse, setSecousse] = useState(0);

  const entrer = async (e?: FormEvent, compte?: (typeof DEMO_ACCOUNTS)[number]) => {
    e?.preventDefault();
    const em = compte?.email ?? email;
    const pw = compte?.password ?? password;
    setErreur(null);
    setBusy(true);
    try {
      const user = await login(em, pw);
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Connexion impossible.");
      setSecousse((s) => s + 1);
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-lg bg-panel2 border border-line pl-10 pr-10 py-2.5 text-[14px] font-medium text-white placeholder:text-white/25 focus:border-brand transition-colors outline-none";

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-oled text-white">
      {/* ——— Panneau marque ——— */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12">
        <img
          src={IMG.studio}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-oled via-oled/60 to-oled/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-oled/80" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-[480px]">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand">Console de diffusion</p>
          <h1 className="font-display font-black text-[52px] leading-[1.02] tracking-tight mt-3">
            Créez.
            <br />
            Validez.
            <br />
            <span className="text-brand italic">Diffusez.</span>
          </h1>
          <p className="text-white/55 text-[14.5px] leading-relaxed mt-5">
            La plateforme de gestion des grilles de programmes du groupe Balafon Media — du brouillon du
            Directeur d'Antenne jusqu'à l'antenne, supervisée par la Régie Diffusion.
          </p>

          <ul className="mt-9 space-y-4">
            {[
              { Icon: CalendarPlus, titre: "Directeur d'Antenne", txt: "Créer les grilles EPG, importer les médias, soumettre pour validation." },
              { Icon: Radio, titre: "Régie Diffusion", txt: "Valider, modifier ou supprimer les grilles en temps réel." },
              { Icon: HardDrive, titre: "Stockage & Planification", txt: "Backend simulé : persistance locale et synchro multi-onglets." },
            ].map((f) => (
              <li key={f.titre} className="flex items-start gap-3.5">
                <span className="grid place-items-center w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 text-brand flex-none">
                  <f.Icon size={18} />
                </span>
                <span>
                  <span className="block text-[13.5px] font-bold">{f.titre}</span>
                  <span className="block text-[12.5px] text-white/45 leading-snug mt-0.5">{f.txt}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/30 font-medium tracking-wide">
          Balafon Media Group · Stage IAI Cameroun — BALAFON+ Guide
        </p>
      </aside>

      {/* ——— Formulaire ——— */}
      <main className="flex items-center justify-center px-5 py-10 bg-noise">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand">S'authentifier</p>
          <h2 className="font-display font-black text-[30px] tracking-tight mt-2">Connexion à la console</h2>
          <p className="text-[13.5px] text-white/40 mt-1.5">
            L'accès est redirigé selon votre rôle : Directeur, Régie ou Téléspectateur.
          </p>

          <form key={secousse} onSubmit={(e) => void entrer(e)} className={`mt-7 ${secousse > 0 && erreur ? "animate-shake" : ""}`}>
            <div className="space-y-3.5">
              <label className="relative block">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={inputCls}
                  type="email"
                  placeholder="Adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="relative block">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  className={inputCls}
                  type={voir ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVoir((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  aria-label={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {voir ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </label>
            </div>

            {erreur && (
              <p className="mt-3.5 flex items-center gap-2 text-[13px] font-semibold text-danger animate-fade">
                <KeyRound size={15} /> {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand hover:bg-brand2 py-3 text-[14px] font-bold text-white shadow-glow transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
              Se connecter
            </button>
          </form>

          <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/45 hover:text-brand transition-colors">
            <Tv size={15} /> Continuer vers le portail public
          </Link>

          <div className="mt-9">
            <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
              <span className="h-px flex-1 bg-line" /> Comptes de démonstration <span className="h-px flex-1 bg-line" />
            </p>
            <div className="mt-4 space-y-2">
              {DEMO_ACCOUNTS.map((c) => {
                const Ic = ROLE_ICON[c.user.role];
                return (
                  <button
                    key={c.email}
                    onClick={() => {
                      setEmail(c.email);
                      setPassword(c.password);
                      setErreur(null);
                      void entrer(undefined, c);
                    }}
                    disabled={busy}
                    className="w-full flex items-center gap-3.5 rounded-lg border border-line bg-panel px-4 py-3 text-left transition-all duration-200 hover:border-brand/50 hover:bg-panel2 group disabled:opacity-60"
                  >
                    <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors flex-none">
                      <Ic size={16} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-bold">{ROLE_TITRE[c.user.role]}</span>
                      <span className="block text-[11px] text-white/35 font-mono truncate">
                        {c.email} · {DEMO_PASSWORD}
                      </span>
                    </span>
                    <ArrowRight size={15} className="text-white/25 group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-none" />
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-white/30 mt-4 text-center leading-relaxed">
              Démo : données simulées en local — ouvrez Directeur et Régie dans deux onglets pour voir la synchro temps réel.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

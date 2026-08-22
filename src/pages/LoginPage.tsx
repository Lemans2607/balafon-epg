import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { demandeAcces } from "../api";
import { MODE_DEMO, USERS_DEMO } from "../api/comptes";
import { ROLE_LABELS, type Role } from "../utils/epgHelpers";
import { Icone, LogoBalafon, Spinner, TouchesBalafon } from "../components/ui/kit";

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  directeur: "/directeur",
  regie: "/regie",
};

const IMG_REGIE =
  "https://image.qwenlm.ai/generated-images/f7e55388-64f2-49c0-a8d6-b5f448353a8d/_result.png";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"connexion" | "demande">("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [secousse, setSecousse] = useState(0);
  const [demandeOk, setDemandeOk] = useState<string | null>(null);

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const u = await login(email, password);
      navigate(ROLE_HOME[u.role], { replace: true });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Connexion impossible.");
      setSecousse((s) => s + 1);
    } finally {
      setChargement(false);
    }
  };

  const soumettreDemande = async (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !email.trim() || password.length < 6) {
      setErreur(password.length < 6 && email.trim() && nom.trim() ? "Mot de passe : 6 caractères minimum." : "Tous les champs sont obligatoires.");
      setSecousse((s) => s + 1);
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const res = await demandeAcces(nom, email, password);
      setDemandeOk(res.message);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Envoi impossible, réessayez.");
    } finally {
      setChargement(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-ink-200 bg-paper pl-10 pr-3 py-2.5 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 transition-colors focus:border-primary-500";

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.02fr_1fr]">
      {/* ——— Panneau marque ——— */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink-900 p-10 xl:p-14">
        <img
          src={IMG_REGIE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/55 to-ink-900/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/70 to-transparent" />

        <div className="relative">
          <LogoBalafon clair />
        </div>

        <div className="relative max-w-[440px]">
          <TouchesBalafon className="mb-6 opacity-90" />
          <h1 className="font-display text-[42px] xl:text-[50px] font-black leading-[1.04] tracking-tight text-white">
            La grille d'antenne,
            <br />
            du brouillon
            <br />
            <span className="text-primary-400">au direct.</span>
          </h1>
          <p className="text-white/60 text-[14.5px] leading-relaxed mt-5">
            Édition hebdomadaire, validation par la Direction d'Antenne et synchronisation régie —
            sur une seule plateforme, pensée pour Balafon Media Group.
          </p>

          <ul className="mt-8 space-y-3.5">
            {[
              { icon: "calendar_month", txt: "Éditeur de grille hebdomadaire avec détection de conflits horaires" },
              { icon: "fact_check", txt: "Circuit de validation : brouillon → validation → diffusion" },
              { icon: "live_tv", txt: "Régie temps réel et synchronisation vMix, thème control-room" },
            ].map((f) => (
              <li key={f.icon} className="flex items-start gap-3 text-[13.5px] text-white/75">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-white/[0.07] border border-white/10 text-primary-400 flex-none">
                  <Icone name={f.icon} size={16} />
                </span>
                <span className="pt-1.5 leading-snug">{f.txt}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/35 font-medium tracking-wide">
          Balafon Media Group · Stage IAI Cameroun — plateforme de gestion d'antenne
        </p>
      </aside>

      {/* ——— Panneau formulaire ——— */}
      <main className="flex items-center justify-center px-5 py-10 bg-surface bg-dots">
        <div className="w-full max-w-[420px] animate-rise">
          <div className="lg:hidden mb-8">
            <LogoBalafon />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">Espace de travail</p>
          <h2 className="font-display text-[28px] font-black tracking-tight text-ink-900 mt-2">
            {mode === "connexion" ? "Connexion à la régie" : "Demande d'accès"}
          </h2>
          <p className="text-[13.5px] text-ink-500 mt-1.5">
            {mode === "connexion"
              ? "Accédez à votre espace selon votre rôle d'antenne."
              : "Votre demande sera examinée par un administrateur."}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-xl border border-ink-200 bg-ink-100/70 p-1 text-[13px] font-semibold">
            {(["connexion", "demande"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setErreur(null);
                  setDemandeOk(null);
                }}
                className={`py-2 rounded-lg transition-all duration-200 ${
                  mode === m ? "bg-paper shadow-card text-ink-900" : "text-ink-400 hover:text-ink-600"
                }`}
              >
                {m === "connexion" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {demandeOk ? (
            <div className="mt-6 rounded-xl border border-ok/25 bg-emerald-50 p-6 text-center animate-scale-in">
              <span className="inline-grid place-items-center w-12 h-12 rounded-full bg-ok text-white mb-3">
                <Icone name="check" size={26} />
              </span>
              <p className="font-display font-bold text-[16px] text-ink-900">Demande envoyée</p>
              <p className="text-[13px] text-ink-600 mt-1.5 leading-relaxed">{demandeOk}</p>
              <button
                onClick={() => {
                  setDemandeOk(null);
                  setMode("connexion");
                }}
                className="mt-4 text-[13px] font-bold text-secondary-600 hover:underline"
              >
                ← Retour à la connexion
              </button>
            </div>
          ) : (
            <form key={secousse} onSubmit={mode === "connexion" ? soumettre : soumettreDemande} className={secousse > 0 && erreur ? "animate-shake mt-6" : "mt-6"}>
              <div className="space-y-3.5">
                {mode === "demande" && (
                  <label className="relative block">
                    <Icone name="person" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input className={inputCls} placeholder="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" />
                  </label>
                )}
                <label className="relative block">
                  <Icone name="mail" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="Adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
                <label className="relative block">
                  <Icone name="key" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                  <input
                    className={inputCls}
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "connexion" ? "current-password" : "new-password"}
                  />
                </label>
              </div>

              {erreur && (
                <p className="mt-3.5 flex items-center gap-2 text-[13px] font-semibold text-live animate-fade-in">
                  <Icone name="error" size={16} /> {erreur}
                </p>
              )}

              <button
                type="submit"
                disabled={chargement}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-[14px] font-bold text-white hover:bg-primary-700 active:scale-[0.99] transition-all disabled:opacity-60"
              >
                {chargement ? <Spinner size={17} /> : <Icone name={mode === "connexion" ? "login" : "how_to_reg"} size={18} />}
                {mode === "connexion" ? "Se connecter" : "Envoyer la demande"}
              </button>
            </form>
          )}

          {MODE_DEMO && mode === "connexion" && !demandeOk && (
            <div className="mt-8">
              <p className="flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-300">
                <span className="h-px flex-1 bg-ink-200" /> Comptes de démonstration <span className="h-px flex-1 bg-ink-200" />
              </p>
              <div className="mt-4 space-y-2">
                {USERS_DEMO.map((u) => (
                  <button
                    key={u.email}
                    onClick={() => {
                      setEmail(u.email);
                      setPassword(u.password);
                      setErreur(null);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg border border-ink-200 bg-paper px-3.5 py-2.5 text-left transition-all duration-150 hover:border-primary-300 hover:shadow-card group"
                  >
                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <Icone name={u.role === "admin" ? "dashboard" : u.role === "directeur" ? "fact_check" : "live_tv"} size={16} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.5px] font-bold text-ink-800">{ROLE_LABELS[u.role]}</span>
                      <span className="block text-[11px] text-ink-400 font-mono truncate">
                        {u.email} · {u.password}
                      </span>
                    </span>
                    <Icone name="arrow_forward" size={16} className="text-ink-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ink-400 mt-4 text-center leading-relaxed">
                Mode démo : données simulées en local (aucun backend requis).
                <br />
                Ouvrez <span className="font-mono font-semibold">/regie</span> et <span className="font-mono font-semibold">/directeur</span> dans deux onglets pour voir le temps réel.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

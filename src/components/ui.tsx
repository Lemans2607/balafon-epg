import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileEdit,
  Info,
  Loader2,
  LogOut,
  Radio,
  Trash2,
  Tv,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Role, StatutGrille } from "../types";
import { useApp } from "../context/AppContext";

/* ——— Logo ——— */

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg width={compact ? 28 : 34} height={compact ? 28 : 34} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="15" fill="#FF5722" />
        <rect x="12" y="13" width="9" height="38" rx="4" fill="#0A0A0A" />
        <rect x="27" y="17" width="9" height="30" rx="4" fill="#0A0A0A" opacity=".85" />
        <rect x="42" y="21" width="9" height="22" rx="4" fill="#0A0A0A" opacity=".68" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="font-display font-black text-[19px] tracking-tight text-white block">
            BALAFON<span className="text-brand">+</span>
          </span>
          <span className="block text-[9px] font-bold uppercase tracking-[0.28em] text-white/35 mt-1">Guide</span>
        </span>
      )}
    </span>
  );
}

/* ——— Horloge ——— */

export function HorlogeMono({ secondes = false, className = "" }: { secondes?: boolean; className?: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {p(now.getHours())}:{p(now.getMinutes())}
      {secondes && <span className="opacity-45">:{p(now.getSeconds())}</span>}
    </span>
  );
}

/* ——— Progression ——— */

export function ProgressBar({
  value,
  color = "var(--color-brand)",
  striped = false,
  className = "h-[5px]",
}: {
  value: number;
  color?: string;
  striped?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full rounded-full bg-panel3 overflow-hidden ${className}`}>
      <div
        className="relative h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      >
        {striped && <span className="absolute inset-0 bg-stripes-live animate-stripes rounded-full" />}
      </div>
    </div>
  );
}

/* ——— Badge de statut (workflow UML) ——— */

const STATUT_STYLE: Record<StatutGrille, { label: string; cls: string; Icon: LucideIcon; pulse?: boolean }> = {
  brouillon: { label: "Brouillon", cls: "bg-panel3 text-white/60 border-line2", Icon: FileEdit },
  en_attente: { label: "En attente de validation", cls: "bg-warn/10 text-warn border-warn/30", Icon: AlertTriangle, pulse: true },
  valide: { label: "Validée", cls: "bg-ok/10 text-ok border-ok/30", Icon: CheckCircle2 },
  supprimee: { label: "Supprimée", cls: "bg-danger/10 text-danger border-danger/30", Icon: Trash2 },
};

export function StatutBadge({ statut, compact = false }: { statut: StatutGrille; compact?: boolean }) {
  const s = STATUT_STYLE[statut];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-bold whitespace-nowrap ${s.cls} ${
        compact ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1"
      }`}
    >
      <s.Icon size={compact ? 11 : 13} className={s.pulse ? "animate-blink" : ""} />
      {s.label}
    </span>
  );
}

/* ——— État vide ——— */

export function EtatVide({ Icon, titre, texte }: { Icon: LucideIcon; titre: string; texte?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <span className="grid place-items-center w-14 h-14 rounded-xl bg-panel2 border border-line text-white/30 mb-4">
        <Icon size={24} />
      </span>
      <p className="font-display font-bold text-[15px] text-white/70">{titre}</p>
      {texte && <p className="text-[13px] text-white/35 mt-1.5 max-w-[340px] leading-relaxed">{texte}</p>}
    </div>
  );
}

/* ——— Toasts ——— */

type ToastType = "succes" | "erreur" | "info" | "alerte";
interface Toast {
  id: number;
  type: ToastType;
  titre: string;
  message?: string;
}
const ToastCtx = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

const T_STYLE: Record<ToastType, { Icon: LucideIcon; color: string }> = {
  succes: { Icon: CheckCircle2, color: "var(--color-ok)" },
  erreur: { Icon: XCircle, color: "var(--color-danger)" },
  info: { Icon: Info, color: "var(--color-info)" },
  alerte: { Icon: AlertTriangle, color: "var(--color-warn)" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4600);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2.5 w-[min(370px,calc(100vw-2.5rem))]">
        <AnimatePresence>
          {toasts.map((t) => {
            const s = T_STYLE[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="relative overflow-hidden flex items-start gap-3 bg-panel2 border border-line rounded-xl shadow-pop pl-4 pr-3 py-3.5"
              >
                <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: s.color }} />
                <s.Icon size={19} className="mt-px flex-none" style={{ color: s.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-white leading-snug">{t.titre}</p>
                  {t.message && <p className="text-[12.5px] text-white/55 mt-0.5 leading-snug">{t.message}</p>}
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-white/30 hover:text-white transition-colors mt-px"
                  aria-label="Fermer"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast doit être utilisé sous <ToastProvider>");
  return ctx;
}

/* ——— Modale ——— */

export function Modale({
  ouvert,
  onFermer,
  titre,
  sousTitre,
  children,
  footer,
  largeur = "max-w-lg",
}: {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  sousTitre?: string;
  children: ReactNode;
  footer?: ReactNode;
  largeur?: string;
}) {
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [ouvert, onFermer]);

  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" onClick={onFermer} />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${largeur} max-h-[88vh] flex flex-col rounded-xl bg-panel border border-line shadow-pop`}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line flex-none">
              <div>
                <h2 className="font-display text-lg font-extrabold tracking-tight text-white">{titre}</h2>
                {sousTitre && <p className="text-[12.5px] text-white/40 mt-0.5">{sousTitre}</p>}
              </div>
              <button
                onClick={onFermer}
                className="grid place-items-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-panel3 transition-colors flex-none"
                aria-label="Fermer"
              >
                <X size={17} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-line flex-none">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({
  ouvert,
  titre,
  message,
  confirmLabel,
  annulerLabel = "Annuler",
  danger = true,
  loading = false,
  onAnnuler,
  onConfirmer,
}: {
  ouvert: boolean;
  titre: string;
  message: ReactNode;
  confirmLabel: string;
  annulerLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onAnnuler: () => void;
  onConfirmer: () => void;
}) {
  return (
    <Modale ouvert={ouvert} onFermer={onAnnuler} titre={titre} largeur="max-w-md">
      <div className="flex items-start gap-4">
        <span
          className={`grid place-items-center w-11 h-11 rounded-xl flex-none ${
            danger ? "bg-danger/10 text-danger" : "bg-brand/10 text-brand"
          }`}
        >
          {danger ? <Trash2 size={20} /> : <CheckCircle2 size={20} />}
        </span>
        <p className="text-[13.5px] text-white/70 leading-relaxed pt-1">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <button
          onClick={onAnnuler}
          className="px-4 py-2 rounded-lg border border-line text-[13px] font-semibold text-white/60 hover:bg-panel3 hover:text-white transition-colors"
        >
          {annulerLabel}
        </button>
        <button
          onClick={onConfirmer}
          disabled={loading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 ${
            danger ? "bg-danger hover:bg-red-700" : "bg-ok hover:brightness-110"
          }`}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modale>
  );
}

/* ——— Console (shell Directeur / Régie) ——— */

const ROLE_LABEL: Record<Role, string> = {
  directeur: "Directeur d'Antenne",
  regie: "Régie Diffusion",
  telespectateur: "Téléspectateur",
};

export function ConsoleShell({
  titre,
  sousTitre,
  role,
  itemPrincipal,
  actions,
  children,
}: {
  titre: string;
  sousTitre?: string;
  role: "directeur" | "regie";
  itemPrincipal: { label: string; Icon: LucideIcon };
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useApp();
  const initiales = user?.nom
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen bg-oled text-white">
      <aside className="fixed inset-y-0 left-0 z-40 w-[230px] hidden lg:flex flex-col bg-coal border-r border-line">
        <div className="px-5 pt-6 pb-6">
          <Logo />
        </div>
        <p className="px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/25 mb-2.5">
          Console · {ROLE_LABEL[role]}
        </p>
        <nav className="px-3 space-y-1 flex-1">
          <span className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-brand/10 text-brand text-[13.5px] font-bold border border-brand/20">
            <itemPrincipal.Icon size={18} />
            {itemPrincipal.label}
          </span>
          <NavLink
            to="/guide"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-white/45 hover:text-white hover:bg-panel2 text-[13.5px] font-medium transition-colors"
          >
            <CalendarDays size={18} /> Guide TV
          </NavLink>
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-white/45 hover:text-white hover:bg-panel2 text-[13.5px] font-medium transition-colors"
          >
            <Tv size={18} /> Portail téléspectateur
          </NavLink>
          {role === "directeur" && (
            <NavLink
              to="/regie"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-white/45 hover:text-white hover:bg-panel2 text-[13.5px] font-medium transition-colors"
            >
              <Radio size={18} /> Vue Régie
            </NavLink>
          )}
        </nav>
        <div className="p-3 border-t border-line">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-brand/15 text-brand font-display font-bold text-[12px] flex-none">
              {initiales}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold truncate leading-tight">{user?.nom}</span>
              <span className="block text-[10.5px] text-white/35 truncate">{ROLE_LABEL[role]}</span>
            </span>
            <button
              onClick={logout}
              className="text-white/30 hover:text-danger transition-colors p-1.5 rounded-md hover:bg-panel2"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[230px]">
        <header className="sticky top-0 z-30 glass border-b border-line">
          <div className="flex items-center justify-between gap-4 px-5 sm:px-8 h-[64px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="lg:hidden flex-none">
                <Logo compact />
              </span>
              <div className="min-w-0">
                <h1 className="font-display font-extrabold tracking-tight text-[17px] leading-none truncate">{titre}</h1>
                {sousTitre && <p className="text-[11.5px] text-white/35 mt-1 truncate">{sousTitre}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-none">
              {actions}
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-white/45 border border-line rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-dot" style={{ boxShadow: "0 0 0 0 rgb(47 191 113 / .5)" }} />
                Synchro active
              </span>
              <HorlogeMono
                secondes
                className="hidden sm:block text-[13px] font-semibold text-white/65 border border-line rounded-full px-3 py-1.5 bg-panel"
              />
            </div>
          </div>
          <nav className="lg:hidden flex gap-1.5 px-4 pb-2.5 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-white text-[12px] font-bold whitespace-nowrap">
              <itemPrincipal.Icon size={13} /> {itemPrincipal.label}
            </span>
            <Link to="/guide" className="px-3 py-1.5 rounded-full bg-panel2 text-white/55 text-[12px] font-semibold whitespace-nowrap">
              Guide TV
            </Link>
            <Link to="/" className="px-3 py-1.5 rounded-full bg-panel2 text-white/55 text-[12px] font-semibold whitespace-nowrap">
              Portail
            </Link>
            <button onClick={logout} className="px-3 py-1.5 rounded-full bg-panel2 text-white/55 text-[12px] font-semibold whitespace-nowrap">
              Déconnexion
            </button>
          </nav>
        </header>
        <main className="bg-oled bg-grid-dark min-h-[calc(100vh-64px)]">{children}</main>
      </div>
    </div>
  );
}

export { ROLE_LABEL };

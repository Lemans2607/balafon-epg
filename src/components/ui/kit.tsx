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

/* ——— Icône (Material Symbols) ——— */

export function Icone({
  name,
  size = 20,
  filled = false,
  className = "",
}: {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "msf" : ""} ${className}`}
      style={{ fontSize: size, width: size, height: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

/* ——— Logo Balafon Plus ——— */

export function LogoBalafon({ clair = false, compact = false }: { clair?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg width={compact ? 26 : 32} height={compact ? 26 : 32} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="15" fill="#a43700" />
        <rect x="13" y="13" width="9" height="38" rx="3.5" fill="#fff" />
        <rect x="27.5" y="17" width="9" height="30" rx="3.5" fill="#fff" opacity=".87" />
        <rect x="42" y="21" width="9" height="22" rx="3.5" fill="#fff" opacity=".72" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span
            className={`font-display text-[17px] font-black tracking-tight block ${clair ? "text-white" : "text-ink-900"}`}
          >
            BALAFON<span className="text-primary-600">+</span>
          </span>
          <span
            className={`block text-[9px] font-semibold uppercase tracking-[0.22em] mt-1 ${
              clair ? "text-white/45" : "text-ink-400"
            }`}
          >
            Media Group
          </span>
        </span>
      )}
    </span>
  );
}

/** Rangée de touches de balafon — motif signature de la marque. */
export function TouchesBalafon({ className = "" }: { className?: string }) {
  const touches = [42, 36, 30, 25, 20, 16, 13, 10];
  return (
    <span className={`inline-flex items-end gap-[5px] ${className}`} aria-hidden="true">
      {touches.map((h, i) => (
        <span
          key={i}
          className="w-[7px] rounded-[3px] bg-primary-600 transition-transform duration-300 hover:-translate-y-1"
          style={{ height: h, opacity: 1 - i * 0.09 }}
        />
      ))}
    </span>
  );
}

/* ——— Horloge temps réel ——— */

export function Horloge({ secondes = false, className = "" }: { secondes?: boolean; className?: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {h}:{m}
      {secondes && <span className="opacity-50">:{s}</span>}
    </span>
  );
}

/* ——— Spinner ——— */

export function Spinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
      style={{ width: size, height: size }}
      aria-label="Chargement"
    />
  );
}

/* ——— État vide ——— */

export function EtatVide({
  icone,
  titre,
  texte,
  dark = false,
}: {
  icone: string;
  titre: string;
  texte?: string;
  dark?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${dark ? "text-white/50" : "text-ink-400"}`}>
      <span
        className={`grid place-items-center w-14 h-14 rounded-2xl mb-4 ${
          dark ? "bg-dark-700/60 text-white/40" : "bg-ink-100 text-ink-400"
        }`}
      >
        <Icone name={icone} size={26} />
      </span>
      <p className={`font-display font-bold text-[15px] ${dark ? "text-white/70" : "text-ink-600"}`}>{titre}</p>
      {texte && <p className={`text-[13px] mt-1.5 max-w-[300px] ${dark ? "text-white/35" : "text-ink-400"}`}>{texte}</p>}
    </div>
  );
}

/* ——— Modale ——— */

export function Modale({
  ouvert,
  onFermer,
  titre,
  sousTitre,
  children,
  largeur = "max-w-lg",
  dark = false,
}: {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  sousTitre?: string;
  children: ReactNode;
  largeur?: string;
  dark?: boolean;
}) {
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-[2px] animate-fade-in" onClick={onFermer} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${largeur} max-h-[88vh] overflow-y-auto rounded-xl shadow-pop animate-scale-in ${
          dark ? "bg-dark-800 text-white border border-dark-line" : "bg-paper text-ink-900 border border-ink-100"
        }`}
      >
        <div className={`sticky top-0 z-10 flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b ${dark ? "bg-dark-800 border-dark-line" : "bg-paper border-ink-100"}`}>
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight">{titre}</h2>
            {sousTitre && <p className={`text-[12.5px] mt-0.5 ${dark ? "text-white/45" : "text-ink-400"}`}>{sousTitre}</p>}
          </div>
          <button
            onClick={onFermer}
            className={`grid place-items-center w-8 h-8 rounded-lg transition-colors ${
              dark ? "hover:bg-dark-700 text-white/50" : "hover:bg-ink-100 text-ink-400"
            }`}
            aria-label="Fermer"
          >
            <Icone name="close" size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ——— Toasts ——— */

export type ToastType = "succes" | "erreur" | "info" | "alerte";
interface Toast {
  id: number;
  type: ToastType;
  titre: string;
  message?: string;
}

interface ToastCtx {
  push: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

const TOAST_STYLE: Record<ToastType, { icon: string; bar: string; iconColor: string }> = {
  succes: { icon: "check_circle", bar: "bg-ok", iconColor: "text-ok" },
  erreur: { icon: "error", bar: "bg-live", iconColor: "text-live" },
  info: { icon: "info", bar: "bg-secondary-600", iconColor: "text-secondary-600" },
  alerte: { icon: "warning", bar: "bg-warn", iconColor: "text-warn" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4800);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((t) => {
          const s = TOAST_STYLE[t.type];
          return (
            <div
              key={t.id}
              className="relative overflow-hidden flex items-start gap-3 bg-ink-900 text-white rounded-lg shadow-pop pl-4 pr-3 py-3 animate-rise"
              role="status"
            >
              <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${s.bar}`} />
              <Icone name={s.icon} size={20} filled className={`${s.iconColor} mt-px`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold leading-snug">{t.titre}</p>
                {t.message && <p className="text-[12.5px] text-white/60 mt-0.5 leading-snug">{t.message}</p>}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-white/40 hover:text-white transition-colors mt-px"
                aria-label="Fermer la notification"
              >
                <Icone name="close" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé sous <ToastProvider>");
  return ctx;
}

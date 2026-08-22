import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Phone,
  Play,
  Search,
  Star,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import { VOD, chaineDe } from "../../data/mock";
import { useApp } from "../../context/AppContext";
import { Logo, useToast } from "../ui";
import type { VodItem } from "../../types";

/* ——— Navbar sticky glassmorphism ——— */

export function Navbar({
  query,
  onQuery,
  onOuvrir,
}: {
  query: string;
  onQuery: (q: string) => void;
  onOuvrir: (item: VodItem) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [avatar, setAvatar] = useState(false);
  const { user, logout } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatar(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const resultats = query.trim().length > 1 ? VOD.filter((v) => v.titre.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) : [];

  const aller = (path: string, section?: string) => {
    setMenu(false);
    if (section) navigate(path, { state: { section } });
    else navigate(path);
  };

  const lienActif = (path: string) => location.pathname === path;

  const liens = [
    { label: "Accueil", onClick: () => aller("/") },
    { label: "Guide TV", onClick: () => aller("/guide") },
    { label: "Replay", onClick: () => aller("/", "replay") },
    { label: "Live", onClick: () => aller("/guide") },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || menu || query ? "glass border-b border-white/[0.06] shadow-card" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="h-[64px] px-5 lg:px-10 flex items-center gap-7">
        <button onClick={() => aller("/")} className="flex-none" aria-label="Accueil Balafon+">
          <Logo />
        </button>

        <nav className="hidden md:flex items-center gap-6">
          {liens.map((l) => {
            const actif = (l.label === "Accueil" && lienActif("/")) || (l.label === "Guide TV" && lienActif("/guide")) || (l.label === "Live" && lienActif("/guide"));
            return (
              <button
                key={l.label}
                onClick={l.onClick}
                className={`relative text-[13px] font-semibold transition-colors ${actif ? "text-white" : "text-white/55 hover:text-white"}`}
              >
                {l.label}
                {actif && <span className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-brand" />}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Recherche */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Rechercher…"
            className={`rounded-full bg-white/[0.08] border border-white/10 pl-9 pr-3.5 py-1.5 text-[13px] font-medium text-white placeholder:text-white/30 transition-all duration-300 focus:border-brand/60 focus:bg-white/[0.12] outline-none ${
              query ? "w-[210px] sm:w-[250px]" : "w-[42px] sm:w-[160px] focus:w-[210px] sm:focus:w-[250px]"
            }`}
            aria-label="Rechercher un programme"
          />
          {query.trim().length > 1 && (
            <div className="absolute top-[calc(100%+10px)] right-0 w-[min(340px,calc(100vw-2rem))] bg-panel border border-line rounded-xl shadow-pop p-2 animate-scale-in">
              {resultats.length === 0 ? (
                <p className="px-3 py-5 text-center text-[12.5px] text-white/35">
                  Aucun résultat pour « {query.trim()} »
                </p>
              ) : (
                resultats.map((v) => {
                  const ch = chaineDe(v.chaine);
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        onOuvrir(v);
                        onQuery("");
                      }}
                      className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-panel3 transition-colors text-left"
                    >
                      <span
                        className="w-10 h-14 rounded-md overflow-hidden flex-none border border-line"
                        style={{ background: v.image ? undefined : `linear-gradient(160deg, ${v.art[0]}, ${v.art[1]})` }}
                      >
                        {v.image && <img src={v.image} alt="" className="w-full h-full object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold truncate">{v.titre}</span>
                        <span className="block text-[11px] text-white/40">
                          {v.sousTitre} · {ch.nom}
                        </span>
                      </span>
                      <Play size={14} className="ml-auto text-white/30 flex-none" />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => toast.push({ type: "info", titre: "3 nouveaux replays", message: "Les dernières éditions du JT et du Débat du Soir sont en ligne." })}
          className="relative grid place-items-center w-9 h-9 rounded-full text-white/60 hover:text-white hover:bg-white/[0.07] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand animate-pulse-dot" />
        </button>

        {user ? (
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatar((a) => !a)}
              className="grid place-items-center w-9 h-9 rounded-full bg-brand/20 text-brand font-display font-bold text-[12px] ring-1 ring-white/15 hover:ring-brand/60 transition-all"
              aria-label="Menu utilisateur"
            >
              {user.nom
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </button>
            {avatar && (
              <div className="absolute top-[calc(100%+10px)] right-0 w-[220px] bg-panel border border-line rounded-xl shadow-pop p-2 animate-scale-in">
                <div className="px-3 py-2.5 border-b border-line mb-1">
                  <p className="text-[13px] font-bold truncate">{user.nom}</p>
                  <p className="text-[11px] text-white/40 capitalize">{user.role === "regie" ? "Régie Diffusion" : user.role === "directeur" ? "Directeur d'Antenne" : "Téléspectateur"}</p>
                </div>
                {user.role !== "telespectateur" && (
                  <Link
                    to={user.role === "directeur" ? "/directeur" : "/regie"}
                    onClick={() => setAvatar(false)}
                    className="block px-3 py-2 rounded-lg text-[13px] font-semibold text-white/70 hover:bg-panel3 hover:text-white transition-colors"
                  >
                    Ouvrir ma console
                  </Link>
                )}
                <button
                  onClick={() => {
                    setAvatar(false);
                    logout();
                    toast.push({ type: "info", titre: "Déconnexion", message: "À bientôt sur Balafon+." });
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[13px] font-semibold text-white/70 hover:bg-panel3 hover:text-danger transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 hover:border-white/45 px-4 py-1.5 text-[12.5px] font-bold transition-colors"
          >
            Se connecter
          </Link>
        )}

        <button
          onClick={() => setMenu((m) => !m)}
          className="md:hidden grid place-items-center w-9 h-9 rounded-lg text-white/70 hover:bg-white/[0.07] transition-colors"
          aria-label="Menu"
        >
          {menu ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {menu && (
        <div className="md:hidden glass border-b border-white/[0.06] px-5 pb-5 pt-2 animate-fade">
          {liens.map((l) => (
            <button key={l.label} onClick={l.onClick} className="block w-full text-left py-2.5 text-[15px] font-semibold text-white/75 hover:text-white">
              {l.label}
            </button>
          ))}
          {!user && (
            <Link to="/login" className="mt-2 inline-flex items-center gap-2 bg-brand text-white font-bold text-[13px] px-4 py-2 rounded-lg">
              Se connecter
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

/* ——— Footer ——— */

export function Footer() {
  const toast = useToast();
  const lien = (label: string) => (
    <button
      key={label}
      onClick={() => toast.push({ type: "info", titre: label, message: "Section disponible prochainement sur Balafon+." })}
      className="block text-[13px] text-white/40 hover:text-white transition-colors py-1"
    >
      {label}
    </button>
  );

  return (
    <footer className="bg-black border-t border-white/[0.06] mt-20">
      <div className="max-w-[1240px] mx-auto px-5 lg:px-10 pt-14 pb-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="text-[13px] text-white/40 leading-relaxed mt-4 max-w-[300px]">
              Le guide des programmes et la plateforme streaming du groupe Balafon Media — Douala, Yaoundé, Bafoussam.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {["Smart TV", "Android TV", "Apple TV", "Mobile"].map((c) => (
                <span key={c} className="text-[10.5px] font-semibold text-white/40 border border-white/10 rounded-full px-2.5 py-1">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3">Navigation</h4>
            {["Accueil", "Guide TV", "Replay", "Live"].map(lien)}
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3">Légal</h4>
            {["Conditions d'utilisation", "Confidentialité", "Cookies", "Mentions légales"].map(lien)}
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3">Contact</h4>
            <p className="flex items-center gap-2.5 text-[13px] text-white/40 py-1">
              <Mail size={14} className="text-brand" /> contact@balafon.cm
            </p>
            <p className="flex items-center gap-2.5 text-[13px] text-white/40 py-1">
              <Phone size={14} className="text-brand" /> +237 6 99 00 23 23
            </p>
            <p className="flex items-center gap-2.5 text-[13px] text-white/40 py-1">
              <MapPin size={14} className="text-brand" /> Rue Joss, Akwa — Douala
            </p>
            <div className="flex gap-2 mt-4">
              {[Facebook, Twitter, Instagram, Youtube].map((I, i) => (
                <button
                  key={i}
                  onClick={() => toast.push({ type: "info", titre: "Réseaux sociaux", message: "Retrouvez Balafon Media sur tous les réseaux." })}
                  className="grid place-items-center w-8 h-8 rounded-full border border-white/10 text-white/50 hover:bg-brand hover:border-brand hover:text-white transition-all"
                  aria-label="Réseau social"
                >
                  <I size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.06] mt-10 pt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11.5px] text-white/30">© 2026 Balafon Media — Tous droits réservés.</p>
          <p className="text-[11.5px] text-white/30">
            BALAFON<span className="text-brand font-bold">+</span> Guide · conçu à Douala, Cameroun
          </p>
        </div>
      </div>
    </footer>
  );
}

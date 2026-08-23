import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Info, MonitorPlay, Play } from "lucide-react";
import type { BlocPlace, Programme } from "../types";
import { PROGRAMMES } from "../data/mock";
import { CATS, JOURS_LONG, TYPES, finBlocLabel, jourIdxAujourdhui, slotLabel } from "../utils/epg";
import { useNow, useStudio } from "../state/store";
import { TimelineJour } from "../components/EpgTimeline";
import { LogoTV, Modale, OngletsJours, ProgressBar, useToast } from "../components/shared";

export function PublicGuide() {
  const { grilleAntenne } = useStudio();
  const now = useNow(30_000);
  const toast = useToast();
  const [jourIdx, setJourIdx] = useState(() => jourIdxAujourdhui());
  const [detail, setDetail] = useState<{ bloc: BlocPlace; prog: Programme } | null>(null);

  const auj = jourIdxAujourdhui(now);
  const dateJour = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (jourIdx - auj));
    return d;
  }, [jourIdx, auj]);

  return (
    <div className="min-h-screen bg-void text-white">
      {/* ——— Navbar ——— */}
      <header className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 h-[64px] flex items-center gap-7">
          <Link to="/" aria-label="Accueil Balafon TV">
            <LogoTV compact />
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            <Link to="/" className="text-[13.5px] font-semibold text-white/55 hover:text-white transition-colors">Accueil</Link>
            <Link to="/guide" className="relative text-[13.5px] font-semibold text-white">
              Guide TV
              <span className="absolute -bottom-[6px] left-0 right-0 h-[2.5px] rounded-full bg-bred" />
            </Link>
          </nav>
          <div className="flex-1" />
          <Link to="/" className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={15} /> Retour au portail
          </Link>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-5 lg:px-8 pt-10 pb-16">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <p className="inline-flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.24em] text-bred">
            <MonitorPlay size={13} /> Sélectionner · Afficher
          </p>
          <div className="flex flex-wrap items-end justify-between gap-5 mt-3">
            <div>
              <h1 className="font-display font-black text-[36px] sm:text-[46px] tracking-tight leading-none">
                Guide <span className="text-bred">TV</span>
              </h1>
              <p className="text-[13px] text-white/40 mt-2.5 flex items-center gap-2">
                <CalendarDays size={14} className="text-white/30" />
                {JOURS_LONG[jourIdx]} {dateJour.getDate()} {dateJour.toLocaleDateString("fr-FR", { month: "long" })} — grille à la minute près, heure de Douala
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-sgreen bg-sgreen/10 border border-sgreen/30 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sgreen animate-pulse" /> Grille validée — Balafon TV
            </span>
          </div>

          <div className="mt-7">
            <OngletsJours actif={jourIdx} onChange={setJourIdx} soulignerAujourdhui={auj} />
          </div>
        </motion.header>

        {/* ——— Timeline ——— */}
        <motion.section
          key={jourIdx + (grilleAntenne?.id ?? "")}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
          className="mt-6"
        >
          {grilleAntenne ? (
            <TimelineJour
              grilleId={grilleAntenne.id}
              jourIdx={jourIdx}
              mode="public"
              playhead={jourIdx === auj}
              onDetail={(bloc, prog) => setDetail({ bloc, prog })}
            />
          ) : (
            <div className="h-[220px] rounded-xl skeleton" />
          )}

          {/* Légende */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[11.5px] font-semibold text-white/45">
            {Object.entries(CATS).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c.color }} /> {c.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-white/30">
              <span className="w-4 h-2.5 rounded stripes-dark border border-white/10" /> Hors antenne / Rediffusion
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-[3px] rounded bg-bred" /> Maintenant
            </span>
          </div>
        </motion.section>

        <p className="flex items-center gap-2 text-[12px] text-white/30 mt-6">
          <Info size={14} className="text-white/25" />
          Les plages non diffusées sont signalées « Hors antenne / Rediffusion » — plus aucun compteur de nuit vide.
          Les horaires peuvent évoluer en cas d'édition spéciale décidée en régie.
        </p>
      </main>

      {/* ——— Détail programme ——— */}
      <Modale
        ouvert={detail !== null}
        onFermer={() => setDetail(null)}
        titre={detail?.prog.titre ?? ""}
        sousTitre={detail ? `Balafon TV · ${JOURS_LONG[jourIdx]}` : undefined}
      >
        {detail && (
          <>
            {detail.prog.image && (
              <img src={detail.prog.image} alt="" className="-mx-6 -mt-5 mb-5 h-[210px] w-[calc(100%+3rem)] object-cover" />
            )}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded border" style={{ color: CATS[detail.prog.categorie].color, borderColor: `${CATS[detail.prog.categorie].color}45`, background: `${CATS[detail.prog.categorie].color}14` }}>
                {CATS[detail.prog.categorie].label}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded border border-line text-white/55 bg-pane">{TYPES[detail.prog.type]}</span>
              <span className="font-mono text-[13px] font-bold text-white/80 tabular-nums">
                {slotLabel(detail.bloc.slot)} – {finBlocLabel(detail.bloc.slot, detail.prog.duree)}
              </span>
            </div>
            <p className="text-[13.5px] text-white/60 leading-relaxed mt-4">{detail.prog.description}</p>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => toast.push({ type: "succes", titre: "Rappel programmé", message: `« ${detail.prog.titre} » à ${slotLabel(detail.bloc.slot)} — notification simulée.` })}
                className="inline-flex items-center gap-2 bg-bred hover:bg-bred2 text-white font-bold text-[13px] px-4 py-2.5 rounded-lg shadow-glow-red transition-all active:scale-95"
              >
                <Play size={14} fill="currentColor" /> Me le rappeler
              </button>
              <button onClick={() => setDetail(null)} className="px-4 py-2.5 rounded-lg border border-line text-[13px] font-semibold text-white/60 hover:bg-pane2 transition-colors">
                Fermer
              </button>
            </div>
          </>
        )}
      </Modale>

      <footer className="bg-black border-t border-white/[0.06] py-6">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <LogoTV compact />
          <p className="text-[11.5px] text-white/30">© 2026 Balafon Media — Guide des programmes Balafon TV</p>
        </div>
      </footer>

    </div>
  );
}

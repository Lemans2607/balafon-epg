import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlarmClock, ChevronRight, Radio, Star } from "lucide-react";
import type { Emission, Grille, VodItem } from "../types";
import { CATS, TYPES, chaineDe } from "../data/mock";
import { useApp } from "../context/AppContext";
import {
  JOURS_COURT,
  addDays,
  dureeLabel,
  emissionSuivante,
  fmtJour,
  isoJour,
  parseJour,
  toMin,
} from "../utils/epg";
import { Footer, Navbar } from "../components/viewer/ViewerChrome";
import { EpgTimeline } from "../components/viewer/EpgTimeline";
import { VodModal } from "../components/viewer/VodModal";
import { Modale, StatutBadge, useToast } from "../components/ui";

export function GuideTv() {
  const { grilles, pret } = useApp();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [vodOuvert, setVodOuvert] = useState<VodItem | null>(null);
  const [jourIdx, setJourIdx] = useState(0);
  const [grilleId, setGrilleId] = useState<string>("toutes");
  const [detail, setDetail] = useState<{ e: Emission; g: Grille } | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => isoJour(addDays(new Date(), i))), []);
  const jour = jours[jourIdx];

  const grillesValides = useMemo(() => grilles.filter((g) => g.statut === "valide"), [grilles]);
  const selection = useMemo(
    () => (grilleId === "toutes" ? grillesValides : grillesValides.filter((g) => g.id === grilleId)),
    [grillesValides, grilleId]
  );

  /* « À suivre » — prochains programmes toutes chaînes */
  const aSuivre = useMemo(() => {
    if (jourIdx !== 0) return [];
    const out: { g: Grille; e: Emission }[] = [];
    for (const g of grillesValides) {
      const e = emissionSuivante(g, now);
      if (e) out.push({ g, e });
    }
    return out.sort((a, b) => toMin(a.e.debut) - toMin(b.e.debut)).slice(0, 6);
  }, [grillesValides, now, jourIdx]);

  return (
    <div className="min-h-screen bg-oled text-white">
      <Navbar query={query} onQuery={setQuery} onOuvrir={setVodOuvert} />

      <main className="pt-[92px] pb-6 max-w-[1240px] mx-auto px-5 lg:px-10">
        {/* ——— En-tête + sélecteur de grille ——— */}
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand">Consulter · Sélectionner · Afficher</p>
          <div className="flex flex-wrap items-end justify-between gap-5 mt-2.5">
            <div>
              <h1 className="font-display font-black text-[34px] sm:text-[42px] tracking-tight leading-none">
                Guide <span className="text-brand">TV</span>
              </h1>
              <p className="text-[13px] text-white/40 mt-2">
                {fmtJour(jour)} — horaires en heure locale (Douala) · grilles validées par la Régie Diffusion
              </p>
            </div>

            {/* Sélecteur « Sélectionner Grille de Programmes » */}
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 rounded-lg border border-line bg-panel pl-3 pr-1 py-1">
                <Radio size={15} className="text-brand" />
                <select
                  value={grilleId}
                  onChange={(e) => setGrilleId(e.target.value)}
                  className="bg-transparent text-[13px] font-semibold py-1.5 outline-none cursor-pointer"
                  aria-label="Sélectionner une grille de programmes"
                >
                  <option value="toutes" className="bg-panel">Toutes les chaînes</option>
                  {grillesValides.map((g) => (
                    <option key={g.id} value={g.id} className="bg-panel">
                      {chaineDe(g.chaineId).nom} — {g.nom}
                    </option>
                  ))}
                </select>
              </label>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ok bg-ok/10 border border-ok/25 rounded-lg px-2.5 py-2">
                <StatutBadge statut="valide" compact />
              </span>
            </div>
          </div>

          {/* Sélecteur de jour */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-6">
            {jours.map((j, i) => {
              const d = parseJour(j);
              const actif = i === jourIdx;
              return (
                <button
                  key={j}
                  onClick={() => setJourIdx(i)}
                  className={`flex-none px-4 py-2.5 rounded-lg border text-[13px] font-bold transition-all duration-200 ${
                    actif
                      ? "bg-brand border-brand text-white shadow-glow"
                      : i === 0
                      ? "bg-panel border-brand/35 text-brand hover:border-brand/70"
                      : "bg-panel border-line text-white/55 hover:border-line2 hover:text-white"
                  }`}
                >
                  {i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : `${JOURS_COURT[(d.getDay() + 6) % 7]} ${d.getDate()}`}
                </button>
              );
            })}
          </div>
        </motion.header>

        {/* ——— Timeline + À suivre ——— */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 mt-6 items-start">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }} key={jour + grilleId}>
            {pret ? (
              <EpgTimeline jour={jour} grilles={selection} onClic={(e, g) => setDetail({ e, g })} />
            ) : (
              <div className="h-[420px] rounded-xl skeleton" />
            )}

            {/* Légende */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[11.5px] font-semibold text-white/45">
              {Object.entries(CATS).map(([k, c]) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c.color }} /> {c.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-[3px] rounded bg-brand" /> Maintenant
              </span>
            </div>
          </motion.section>

          {/* À suivre */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
            className="rounded-xl border border-line bg-panel overflow-hidden lg:sticky lg:top-[84px]"
          >
            <header className="flex items-center gap-2 px-5 py-3.5 border-b border-line">
              <AlarmClock size={16} className="text-brand" />
              <h2 className="font-display font-bold text-[14px] tracking-tight">À suivre ce soir</h2>
            </header>
            {!pret ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[46px] rounded-lg skeleton" />
                ))}
              </div>
            ) : aSuivre.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12.5px] text-white/35">
                {jourIdx === 0 ? "Plus aucun programme aujourd'hui." : "Sélectionnez « Aujourd'hui » pour voir les prochains programmes."}
              </p>
            ) : (
              <ul className="p-2">
                {aSuivre.map(({ g, e }) => {
                  const ch = chaineDe(g.chaineId);
                  const cat = CATS[e.categorie];
                  return (
                    <li key={`${g.id}-${e.id}`}>
                      <button
                        onClick={() => setDetail({ e, g })}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-panel2 transition-colors text-left group"
                      >
                        <span className="font-mono text-[13px] font-bold text-brand w-[46px] flex-none tabular-nums">{e.debut}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold truncate">{e.titre}</span>
                          <span className="flex items-center gap-1.5 text-[10.5px] text-white/35 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: ch.accent }} />
                            {ch.nom} · <span style={{ color: cat.color }}>{cat.label}</span>
                          </span>
                        </span>
                        <ChevronRight size={15} className="text-white/20 group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-none" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.aside>
        </div>
      </main>

      <Footer />

      {/* ——— Détail d'émission ——— */}
      <Modale
        ouvert={detail !== null}
        onFermer={() => setDetail(null)}
        titre={detail?.e.titre ?? ""}
        sousTitre={detail ? `${chaineDe(detail.g.chaineId).nom} · ${fmtJour(detail.e.jour)}` : undefined}
      >
        {detail && (
          <>
            {detail.e.image && (
              <img src={detail.e.image} alt="" className="-mx-6 -mt-5 mb-5 h-[220px] w-[calc(100%+3rem)] object-cover" />
            )}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-md border"
                style={{ color: CATS[detail.e.categorie].color, borderColor: `${CATS[detail.e.categorie].color}40`, background: `${CATS[detail.e.categorie].color}12` }}
              >
                {CATS[detail.e.categorie].label}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-line text-white/55 bg-panel2">
                {TYPES[detail.e.type].label}
              </span>
              <span className="font-mono text-[13px] font-bold text-white/75 tabular-nums">
                {detail.e.debut} – {detail.e.fin}
              </span>
              <span className="text-[11.5px] text-white/35">{dureeLabel(detail.e.debut, detail.e.fin)}</span>
            </div>
            <p className="text-[13.5px] text-white/60 leading-relaxed mt-4">{detail.e.description}</p>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => {
                  toast.push({ type: "succes", titre: "Rappel programmé", message: `« ${detail.e.titre} » à ${detail.e.debut} — notification simulée.` });
                  setDetail(null);
                }}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand2 text-white font-bold text-[13px] px-4 py-2.5 rounded-lg transition-all active:scale-95"
              >
                <AlarmClock size={15} /> Me le rappeler
              </button>
              <button
                onClick={() => setDetail(null)}
                className="px-4 py-2.5 rounded-lg border border-line text-[13px] font-semibold text-white/60 hover:bg-panel3 transition-colors"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </Modale>

      <VodModal item={vodOuvert} dansListe={false} onListe={() => undefined} onFermer={() => setVodOuvert(null)} />
    </div>
  );
}

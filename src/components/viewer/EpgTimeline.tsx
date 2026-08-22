import { useEffect, useMemo, useRef } from "react";
import type { Emission, Grille } from "../../types";
import { CATS, chaineDe } from "../../data/mock";
import {
  estEnDirect,
  estPasse,
  finEnMin,
  isoJour,
  minutesJour,
  progresPct,
  toMin,
} from "../../utils/epg";
import { EtatVide } from "../ui";
import { CalendarX2 } from "lucide-react";

const PX_HEURE = 150;
const LARGEUR_COLONNE = 148;

/**
 * « Afficher Grille » — timeline TV visuelle, heure par heure.
 * Une ligne par chaîne validée, blocs positionnés sur 24 h, ligne « maintenant ».
 */
export function EpgTimeline({
  jour,
  grilles,
  onClic,
}: {
  jour: string;
  grilles: Grille[];
  onClic: (e: Emission, g: Grille) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const now = useMemo(() => new Date(), [jour]);
  const estAujourdhui = jour === isoJour(new Date());

  useEffect(() => {
    const el = ref.current;
    if (el && estAujourdhui) {
      el.scrollLeft = (minutesJour(now) / 1440) * 24 * PX_HEURE - el.clientWidth / 3;
    }
  }, [jour, estAujourdhui, now]);

  if (grilles.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-panel">
        <EtatVide
          Icon={CalendarX2}
          titre="Aucune grille validée"
          texte="La Régie Diffusion n'a pas encore validé de grille pour cette sélection."
        />
      </div>
    );
  }

  const nowPct = (minutesJour(now) / 1440) * 100;

  return (
    <div className="rounded-xl border border-line bg-panel overflow-hidden shadow-card">
      <div ref={ref} className="overflow-x-auto dark-scroll">
        <div style={{ minWidth: LARGEUR_COLONNE + 24 * PX_HEURE }}>
          {/* Règle horaire */}
          <div className="flex border-b border-line bg-coal h-9">
            <div className="flex-none sticky left-0 z-20 bg-coal border-r border-line flex items-center px-4 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/30" style={{ width: LARGEUR_COLONNE }}>
              Chaînes
            </div>
            <div className="relative flex-1" style={{ width: 24 * PX_HEURE }}>
              {Array.from({ length: 24 }, (_, h) => (
                <span
                  key={h}
                  className="absolute top-0 bottom-0 flex items-center pl-2 font-mono text-[10px] font-semibold text-white/35 border-l border-line"
                  style={{ left: h * PX_HEURE }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
          </div>

          {/* Lignes chaînes */}
          {grilles.map((g) => {
            const chaine = chaineDe(g.chaineId);
            const blocs = g.emissions.filter((e) => e.jour === jour).sort((a, b) => toMin(a.debut) - toMin(b.debut));
            const aUnLive = estAujourdhui && blocs.some((e) => estEnDirect(e, new Date()));
            return (
              <div key={g.id} className="flex border-b border-line/70 last:border-b-0 hover:bg-panel2/50 transition-colors">
                <div
                  className="flex-none sticky left-0 z-10 bg-panel border-r border-line px-4 h-[66px] flex flex-col justify-center gap-1.5"
                  style={{ width: LARGEUR_COLONNE }}
                >
                  <p className="font-display font-bold text-[12.5px] truncate leading-none">{chaine.nom}</p>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="text-[8.5px] font-black px-1.5 py-px rounded"
                      style={{ background: chaine.accent, color: chaine.accent === "#FFD54F" ? "#0A0A0A" : "#fff" }}
                    >
                      {chaine.short}
                    </span>
                    {aUnLive && <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />}
                  </span>
                </div>

                <div
                  className="relative h-[66px] flex-1"
                  style={{
                    width: 24 * PX_HEURE,
                    backgroundImage:
                      "repeating-linear-gradient(90deg, var(--color-line) 0 1px, transparent 1px " +
                      PX_HEURE +
                      "px), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px " +
                      PX_HEURE / 2 +
                      "px)",
                  }}
                >
                  {estAujourdhui && (
                    <span className="absolute top-0 bottom-0 z-30 w-[2px] bg-brand pointer-events-none" style={{ left: `${nowPct}%` }}>
                      <span className="absolute -top-px -left-[3px] w-2 h-2 rounded-full bg-brand" />
                    </span>
                  )}

                  {blocs.map((e) => {
                    const cat = CATS[e.categorie];
                    const live = estAujourdhui && estEnDirect(e, new Date());
                    const passe = estPasse(e, new Date()) && !live;
                    const debut = toMin(e.debut);
                    const fin = finEnMin(e);
                    return (
                      <button
                        key={e.id}
                        onClick={() => onClic(e, g)}
                        className={`absolute top-[7px] bottom-[7px] rounded-md text-left px-2.5 pt-1.5 overflow-hidden transition-all duration-200 hover:z-20 hover:shadow-pop hover:-translate-y-[1px] group/bloc ${
                          live ? "z-10 ring-1 ring-brand" : ""
                        } ${passe ? "opacity-30 hover:opacity-60" : ""}`}
                        style={{
                          left: `${(debut / 1440) * 100}%`,
                          width: `${((fin - debut) / 1440) * 100}%`,
                          background: `${cat.color}${live ? "2e" : "17"}`,
                          borderLeft: `3px solid ${cat.color}`,
                        }}
                        title={`${e.titre} · ${e.debut} – ${e.fin}`}
                      >
                        <span className="block font-mono text-[9px] text-white/45 tabular-nums">{e.debut}</span>
                        <span className="block text-[11.5px] font-bold leading-tight truncate text-white/90">{e.titre}</span>
                        {live && (
                          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand">
                            <span
                              className="block h-full bg-white/85"
                              style={{ width: `${100 - progresPct(e, new Date())}%`, marginLeft: "auto" }}
                            />
                          </span>
                        )}
                        <span
                          className="absolute inset-0 opacity-0 group-hover/bloc:opacity-100 transition-opacity flex items-center justify-center bg-black/50 backdrop-blur-[1px]"
                        >
                          <span className="text-[10px] font-bold text-white border border-white/25 rounded-full px-2.5 py-1">
                            Détails
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

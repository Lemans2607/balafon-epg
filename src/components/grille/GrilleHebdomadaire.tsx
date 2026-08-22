import { useEffect, useMemo, useState, type MouseEvent } from "react";
import type { Chaine, Emission } from "../../utils/epgHelpers";
import { CATEGORIES, STATUTS, TYPES_DIFFUSION, estEnDirect, finEnMin, isoJour, toHHMM, toMin } from "../../utils/epgHelpers";
import { Icone, EtatVide } from "../ui/kit";

const HEURE_PX = 78;
const LARGEUR_PISTE = HEURE_PX * 24;

function positionPct(e: Emission) {
  const debut = toMin(e.debut);
  const fin = finEnMin(e);
  return { left: `${(debut / 1440) * 100}%`, width: `${((fin - debut) / 1440) * 100}%` };
}

/** Timeline hebdomadaire : une ligne par chaîne, blocs positionnés sur 24 h. */
export function GrilleHebdomadaire({
  jour,
  chaines,
  emissions,
  onCreer,
  onEditer,
  afficherStatuts = true,
}: {
  jour: string;
  chaines: Chaine[];
  emissions: Emission[];
  onCreer?: (chaineId: string, debut: string) => void;
  onEditer?: (e: Emission) => void;
  afficherStatuts?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const estAujourdhui = jour === isoJour(now);
  const nowPct = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;

  const parChaine = useMemo(() => {
    const map = new Map<string, Emission[]>();
    for (const c of chaines) map.set(c.id, []);
    for (const e of emissions) {
      if (e.jour !== jour) continue;
      map.get(e.chaine)?.push(e);
    }
    for (const list of map.values()) list.sort((a, b) => toMin(a.debut) - toMin(b.debut));
    return map;
  }, [chaines, emissions, jour]);

  const totalJour = useMemo(() => emissions.filter((e) => e.jour === jour).length, [emissions, jour]);

  const clicPiste = (chaineId: string) => (ev: MouseEvent<HTMLDivElement>) => {
    if (!onCreer) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const min = Math.round((x / rect.width) * 1440 / 30) * 30;
    onCreer(chaineId, toHHMM(Math.min(min, 1410)));
  };

  return (
    <div className="rounded-xl border border-ink-100 bg-paper shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: LARGEUR_PISTE + 168 }}>
          {/* Règle horaire */}
          <div className="flex border-b border-ink-100 bg-ink-50/60 sticky top-0 z-20">
            <div className="w-[168px] flex-none px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
              <Icone name="schedule" size={13} /> Chaînes
            </div>
            <div className="relative flex-1 h-9" style={{ minWidth: LARGEUR_PISTE }}>
              {Array.from({ length: 24 }, (_, h) => (
                <span
                  key={h}
                  className="absolute top-0 bottom-0 flex items-center pl-1.5 text-[10px] font-mono font-semibold text-ink-400 border-l border-ink-100"
                  style={{ left: h * HEURE_PX }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
          </div>

          {/* Lignes chaînes */}
          {chaines.map((chaine) => {
            const blocs = parChaine.get(chaine.id) ?? [];
            return (
              <div key={chaine.id} className="flex border-b border-ink-100 last:border-b-0 group/ligne">
                <div className="w-[168px] flex-none px-4 py-3 flex items-center gap-2.5 bg-paper sticky left-0 z-10 border-r border-ink-100">
                  <span className="w-2.5 h-2.5 rounded-[4px] flex-none" style={{ background: chaine.accent }} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-ink-800 truncate leading-tight">{chaine.nom}</p>
                    <p className="text-[10px] text-ink-400 font-mono">{blocs.length} émissions</p>
                  </div>
                </div>
                <div
                  className="relative h-[74px] cursor-crosshair"
                  style={{
                    minWidth: LARGEUR_PISTE,
                    backgroundImage: `repeating-linear-gradient(90deg, #ededeb 0 1px, transparent 1px ${HEURE_PX}px), repeating-linear-gradient(90deg, #f4f4f2 0 1px, transparent 1px ${HEURE_PX / 2}px)`,
                  }}
                  onClick={clicPiste(chaine.id)}
                  title={onCreer ? "Cliquer pour créer une émission à cet horaire" : undefined}
                >
                  {/* Ligne "maintenant" */}
                  {estAujourdhui && (
                    <span className="absolute top-0 bottom-0 z-10 w-[2px] bg-live/70 pointer-events-none" style={{ left: `${nowPct}%` }}>
                      <span className="absolute -top-0 -left-[3px] w-2 h-2 rounded-full bg-live" />
                    </span>
                  )}

                  {blocs.map((e) => {
                    const cat = CATEGORIES[e.categorie];
                    const live = estEnDirect(e, now);
                    const pos = positionPct(e);
                    const verrouille = e.statut !== "brouillon";
                    return (
                      <button
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEditer?.(e);
                        }}
                        className={`absolute top-[7px] bottom-[7px] rounded-md text-left px-2.5 py-1.5 overflow-hidden transition-all duration-150 hover:shadow-card hover:-translate-y-[1px] hover:z-20 group/bloc ${
                          live ? "z-10 ring-2 ring-live shadow-card" : e.statut === "brouillon" ? "" : "z-[5]"
                        } ${e.statut === "brouillon" ? "border border-dashed" : "border"}`}
                        style={{
                          ...pos,
                          background: `${cat.color}0d`,
                          borderColor: e.statut === "en_attente_validation" ? "#b26a00" : e.statut === "brouillon" ? "#c0c0bb" : `${cat.color}45`,
                          borderLeftWidth: 3,
                          borderLeftColor: cat.color,
                        }}
                        title={`${e.titre} · ${e.debut} – ${e.fin}`}
                      >
                        <span className="block text-[11px] font-bold leading-tight truncate" style={{ color: "#242421" }}>
                          {e.titre}
                        </span>
                        <span className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[9.5px] font-semibold text-ink-500">
                            {e.debut}–{e.fin}
                          </span>
                          {afficherStatuts && (
                            <>
                              {live ? (
                                <span className="flex items-center gap-1 text-[8.5px] font-black text-live">
                                  <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse-dot" /> LIVE
                                </span>
                              ) : e.statut === "brouillon" ? (
                                <span className="text-[8.5px] font-black uppercase text-ink-400">Brouillon</span>
                              ) : e.statut === "en_attente_validation" ? (
                                <span className="text-[8.5px] font-black uppercase text-warn">À valider</span>
                              ) : (
                                <Icone name="check_circle" size={11} className="text-ok" filled />
                              )}
                            </>
                          )}
                        </span>
                        <span className="absolute top-1 right-1 opacity-0 group-hover/bloc:opacity-100 transition-opacity">
                          <Icone name={verrouille ? "visibility" : "edit"} size={12} className="text-ink-500" />
                        </span>
                        {live && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-stripes-live bg-live/90" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalJour === 0 && (
        <EtatVide
          icone="event_busy"
          titre="Aucune émission ce jour"
          texte="Cliquez sur la piste d'une chaîne pour créer le premier créneau de la journée."
        />
      )}
    </div>
  );
}

/** Légende catégories + statuts sous la grille. */
export function LegendeGrille() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-ink-500">
      {Object.entries(CATEGORIES).map(([k, c]) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c.color }} />
          {c.label}
        </span>
      ))}
      <span className="w-px h-4 bg-ink-200 mx-1" />
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[3px] border border-dashed border-ink-400" /> Brouillon
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-[3px] border border-warn" /> {STATUTS.en_attente_validation.label}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icone name="check_circle" size={12} className="text-ok" filled /> {STATUTS.valide.label}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-live animate-pulse-dot" /> En direct
      </span>
    </div>
  );
}

export { TYPES_DIFFUSION };

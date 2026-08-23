import { useEffect, useRef, useState } from "react";
import { Clapperboard, GripVertical, Landmark, Moon, Newspaper, Rocket, Sparkles, Trophy, X } from "lucide-react";
import type { BlocPlace, Programme, Role } from "../types";
import { PROGRAMMES, useStudio } from "../state/store";
import {
  CATS,
  SLOTS,
  finBlocLabel,
  finHHMM,
  jourIdxAujourdhui,
  peutPlacer,
  programmeDe,
  slotDebutMin,
  slotLabel,
  slotsPour,
  toHHMM,
} from "../utils/epg";
import { useToast } from "./shared";

export const CAT_ICONS = {
  information: Newspaper,
  divertissement: Sparkles,
  sport: Trophy,
  culture: Landmark,
  film: Clapperboard,
  jeunesse: Rocket,
} as const;

const PX = 62; // largeur d'un slot de 30 min
const HAUTEUR = 96;

export interface TimelineJourProps {
  grilleId: string;
  jourIdx: number;
  mode: "edit" | "lecture" | "public";
  acteur?: Role;
  playhead?: boolean;
  onDetail?: (bloc: BlocPlace, prog: Programme) => void;
}

/**
 * Timeline EPG horizontale — 36 slots de 30 min (06:00 → 24:00).
 * Modes : edit (drag & drop + trous hachurés), lecture (miroir régie + playhead), public (hors antenne).
 */
export function TimelineJour({ grilleId, jourIdx, mode, acteur, playhead = false, onDetail }: TimelineJourProps) {
  const { db, placer, retirer, dragInfo, setDragInfo } = useStudio();
  const toast = useToast();
  const [hover, setHover] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const grille = db.grilles.find((g) => g.id === grilleId);
  const blocs = grille?.jours[jourIdx] ?? [];

  /* Playhead temps réel */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!playhead) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [playhead]);

  const estAuj = jourIdx === jourIdxAujourdhui(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowDansGrille = playhead && estAuj && nowMin >= 360 && nowMin < 360 + SLOTS * 30;
  const playheadPx = ((nowMin - 360) / (SLOTS * 30)) * (SLOTS * PX);

  useEffect(() => {
    if (nowDansGrille && scrollRef.current) {
      scrollRef.current.scrollLeft = Math.max(0, playheadPx - scrollRef.current.clientWidth / 2.4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jourIdx, playhead]);

  if (!grille) return null;

  const dureeDrag = dragInfo?.duree ?? 0;
  const validite = (slot: number) =>
    dragInfo ? peutPlacer(blocs, PROGRAMMES, slot, dureeDrag, dragInfo.from?.blockId) : false;

  const onDrop = (slot: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setHover(null);
    if (!dragInfo || !acteur) return;
    const res = placer(grilleId, jourIdx, slot, dragInfo.programmeId, acteur, dragInfo.from);
    if (!res.ok) toast.push({ type: "erreur", titre: "Placement impossible", message: res.raison });
    setDragInfo(null);
  };

  /* trous (mode édition) */
  const occ = new Array<boolean>(SLOTS).fill(false);
  for (const b of blocs) {
    const p = programmeDe(PROGRAMMES, b.programmeId);
    if (!p) continue;
    for (let k = 0; k < slotsPour(p.duree); k++) if (b.slot + k < SLOTS) occ[b.slot + k] = true;
  }

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-xl border border-line bg-night2">
      <div style={{ minWidth: SLOTS * PX + 210 }}>
        {/* ——— Règle horaire ——— */}
        <div className="flex border-b border-line bg-night sticky top-0 z-20">
          <div className="flex-none w-[210px] sticky left-0 z-10 bg-night border-r border-line px-4 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-white/35 uppercase tracking-wider">
              06:00 → 24:00
            </span>
          </div>
          <div className="relative flex-none h-8" style={{ width: SLOTS * PX }}>
            {Array.from({ length: SLOTS + 1 }, (_, i) => (
              <span
                key={i}
                className={`absolute top-0 bottom-0 border-l ${i % 2 === 0 ? "border-line" : "border-white/[0.04]"}`}
                style={{ left: i * PX }}
              />
            ))}
            {Array.from({ length: 10 }, (_, k) => k).map((k) => {
              const i = k * 4; // toutes les 2 h
              return (
                <span key={`h-${i}`} className="absolute top-1.5 font-mono text-[9.5px] font-semibold text-white/40 tabular-nums" style={{ left: i * PX + 5 }}>
                  {finHHMM(slotDebutMin(i))}
                </span>
              );
            })}
          </div>
        </div>

        {/* ——— Ligne de programmes ——— */}
        <div className="flex">
          <div className="flex-none w-[210px] sticky left-0 z-20 bg-night2 border-r border-line px-4 flex flex-col justify-center gap-1" style={{ height: HAUTEUR }}>
            <span className="text-[11px] font-bold text-white/60">
              {mode === "edit" ? "Timeline EPG 24h" : mode === "lecture" ? "Miroir antenne" : "Balafon TV"}
            </span>
            <span className="font-mono text-[9.5px] text-white/30">
              {blocs.length} programme{blocs.length > 1 ? "s" : ""} · slots 30 min
            </span>
          </div>

          <div
            className="relative flex-none"
            style={{
              width: SLOTS * PX,
              height: HAUTEUR,
              backgroundImage: `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.045) 0 1px, transparent 1px ${PX * 2}px), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.02) 0 1px, transparent 1px ${PX}px)`,
            }}
            onDragLeave={() => setHover(null)}
          >
            {/* ——— Targets de drop / trous ——— */}
            {Array.from({ length: SLOTS }, (_, i) => {
              const libre = !occ[i];
              if (!libre) return null;
              const enSurvol = hover !== null && dragInfo && i >= hover && i < hover + slotsPour(dureeDrag);
              const valide = dragInfo ? validite(hover ?? i) : false;
              return (
                <div
                  key={i}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (hover === null) setHover(i);
                  }}
                  onDrop={onDrop(i)}
                  className={`absolute top-1 bottom-1 rounded transition-all duration-150 ${
                    mode === "edit" ? "hatch-red" : "stripes-dark"
                  } ${
                    enSurvol
                      ? valide
                        ? "!bg-sgreen/15 ring-2 ring-sgreen/70 !hatch-red-none"
                        : "!bg-bred/20 ring-2 ring-bred/70"
                      : ""
                  }`}
                  style={{ left: i * PX + 1, width: PX - 2 }}
                  title={mode === "edit" ? "Programme manquant — déposez une émission ici" : "Hors antenne"}
                >
                  {mode === "edit" && !enSurvol && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="text-[8px] font-black uppercase tracking-wide text-bred/90">Manquant</span>
                    </span>
                  )}
                  {mode !== "edit" && (
                    <span className="absolute inset-0 grid place-items-center px-1">
                      <span className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wide text-white/25">
                        <Moon size={9} /> Hors antenne · Rediffusion
                      </span>
                    </span>
                  )}
                </div>
              );
            })}

            {/* ——— Blocs placés ——— */}
            {blocs.map((b) => {
              const prog = programmeDe(PROGRAMMES, b.programmeId);
              if (!prog) return null;
              const n = slotsPour(prog.duree);
              const cat = CATS[prog.categorie];
              const CatIcon = CAT_ICONS[prog.categorie];
              const estDragSource = dragInfo?.from?.blockId === b.id;
              return (
                <div
                  key={b.id}
                  draggable={mode === "edit"}
                  onDragStart={(e) => {
                    if (mode !== "edit" || !acteur) return;
                    e.dataTransfer.setData("text/plain", b.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragInfo({ programmeId: prog.id, duree: prog.duree, from: { grilleId, jourIdx, blockId: b.id } });
                  }}
                  onDragEnd={() => setDragInfo(null)}
                  onClick={() => onDetail?.(b, prog)}
                  className={`group absolute top-1 bottom-1 rounded-md overflow-hidden transition-all duration-200 ${
                    mode === "edit" ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                  } ${estDragSource ? "opacity-30" : ""} hover:z-30 hover:-translate-y-0.5 hover:shadow-pop`}
                  style={{
                    left: b.slot * PX + 1,
                    width: n * PX - 5,
                    background: `linear-gradient(150deg, ${cat.color}30 0%, ${cat.color}14 100%)`,
                    border: `1px solid ${cat.color}55`,
                    borderLeft: `3px solid ${cat.color}`,
                  }}
                  title={`${prog.titre} · ${slotLabel(b.slot)} – ${finBlocLabel(b.slot, prog.duree)}`}
                >
                  <div className="px-2 pt-1.5 flex items-start gap-1.5">
                    <CatIcon size={11} className="flex-none mt-0.5" style={{ color: cat.color }} />
                    <p className="text-[10.5px] font-bold leading-tight text-white truncate">{prog.titre}</p>
                  </div>
                  <p className="px-2 mt-0.5 font-mono text-[9px] font-semibold tabular-nums" style={{ color: cat.color }}>
                    {slotLabel(b.slot)} – {finBlocLabel(b.slot, prog.duree)}
                  </p>
                  {n >= 3 && (
                    <p className="px-2 text-[8.5px] text-white/40 uppercase font-bold tracking-wide">
                      {prog.duree >= 60 ? `${prog.duree / 60} h${prog.duree % 60 ? ` ${prog.duree % 60}` : ""}` : `${prog.duree} min`}
                      {prog.type === "direct" ? " · DIRECT" : ""}
                    </p>
                  )}

                  {/* Overlay hover */}
                  <span className="absolute inset-0 bg-black/55 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    {mode === "edit" ? (
                      <>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-white/80">
                          <GripVertical size={11} /> Déplacer
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            retirer(grilleId, jourIdx, b.id, acteur ?? "admin");
                            toast.push({ type: "info", titre: "Programme retiré", message: prog.titre });
                          }}
                          className="grid place-items-center w-6 h-6 rounded bg-bred/85 text-white hover:bg-bred transition-colors"
                          title="Retirer du créneau"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[9.5px] font-bold text-white border border-white/25 rounded-full px-2.5 py-1">Détails</span>
                    )}
                  </span>
                </div>
              );
            })}

            {/* ——— Playhead temps réel ——— */}
            {nowDansGrille && (
              <div className="absolute -top-0 bottom-0 z-40 pointer-events-none transition-[left] duration-1000 ease-linear" style={{ left: playheadPx }}>
                <span className="absolute inset-y-0 -left-px w-[2.5px] bg-bred shadow-glow-red" />
                <span className="absolute -top-0 -left-[26px] font-mono text-[9px] font-bold text-white bg-bred rounded-b px-1.5 py-0.5 tabular-nums shadow-glow-red">
                  {toHHMM(nowMin)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** État de complétude d'un jour : complet / trous / vide. */
export function etatJour(blocs: BlocPlace[]): "complet" | "trous" | "vide" {
  if (blocs.length === 0) return "vide";
  const occ = new Array<boolean>(SLOTS).fill(false);
  for (const b of blocs) {
    const p = programmeDe(PROGRAMMES, b.programmeId);
    if (!p) continue;
    for (let k = 0; k < slotsPour(p.duree); k++) if (b.slot + k < SLOTS) occ[b.slot + k] = true;
  }
  return occ.every(Boolean) ? "complet" : "trous";
}

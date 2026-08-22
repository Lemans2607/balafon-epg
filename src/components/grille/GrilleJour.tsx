import { useEffect, useMemo, useState } from "react";
import type { Chaine, Emission } from "../../utils/epgHelpers";
import {
  CATEGORIES,
  dureeLabel,
  estEnDirect,
  estPasse,
  finEnMin,
  isoJour,
  progresPct,
  toMin,
} from "../../utils/epgHelpers";
import { Icone, EtatVide } from "../ui/kit";
import { CategoriePuce, PastilleChaine, StatutBadge, TypeDiffusionBadge } from "./badges";

/** Liste verticale d'une journée — utilisée côté public et côté admin. */
export function GrilleJour({
  jour,
  chaines,
  emissions,
  compact = false,
  surClic,
}: {
  jour: string;
  chaines: Chaine[];
  emissions: Emission[];
  compact?: boolean;
  surClic?: (e: Emission) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);

  const liste = useMemo(
    () =>
      emissions
        .filter((e) => e.jour === jour && (e.statut === "valide" || e.statut === "diffusion"))
        .sort((a, b) => toMin(a.debut) - toMin(b.debut)),
    [emissions, jour]
  );

  const chaineDe = (id: string) => chaines.find((c) => c.id === id);

  if (liste.length === 0) {
    return (
      <EtatVide
        icone="event_busy"
        titre="Aucune émission validée ce jour"
        texte="La grille de cette journée n'a pas encore été validée par la Direction d'Antenne."
      />
    );
  }

  return (
    <ol className="relative">
      {/* Rail vertical */}
      <span className="absolute left-[74px] top-2 bottom-2 w-px bg-ink-200 hidden sm:block" aria-hidden="true" />
      {liste.map((e, i) => {
        const cat = CATEGORIES[e.categorie];
        const chaine = chaineDe(e.chaine);
        const live = estEnDirect(e, now);
        const passe = estPasse(e, now) && !live;
        const duree = finEnMin(e) - toMin(e.debut);
        const prochaine =
          !passe && !live && isoJour(now) === jour &&
          liste.slice(0, i).every((p) => estPasse(p, now)) &&
          liste.slice(i + 1).every((p) => !estEnDirect(p, now));
        return (
          <li key={e.id} className="relative animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
            <button
              onClick={() => surClic?.(e)}
              disabled={!surClic}
              className={`w-full flex items-stretch gap-4 sm:gap-5 text-left rounded-xl transition-all duration-200 group ${
                surClic ? "cursor-pointer hover:bg-paper hover:shadow-card" : "cursor-default"
              } ${passe ? "opacity-45" : ""} ${live ? "bg-paper shadow-card border border-live/30" : "border border-transparent"} px-3 sm:px-4 py-3`}
            >
              {/* Horaire */}
              <div className="w-[52px] flex-none pt-0.5">
                <p className={`font-mono font-bold text-[13px] tabular-nums ${live ? "text-live" : "text-ink-800"}`}>{e.debut}</p>
                <p className="font-mono text-[10.5px] text-ink-400 tabular-nums">{e.fin}</p>
              </div>

              {/* Pastille sur le rail */}
              <span
                className={`hidden sm:grid place-items-center w-[13px] h-[13px] rounded-full border-2 bg-surface flex-none mt-1.5 z-10 ${
                  live ? "border-live animate-pulse-dot" : "border-ink-300 group-hover:border-primary-500"
                }`}
              />

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-[3px] self-stretch rounded-full flex-none" style={{ background: cat.color }} />
                  <h3 className={`font-display font-bold tracking-tight truncate ${compact ? "text-[14px]" : "text-[15.5px]"} ${live ? "text-ink-900" : "text-ink-800"}`}>
                    {e.titre}
                  </h3>
                  {live && <StatutBadge statut={e.statut} live compact={compact} />}
                  {prochaine && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-secondary-600 bg-secondary-50 border border-secondary-200 rounded-md px-1.5 py-0.5">
                      À suivre
                    </span>
                  )}
                </div>
                {!compact && <p className="text-[12.5px] text-ink-500 mt-1 line-clamp-2 leading-relaxed">{e.description}</p>}
                <div className={`flex items-center gap-2 flex-wrap ${compact ? "mt-1" : "mt-2"}`}>
                  {chaine && <PastilleChaine nom={chaine.nom} accent={chaine.accent} compact={compact} />}
                  <CategoriePuce categorie={e.categorie} compact />
                  <TypeDiffusionBadge type={e.type_diffusion} compact />
                  <span className="text-[10.5px] text-ink-400 font-medium">{dureeLabel(e.debut, e.fin)}</span>
                </div>
                {live && (
                  <div className="mt-2.5">
                    <div className="h-[5px] rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-live transition-[width] duration-700"
                        style={{ width: `${progresPct(e, now)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {live && (
                <div className="hidden md:flex flex-col items-end justify-center flex-none pr-1">
                  <span className="font-mono text-[11px] font-semibold text-live">
                    {Math.round(progresPct(e, now))}%
                  </span>
                  <span className="text-[10px] text-ink-400 mt-0.5">défile</span>
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Grille } from "../../types";
import { chaineDe } from "../../data/mock";
import { emissionLive, emissionSuivante, progresPct, toMin } from "../../utils/epg";
import { ContentRail } from "./ContentRail";
import { ProgressBar } from "../ui";

const fmtDans = (min: number) => {
  if (min < 1) return "imminent";
  if (min < 60) return `dans ${Math.round(min)} min`;
  return `dans ${Math.floor(min / 60)} h ${String(Math.round(min) % 60).padStart(2, "0")}`;
};

/** Rail « En Direct Maintenant » — une carte par chaîne, avec progression du direct. */
export function LiveRail({ grillesValides }: { grillesValides: Grille[] }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);

  return (
    <ContentRail
      titre="En Direct Maintenant"
      sousTitre="Ce qui passe en ce moment sur les antennes Balafon"
      extra={
        <Link to="/guide" className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand hover:underline underline-offset-4">
          Ouvrir le Guide TV <ArrowRight size={13} />
        </Link>
      }
    >
      {grillesValides.map((g) => {
        const chaine = chaineDe(g.chaineId);
        const live = emissionLive(g, now);
        const next = emissionSuivante(g, now);
        const pct = live ? progresPct(live, now) : 0;
        const sombre = chaine.accent === "#FFD54F";
        return (
          <Link
            key={g.id}
            to="/guide"
            className="group relative flex-none w-[292px] sm:w-[340px] rounded-xl overflow-hidden bg-panel border border-line hover:border-line2 transition-all duration-300 hover:-translate-y-1 hover:shadow-pop"
          >
            <div className="relative h-[150px] overflow-hidden">
              {live?.image ? (
                <img src={live.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
              ) : (
                <div
                  className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]"
                  style={{ background: `linear-gradient(135deg, ${chaine.accent}40 0%, #141414 75%)` }}
                >
                  <div className="w-full h-full bg-noise" />
                </div>
              )}
              <span className="absolute right-2 bottom-[-8px] font-display font-black text-[68px] leading-none text-white/[0.07] select-none">
                {chaine.short}
              </span>
              <span className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
              <span
                className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded"
                style={{ background: chaine.accent, color: sombre ? "#0A0A0A" : "#fff" }}
              >
                {chaine.short}
              </span>
              {live ? (
                <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 bg-brand text-white text-[9.5px] font-black px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-blink" /> EN DIRECT
                </span>
              ) : (
                <span className="absolute top-2.5 right-2.5 text-[9.5px] font-black text-white/55 border border-white/15 bg-black/40 backdrop-blur px-2 py-1 rounded">
                  À VENIR
                </span>
              )}
            </div>

            <div className="p-4">
              {live ? (
                <>
                  <p className="font-display font-bold text-[15px] leading-tight truncate">{live.titre}</p>
                  <div className="mt-3">
                    <ProgressBar value={pct} striped className="h-[4px]" />
                    <div className="flex justify-between mt-1.5 font-mono text-[10.5px] text-white/40 tabular-nums">
                      <span>
                        {live.debut} – {live.fin}
                      </span>
                      <span className="text-brand font-bold">{Math.round(pct)}%</span>
                    </div>
                  </div>
                </>
              ) : next ? (
                <>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/30">Prochaine émission</p>
                  <p className="font-semibold text-[13.5px] text-white/80 truncate mt-1">{next.titre}</p>
                  <p className="font-mono text-[12px] text-brand font-semibold mt-1.5 tabular-nums">
                    {next.debut} · {fmtDans(toMin(next.debut) - (now.getHours() * 60 + now.getMinutes()))}
                  </p>
                </>
              ) : (
                <p className="text-[12.5px] text-white/35">Fin de grille pour aujourd'hui.</p>
              )}
              {live && next && (
                <p className="mt-3 pt-3 border-t border-line text-[11px] text-white/40 truncate">
                  À suivre : <span className="text-white/75 font-semibold">{next.titre}</span> ·{" "}
                  <span className="font-mono">{next.debut}</span>
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </ContentRail>
  );
}

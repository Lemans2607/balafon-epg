import { Check, Play, Plus, Star } from "lucide-react";
import type { VodItem } from "../../types";
import { CATS } from "../../data/mock";
import { ProgressBar } from "../ui";

interface CardProps {
  item: VodItem;
  dansListe?: boolean;
  onListe?: (id: string) => void;
  onOuvrir?: (item: VodItem) => void;
}

/** Fond d'affiche : image réelle ou composition graphique (dégradé + icône catégorie). */
function Artwork({ item, small = false }: { item: VodItem; small?: boolean }) {
  const cat = CATS[item.categorie];
  return (
    <>
      {item.image ? (
        <img
          src={item.image}
          alt={item.titre}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
        />
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.07]"
          style={{ background: `linear-gradient(160deg, ${item.art[0]} 0%, ${item.art[1]} 130%)` }}
        >
          <div className="absolute inset-0 bg-noise opacity-60" />
          <cat.Icon
            size={small ? 40 : 56}
            strokeWidth={1.2}
            className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 text-white/20"
          />
          <span className="absolute left-3 bottom-8 font-display font-black text-[26px] leading-none text-white/12 select-none">
            BALAFON+
          </span>
        </div>
      )}
    </>
  );
}

/** Carte affiche verticale (format 2:3). */
export function PosterCard({ item, dansListe, onListe, onOuvrir, largeur = "w-[164px] sm:w-[184px]" }: CardProps & { largeur?: string }) {
  return (
    <button
      onClick={() => onOuvrir?.(item)}
      className={`group relative flex-none ${largeur} aspect-[2/3] rounded-lg overflow-hidden border border-line bg-panel text-left transition-all duration-300 hover:scale-105 hover:z-20 hover:shadow-pop hover:border-line2`}
    >
      <Artwork item={item} />
      <span className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />

      {item.badge && (
        <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      )}
      <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-black/60 backdrop-blur text-[10px] font-bold text-amber-300 px-1.5 py-0.5 rounded">
        <Star size={9} fill="currentColor" /> {item.note.toFixed(1)}
      </span>

      <span className="absolute inset-x-0 bottom-0 p-3">
        <span className="block font-display font-bold text-[13px] leading-tight line-clamp-2">{item.titre}</span>
        <span className="block text-[10.5px] text-white/45 mt-0.5">
          {item.duree} · {item.annee}
        </span>
      </span>

      {/* Overlay au survol */}
      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="grid place-items-center w-11 h-11 rounded-full bg-brand text-white shadow-glow scale-75 group-hover:scale-100 transition-transform duration-300">
          <Play size={18} fill="currentColor" className="ml-0.5" />
        </span>
      </span>
      {onListe && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onListe(item.id);
          }}
          onKeyDown={(e) => e.key === "Enter" && onListe(item.id)}
          className={`absolute bottom-2.5 right-2.5 grid place-items-center w-8 h-8 rounded-full backdrop-blur transition-all duration-300 opacity-0 group-hover:opacity-100 ${
            dansListe ? "bg-ok text-white" : "bg-black/60 text-white/80 hover:bg-black/85"
          }`}
          title={dansListe ? "Retirer de ma liste" : "Ajouter à ma liste"}
        >
          {dansListe ? <Check size={14} /> : <Plus size={14} />}
        </span>
      )}
    </button>
  );
}

/** Carte large 16:9 avec barre de progression (« Reprendre la lecture »). */
export function WideCard({ item, onOuvrir, reprise = true }: CardProps & { reprise?: boolean }) {
  return (
    <button
      onClick={() => onOuvrir?.(item)}
      className="group relative flex-none w-[290px] sm:w-[340px] aspect-video rounded-lg overflow-hidden border border-line bg-panel text-left transition-all duration-300 hover:scale-[1.04] hover:z-20 hover:shadow-pop hover:border-line2"
    >
      <Artwork item={item} />
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

      {item.badge && (
        <span className="absolute top-2.5 left-2.5 bg-brand text-white text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      )}
      <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-black/60 backdrop-blur text-[10px] font-bold text-amber-300 px-1.5 py-0.5 rounded">
        <Star size={9} fill="currentColor" /> {item.note.toFixed(1)}
      </span>

      <span className="absolute inset-x-0 bottom-0 p-3.5">
        <span className="block font-display font-bold text-[14.5px] leading-tight truncate">{item.titre}</span>
        <span className="block text-[11px] text-white/45 mt-0.5">
          {item.sousTitre} · {item.duree}
        </span>
        {reprise && item.progression !== undefined && (
          <span className="block mt-2.5">
            <ProgressBar value={item.progression} color="var(--color-redprog)" className="h-[4px]" />
            <span className="flex justify-between text-[10px] font-mono text-white/40 mt-1">
              <span>Reprendre la lecture</span>
              <span>{item.progression}%</span>
            </span>
          </span>
        )}
      </span>

      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="grid place-items-center w-12 h-12 rounded-full bg-white/95 text-oled shadow-pop scale-75 group-hover:scale-100 transition-transform duration-300">
          <Play size={20} fill="currentColor" className="ml-0.5" />
        </span>
      </span>
    </button>
  );
}

/** Carte Top 10 — grand numéro stylisé derrière l'affiche. */
export function Top10Card({ item, rang, dansListe, onListe, onOuvrir }: CardProps & { rang: number }) {
  return (
    <div className="group/top relative flex-none flex items-end pl-1">
      <span className="top-num relative z-0 text-[118px] sm:text-[142px] -mr-6 select-none transition-colors duration-300 group-hover/top:[-webkit-text-stroke-color:#FF5722]">
        {rang}
      </span>
      <div className="relative z-10">
        <PosterCard
          item={item}
          dansListe={dansListe}
          onListe={onListe}
          onOuvrir={onOuvrir}
          largeur="w-[128px] sm:w-[150px]"
        />
      </div>
    </div>
  );
}

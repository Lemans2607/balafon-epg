import { Check, Play, Plus, Share2, Star } from "lucide-react";
import type { VodItem } from "../../types";
import { CATS, chaineDe } from "../../data/mock";
import { Modale, useToast } from "../ui";

/** Fiche détail d'un contenu VOD / Replay. */
export function VodModal({
  item,
  dansListe,
  onListe,
  onFermer,
}: {
  item: VodItem | null;
  dansListe: boolean;
  onListe: (id: string) => void;
  onFermer: () => void;
}) {
  const toast = useToast();
  if (!item) return null;
  const cat = CATS[item.categorie];
  const chaine = chaineDe(item.chaine);

  return (
    <Modale ouvert={item !== null} onFermer={onFermer} titre={item.titre} sousTitre={item.sousTitre} largeur="max-w-xl">
      <div className="-mx-6 -mt-5 mb-5">
        <div className="relative h-[250px] overflow-hidden">
          {item.image ? (
            <img src={item.image} alt={item.titre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(160deg, ${item.art[0]}, ${item.art[1]} 130%)` }}>
              <div className="w-full h-full bg-noise" />
              <cat.Icon size={70} strokeWidth={1.1} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
          {item.badge && (
            <span className="absolute top-3 left-4 bg-brand text-white text-[10px] font-black tracking-wide px-2 py-1 rounded">
              {item.badge}
            </span>
          )}
          <button
            onClick={() => toast.push({ type: "succes", titre: "Lecture lancée", message: `« ${item.titre} » — flux simulé pour la démonstration.` })}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center w-14 h-14 rounded-full bg-brand text-white shadow-glow hover:scale-110 transition-transform"
            aria-label="Lire"
          >
            <Play size={22} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap text-[12.5px] font-semibold text-white/65">
        <span className="inline-flex items-center gap-1 text-amber-300">
          <Star size={13} fill="currentColor" /> {item.note.toFixed(1)}
        </span>
        <span className="w-1 h-1 rounded-full bg-white/25" />
        <span>{item.annee}</span>
        <span className="w-1 h-1 rounded-full bg-white/25" />
        <span className="font-mono">{item.duree}</span>
        <span className="w-1 h-1 rounded-full bg-white/25" />
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-[3px]" style={{ background: chaine.accent }} /> {chaine.nom}
        </span>
        <span className="w-1 h-1 rounded-full bg-white/25" />
        <span style={{ color: cat.color }}>{cat.label}</span>
      </div>

      <p className="text-[13.5px] text-white/55 leading-relaxed mt-4">
        {item.sousTitre} proposé par {chaine.nom}. Retrouvez ce programme en replay et à la demande sur
        toutes vos plateformes Balafon+ : Smart TV, mobile et web. Qualité HD, sous-titres français et
        anglais disponibles.
      </p>

      <div className="mt-6 flex items-center gap-2.5">
        <button
          onClick={() => toast.push({ type: "succes", titre: "Lecture lancée", message: `« ${item.titre} » — flux simulé pour la démonstration.` })}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand2 text-white font-bold text-[13.5px] px-5 py-2.5 rounded-lg shadow-glow transition-all active:scale-95"
        >
          <Play size={16} fill="currentColor" /> Lecture
        </button>
        <button
          onClick={() => onListe(item.id)}
          className={`inline-flex items-center gap-2 font-bold text-[13.5px] px-4 py-2.5 rounded-lg border transition-all active:scale-95 ${
            dansListe ? "bg-ok/15 border-ok/40 text-ok" : "bg-white/[0.06] border-line hover:bg-white/[0.12] text-white"
          }`}
        >
          {dansListe ? <Check size={16} /> : <Plus size={16} />}
          {dansListe ? "Dans ma liste" : "Ma liste"}
        </button>
        <button
          onClick={() => toast.push({ type: "info", titre: "Lien copié", message: "Partagez ce programme avec vos proches." })}
          className="grid place-items-center w-10 h-10 rounded-lg border border-line text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Partager"
        >
          <Share2 size={16} />
        </button>
      </div>
    </Modale>
  );
}

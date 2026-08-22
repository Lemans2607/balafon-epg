import { motion } from "framer-motion";
import { Check, ChevronDown, Play, Plus, Star } from "lucide-react";
import { FEATURED, IMG, chaineDe } from "../../data/mock";

/** « Billboard » — bannière géante façon streaming premium. */
export function Billboard({
  liveInfo,
  dansListe,
  onListe,
}: {
  liveInfo?: { titre: string; chaineId: string } | null;
  dansListe: boolean;
  onListe: () => void;
}) {
  const chaine = liveInfo ? chaineDe(liveInfo.chaineId) : null;

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden">
      <img
        src={IMG.hero}
        alt="Makossa Nights — La Session Live"
        className="absolute inset-0 w-full h-full object-cover animate-kenburns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-oled via-oled/20 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-oled/90 via-oled/20 to-transparent" />

      <div className="relative h-full max-w-[1240px] mx-auto px-5 lg:px-10 flex flex-col justify-end pb-20">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }} className="flex items-center gap-2.5 flex-wrap">
            {liveInfo && chaine ? (
              <span className="inline-flex items-center gap-1.5 bg-brand text-white text-[10.5px] font-black tracking-wide px-2.5 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-blink" />
                EN DIRECT · {chaine.nom.toUpperCase()}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/15 text-white/85 text-[10.5px] font-black tracking-wide px-2.5 py-1 rounded">
                À LA UNE
              </span>
            )}
            {FEATURED.badge && (
              <span className="bg-white/10 backdrop-blur border border-white/15 text-white/85 text-[10.5px] font-black tracking-wide px-2.5 py-1 rounded">
                {FEATURED.badge}
              </span>
            )}
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}
            className="font-display font-black text-[44px] sm:text-[68px] leading-[0.98] tracking-tight max-w-[760px] mt-4"
          >
            Makossa Nights
            <span className="block text-brand">La Session Live</span>
          </motion.h1>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
            className="flex items-center gap-2.5 flex-wrap mt-4 text-[12.5px] font-semibold text-white/70"
          >
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Star size={13} fill="currentColor" /> {FEATURED.note.toFixed(1)}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>{FEATURED.annee}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="font-mono">{FEATURED.duree}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="border border-white/25 rounded px-1.5 text-[10.5px]">HD</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-[3px] bg-brand" /> {FEATURED.sousTitre}
            </span>
          </motion.div>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
            className="text-[14.5px] text-white/65 leading-relaxed max-w-[580px] mt-3.5 line-clamp-2"
          >
            Trois générations d'artistes makossa réunies sur le plateau central de Balafon TV pour une
            session live exceptionnelle — cuivres, guitares saturées et chœurs du Mboa, captés en direct
            depuis Douala.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
            className="flex items-center gap-3 mt-7"
          >
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight * 0.85, behavior: "smooth" })}
              className="inline-flex items-center gap-2.5 bg-brand hover:bg-brand2 text-white font-bold text-[14.5px] px-7 py-3 rounded-lg shadow-glow transition-all duration-300 hover:scale-[1.03] active:scale-95"
            >
              <Play size={19} fill="currentColor" /> Lecture
            </button>
            <button
              onClick={onListe}
              className={`inline-flex items-center gap-2.5 font-bold text-[14.5px] px-6 py-3 rounded-lg border transition-all duration-300 active:scale-95 ${
                dansListe
                  ? "bg-ok/15 border-ok/40 text-ok"
                  : "bg-white/10 border-white/15 hover:bg-white/20 text-white"
              }`}
            >
              {dansListe ? <Check size={18} /> : <Plus size={18} />}
              {dansListe ? "Dans ma liste" : "Ajouter aux favoris"}
            </button>
          </motion.div>
        </motion.div>
      </div>

      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/35 animate-bounce">
        <ChevronDown size={22} />
      </span>
    </section>
  );
}

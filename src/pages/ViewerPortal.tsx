import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { VodItem } from "../types";
import { REPLAYS, REPRENDRE, TOP10, VOD, vodDe } from "../data/mock";
import { useApp } from "../context/AppContext";
import { emissionLive } from "../utils/epg";
import { Footer, Navbar } from "../components/viewer/ViewerChrome";
import { Billboard } from "../components/viewer/Billboard";
import { LiveRail } from "../components/viewer/LiveRail";
import { ContentRail } from "../components/viewer/ContentRail";
import { PosterCard, Top10Card, WideCard } from "../components/viewer/ContentCard";
import { VodModal } from "../components/viewer/VodModal";

const LISTE_KEY = "balafon_ma_liste";

export function ViewerPortal() {
  const { grilles, pret } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [ouvert, setOuvert] = useState<VodItem | null>(null);
  const [maListe, setMaListe] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LISTE_KEY) ?? '["v7","v3"]');
    } catch {
      return [];
    }
  });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  /* Scroll vers une section demandée depuis la navbar (Replay) */
  useEffect(() => {
    const section = (location.state as { section?: string } | null)?.section;
    if (section) {
      setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" }), 350);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const grillesValides = useMemo(() => grilles.filter((g) => g.statut === "valide"), [grilles]);

  const liveBmtv = useMemo(() => {
    const g = grillesValides.find((x) => x.chaineId === "bmtv");
    const live = g ? emissionLive(g, now) : null;
    return live ? { titre: live.titre, chaineId: "bmtv" } : null;
  }, [grillesValides, now]);

  const toggleListe = (id: string) => {
    setMaListe((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(LISTE_KEY, JSON.stringify(next));
      } catch {
        /* stockage indisponible */
      }
      return next;
    });
  };

  const contenuListe = maListe.map(vodDe).filter(Boolean) as VodItem[];

  return (
    <div className="min-h-screen bg-oled text-white">
      <Navbar query={query} onQuery={setQuery} onOuvrir={setOuvert} />

      {!pret ? (
        <div className="h-[85vh] min-h-[600px] skeleton" />
      ) : (
        <Billboard liveInfo={liveBmtv} dansListe={maListe.includes("v1")} onListe={() => toggleListe("v1")} />
      )}

      <main className="max-w-[1240px] mx-auto px-5 lg:px-10 space-y-16 mt-16 relative z-10">
        {!pret ? (
          <>
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="h-6 w-56 rounded skeleton mb-4" />
                <div className="flex gap-3.5 overflow-hidden">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="w-[340px] h-[240px] rounded-xl skeleton flex-none" />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, ease: "easeOut" }}>
              <LiveRail grillesValides={grillesValides} />
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, ease: "easeOut" }}>
              <ContentRail titre="Reprendre la lecture" sousTitre="Vos visionnages en cours, toutes chaînes confondues">
                {REPRENDRE.map((v) => (
                  <WideCard key={v.id} item={v} onOuvrir={setOuvert} />
                ))}
              </ContentRail>
            </motion.section>

            <motion.section id="replay" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, ease: "easeOut" }}>
              <ContentRail titre="Derniers Replays & VOD" sousTitre="Les programmes récents disponibles à la demande">
                {[...REPLAYS, ...VOD.filter((v) => !v.badge)].map((v) => (
                  <PosterCard key={v.id} item={v} dansListe={maListe.includes(v.id)} onListe={toggleListe} onOuvrir={setOuvert} />
                ))}
              </ContentRail>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, ease: "easeOut" }}>
              <ContentRail titre="Top 10 de la semaine" sousTitre="Les programmes les plus regardés sur Balafon+">
                {TOP10.map((v, i) => (
                  <Top10Card key={v.id} item={v} rang={i + 1} dansListe={maListe.includes(v.id)} onListe={toggleListe} onOuvrir={setOuvert} />
                ))}
              </ContentRail>
            </motion.section>

            {contenuListe.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, ease: "easeOut" }}>
                <ContentRail titre="Ma liste" sousTitre={`${contenuListe.length} programme${contenuListe.length > 1 ? "s" : ""} enregistré${contenuListe.length > 1 ? "s" : ""}`}>
                  {contenuListe.map((v) => (
                    <PosterCard key={v.id} item={v} dansListe onListe={toggleListe} onOuvrir={setOuvert} />
                  ))}
                </ContentRail>
              </motion.section>
            )}
          </>
        )}
      </main>

      <Footer />

      <VodModal item={ouvert} dansListe={ouvert ? maListe.includes(ouvert.id) : false} onListe={toggleListe} onFermer={() => setOuvert(null)} />
    </div>
  );
}

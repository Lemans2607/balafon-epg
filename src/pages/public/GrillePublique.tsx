import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GrilleJour } from "../../components/grille/GrilleJour";
import { Horloge, Icone, LogoBalafon, Spinner, TouchesBalafon } from "../../components/ui/kit";
import { useAuth } from "../../context/AuthContext";
import { useGrille } from "../../hooks/useGrille";
import {
  JOURS_COURT,
  ROLE_LABELS,
  enDirectSurChaine,
  fmtJourLong,
  isoJour,
  lundiDe,
  parseJour,
  prochaineSurChaine,
  progresPct,
  toMin,
} from "../../utils/epgHelpers";
import { ROLE_HOME } from "../LoginPage";

export function GrillePublique() {
  const { emissions, chaines, chargement, wsStatut } = useGrille();
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [jourIdx, setJourIdx] = useState((new Date().getDay() + 6) % 7);
  const [filtreChaine, setFiltreChaine] = useState<string>("toutes");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);

  const lundi = lundiDe(now);
  const jours = Array.from({ length: 7 }, (_, i) => isoJour(new Date(lundi.getTime() + i * 86_400_000)));
  const jourSel = jours[jourIdx];
  const aujourdhui = isoJour(now);

  const directs = useMemo(
    () => chaines.map((c) => ({ chaine: c, live: enDirectSurChaine(emissions, c.id, now), suivante: prochaineSurChaine(emissions, c.id, now) })),
    [chaines, emissions, now]
  );

  /* Ticker : prochains rendez-vous de la journée */
  const tickerItems = useMemo(() => {
    const items: { heure: string; titre: string; chaine: string; accent: string }[] = [];
    for (const c of chaines) {
      const liste = emissions
        .filter((e) => e.chaine === c.id && e.jour === aujourdhui && (e.statut === "valide" || e.statut === "diffusion") && toMin(e.debut) >= now.getHours() * 60 + now.getMinutes())
        .sort((a, b) => toMin(a.debut) - toMin(b.debut))
        .slice(0, 4);
      for (const e of liste) items.push({ heure: e.debut, titre: e.titre, chaine: c.nom, accent: c.accent });
    }
    return items.sort((a, b) => a.heure.localeCompare(b.heure)).slice(0, 12);
  }, [chaines, emissions, aujourdhui, now]);

  const emissionsFiltrees = filtreChaine === "toutes" ? emissions : emissions.filter((e) => e.chaine === filtreChaine);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ——— Barre de marque ——— */}
      <header className="sticky top-0 z-40 bg-ink-900/95 backdrop-blur text-white border-b border-white/5">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7 h-[64px] flex items-center justify-between gap-4">
          <Link to="/grille" className="flex items-center gap-3">
            <LogoBalafon clair compact />
            <span className="hidden sm:block leading-none">
              <span className="font-display font-extrabold text-[15px] tracking-tight block">Grille des programmes</span>
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-[0.18em] mt-0.5 block">Balafon Media Group</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-2 text-[11px] font-semibold text-white/50 border border-white/10 rounded-full px-3 py-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${wsStatut === "ouvert" ? "bg-ok" : "bg-live"}`} />
              {wsStatut === "ouvert" ? "Grille à jour en temps réel" : "Reconnexion…"}
            </span>
            <Horloge secondes className="hidden sm:block text-[13px] font-semibold text-white/70 border border-white/10 rounded-full px-3 py-1.5" />
            {user ? (
              <Link
                to={ROLE_HOME[user.role]}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-3.5 py-2 text-[12.5px] font-bold transition-colors"
              >
                <Icone name="space_dashboard" size={15} /> Espace {ROLE_LABELS[user.role]}
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 hover:border-white/40 px-3.5 py-2 text-[12.5px] font-bold transition-colors"
              >
                <Icone name="login" size={15} /> Connexion
              </Link>
            )}
          </div>
        </div>

        {/* Ticker */}
        <div className="ticker overflow-hidden border-t border-white/5 bg-ink-900">
          <div className="ticker-track flex items-center gap-8 whitespace-nowrap py-1.5 animate-ticker w-max">
            {[0, 1].map((doublon) => (
              <span key={doublon} className="flex items-center gap-8">
                <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-live">
                  <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse-dot" /> En direct sur Balafon
                </span>
                {tickerItems.map((it, i) => (
                  <span key={`${doublon}-${i}`} className="inline-flex items-center gap-2 text-[11.5px] text-white/55">
                    <span className="font-mono font-bold text-white/85">{it.heure}</span>
                    {it.titre}
                    <span className="inline-flex items-center gap-1 text-white/35">
                      <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: it.accent }} /> {it.chaine}
                    </span>
                    <Icone name="diamond" size={7} className="text-primary-500 ml-3" filled />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ——— En ce moment (plateau antenne) ——— */}
      <section className="bg-ink-900 text-white bg-grid-dark border-b border-white/5">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7 py-7">
          <div className="flex items-center gap-3 mb-4">
            <TouchesBalafon className="opacity-80" />
            <h2 className="font-display font-black text-[20px] tracking-tight">En ce moment sur nos antennes</h2>
          </div>
          {chargement ? (
            <div className="grid md:grid-cols-3 gap-3.5">
              {[0, 1, 2].map((i) => <div key={i} className="h-[120px] rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-3.5">
              {directs.map(({ chaine, live, suivante }) => (
                <article key={chaine.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/20">
                  <span className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: chaine.accent }} />
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-[12px] uppercase tracking-wider text-white/60 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-[3px]" style={{ background: chaine.accent }} /> {chaine.nom}
                    </p>
                    {live && (
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-live bg-live/10 border border-live/30 rounded-md px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse-dot" /> DIRECT
                      </span>
                    )}
                  </div>
                  {live ? (
                    <>
                      <h3 className="font-display font-extrabold text-[17px] tracking-tight leading-snug mt-2.5">{live.titre}</h3>
                      <div className="mt-2.5 h-[5px] rounded-full bg-white/10 overflow-hidden">
                        <div className="relative h-full bg-live transition-[width] duration-1000" style={{ width: `${progresPct(live, now)}%` }}>
                          <span className="absolute inset-0 bg-stripes-live animate-stripes" />
                        </div>
                      </div>
                      <p className="font-mono text-[10.5px] text-white/40 mt-1.5 tabular-nums">
                        {live.debut} – {live.fin} · {Math.round(progresPct(live, now))}%
                      </p>
                    </>
                  ) : suivante ? (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30 mt-2.5">À venir · {suivante.debut}</p>
                      <h3 className="font-display font-bold text-[15.5px] tracking-tight leading-snug mt-1 text-white/80">{suivante.titre}</h3>
                    </>
                  ) : (
                    <p className="text-[12.5px] text-white/35 mt-2.5">Fin de grille pour aujourd'hui.</p>
                  )}
                  {live && suivante && (
                    <p className="mt-2.5 pt-2.5 border-t border-white/10 text-[11px] text-white/40 truncate">
                      À suivre : <span className="text-white/75 font-semibold">{suivante.titre}</span> · <span className="font-mono">{suivante.debut}</span>
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ——— Grille de la semaine ——— */}
      <main className="flex-1 bg-dots">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7 py-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600">Programmes de la semaine</p>
              <h2 className="font-display font-black text-[24px] tracking-tight capitalize mt-1">
                {jourSel === aujourdhui ? "Aujourd'hui" : fmtJourLong(jourSel)}
              </h2>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFiltreChaine("toutes")}
                className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold border transition-colors ${
                  filtreChaine === "toutes" ? "bg-ink-900 text-white border-ink-900" : "bg-paper text-ink-500 border-ink-200 hover:border-ink-300"
                }`}
              >
                Toutes chaînes
              </button>
              {chaines.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFiltreChaine(c.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold border transition-colors ${
                    filtreChaine === c.id ? "bg-ink-900 text-white border-ink-900" : "bg-paper text-ink-500 border-ink-200 hover:border-ink-300"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} /> {c.nom}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-5">
            {jours.map((j, i) => {
              const d = parseJour(j);
              const actif = i === jourIdx;
              const estAuj = j === aujourdhui;
              return (
                <button
                  key={j}
                  onClick={() => setJourIdx(i)}
                  className={`flex-none px-4 py-2 rounded-lg border text-[12.5px] font-bold transition-all duration-150 ${
                    actif
                      ? "bg-primary-600 text-white border-primary-600 shadow-card"
                      : estAuj
                      ? "bg-paper text-primary-700 border-primary-200 hover:border-primary-400"
                      : "bg-paper text-ink-500 border-ink-200 hover:border-ink-300"
                  }`}
                >
                  {estAuj && !actif ? "Aujourd'hui" : `${JOURS_COURT[i]} ${d.getDate()}`}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-ink-100 bg-paper/80 backdrop-blur-sm shadow-card p-3 sm:p-4 animate-rise" key={jourSel}>
            {chargement ? (
              <div className="flex items-center justify-center py-16 gap-2 text-[13px] text-ink-400">
                <Spinner size={16} /> Chargement de la grille validée…
              </div>
            ) : (
              <GrilleJour jour={jourSel} chaines={chaines} emissions={emissionsFiltrees} />
            )}
          </div>

          <p className="flex items-center gap-2 text-[11.5px] text-ink-400 mt-4">
            <Icone name="verified" size={14} className="text-ok" />
            Grille validée par la Direction d'Antenne — les horaires peuvent évoluer en cas d'édition spéciale.
          </p>
        </div>
      </main>

      {/* ——— Pied de page ——— */}
      <footer className="bg-ink-900 text-white border-t border-white/5">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-7 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoBalafon clair compact />
            <p className="text-[11.5px] text-white/40">Balafon Media Group — Douala · Yaoundé · Bafoussam</p>
          </div>
          <p className="text-[11px] text-white/30">
            Plateforme Balafon Plus · édition, validation & régie d'antenne — Stage IAI Cameroun
          </p>
        </div>
      </footer>
    </div>
  );
}

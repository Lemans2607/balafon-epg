import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, PastilleWs } from "../../components/layout/AppShell";
import { GrilleJour } from "../../components/grille/GrilleJour";
import { StatutBadge } from "../../components/grille/badges";
import { EtatVide, Icone, Spinner, TouchesBalafon } from "../../components/ui/kit";
import { useGrille } from "../../hooks/useGrille";
import { getDemandes } from "../../api";
import {
  enDirectSurChaine,
  estEnDirect,
  fmtSemaine,
  isoJour,
  lundiDe,
} from "../../utils/epgHelpers";

function ilYa(ts: number): string {
  const min = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export function AdminDashboard() {
  const { emissions, chaines, chargement, erreur, recharger, wsStatut } = useGrille();
  const [now, setNow] = useState(() => new Date());
  const [filtreChaine, setFiltreChaine] = useState<string>("toutes");
  const [nbDemandes, setNbDemandes] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getDemandes()
      .then((d) => setNbDemandes(d.length))
      .catch(() => setNbDemandes(0));
  }, []);

  const aujourdhui = isoJour(now);
  const directs = chaines.filter((c) => enDirectSurChaine(emissions, c.id, now)).length;
  const aValider = emissions.filter((e) => e.statut === "en_attente_validation").length;
  const brouillons = emissions.filter((e) => e.statut === "brouillon").length;
  const semaine = useMemo(() => {
    const lundi = isoJour(lundiDe(now));
    return emissions.filter((e) => e.jour >= lundi && e.jour <= isoJour(new Date(lundiDe(now).getTime() + 6 * 86_400_000)));
  }, [emissions, now]);

  const recentes = useMemo(
    () => [...emissions].sort((a, b) => b.updated_at - a.updated_at).slice(0, 6),
    [emissions]
  );

  const emissionsJour = filtreChaine === "toutes" ? emissions : emissions.filter((e) => e.chaine === filtreChaine);

  const stats = [
    { label: "En direct maintenant", valeur: directs, icone: "live_tv", note: `sur ${chaines.length} chaînes`, teinte: "text-live", fond: "bg-live/10", bord: "border-live/20" },
    { label: "À valider", valeur: aValider, icone: "fact_check", note: "par la Direction", teinte: "text-warn", fond: "bg-amber-50", bord: "border-amber-200" },
    { label: "Brouillons", valeur: brouillons, icone: "edit_note", note: "dans l'éditeur", teinte: "text-ink-600", fond: "bg-ink-100", bord: "border-ink-200" },
    { label: "Émissions / semaine", valeur: semaine.length, icone: "calendar_month", note: `${chaines.length} chaînes`, teinte: "text-secondary-600", fond: "bg-secondary-50", bord: "border-secondary-200" },
  ];

  return (
    <AppShell titre="Tableau de bord" sousTitre={`${fmtSemaine(lundiDe(now))} · Administrateur`} actions={<PastilleWs statut={wsStatut} />}>
      <div className="px-5 sm:px-7 py-6 max-w-[1240px] mx-auto">
        {erreur && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-live/25 bg-red-50 px-5 py-4">
            <p className="text-[13.5px] font-semibold text-live flex items-center gap-2">
              <Icone name="cloud_off" size={18} /> {erreur}
            </p>
            <button onClick={() => void recharger()} className="text-[13px] font-bold text-ink-700 underline underline-offset-2">
              Réessayer
            </button>
          </div>
        )}

        {/* ——— Statistiques ——— */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`relative overflow-hidden rounded-xl border ${s.bord} bg-paper shadow-card px-5 py-4 animate-rise`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className={`grid place-items-center w-9 h-9 rounded-lg ${s.fond} ${s.teinte}`}>
                  <Icone name={s.icone} size={19} filled={s.icone === "live_tv" && directs > 0} />
                </span>
                {s.icone === "live_tv" && directs > 0 && (
                  <span className="w-2 h-2 rounded-full bg-live animate-pulse-dot" />
                )}
              </div>
              {chargement ? (
                <div className="mt-3 h-8 w-14 rounded bg-ink-100 animate-pulse" />
              ) : (
                <p className="font-display text-[30px] font-black tracking-tight text-ink-900 mt-2 leading-none">{s.valeur}</p>
              )}
              <p className="text-[12px] font-bold text-ink-600 mt-1.5">{s.label}</p>
              <p className="text-[11px] text-ink-400">{s.note}</p>
            </div>
          ))}
        </div>

        {/* ——— Contenu principal ——— */}
        <div className="mt-6 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <section className="rounded-xl border border-ink-100 bg-paper shadow-card animate-rise" style={{ animationDelay: "120ms" }}>
            <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-ink-100">
              <div>
                <h2 className="font-display font-extrabold text-[16px] tracking-tight">Programme du jour</h2>
                <p className="text-[11.5px] text-ink-400 mt-0.5 capitalize">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} — émissions validées uniquement</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setFiltreChaine("toutes")}
                  className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold border transition-colors ${
                    filtreChaine === "toutes" ? "bg-ink-900 text-white border-ink-900" : "bg-paper text-ink-500 border-ink-200 hover:border-ink-300"
                  }`}
                >
                  Toutes
                </button>
                {chaines.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFiltreChaine(c.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold border transition-colors ${
                      filtreChaine === c.id ? "bg-ink-900 text-white border-ink-900" : "bg-paper text-ink-500 border-ink-200 hover:border-ink-300"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} />
                    {c.nom.replace("Balafon ", "B+")}
                  </button>
                ))}
              </div>
            </header>
            <div className="p-3">
              {chargement ? (
                <div className="space-y-3 p-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[54px] rounded-lg bg-ink-100 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              ) : (
                <GrilleJour jour={aujourdhui} chaines={chaines} emissions={emissionsJour} compact />
              )}
            </div>
          </section>

          <div className="space-y-6">
            {/* Flux d'activité */}
            <section className="rounded-xl border border-ink-100 bg-paper shadow-card animate-rise" style={{ animationDelay: "200ms" }}>
              <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink-100">
                <h2 className="font-display font-extrabold text-[15px] tracking-tight">Dernières modifications</h2>
                <Icone name="history" size={17} className="text-ink-300" />
              </header>
              <ul className="px-2 py-2">
                {chargement
                  ? [0, 1, 2].map((i) => <li key={i} className="h-[46px] mx-3 my-1.5 rounded-lg bg-ink-100 animate-pulse" />)
                  : recentes.map((e) => {
                      const live = estEnDirect(e, now);
                      return (
                        <li key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-50 transition-colors">
                          <span className={`w-1.5 h-8 rounded-full flex-none ${live ? "bg-live" : "bg-ink-200"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-ink-800 truncate">{e.titre}</p>
                            <p className="text-[11px] text-ink-400">
                              {chaines.find((c) => c.id === e.chaine)?.nom} · {e.jour.slice(8)}/{e.jour.slice(5, 7)} {e.debut} — {ilYa(e.updated_at)}
                            </p>
                          </div>
                          <StatutBadge statut={e.statut} live={live} compact />
                        </li>
                      );
                    })}
              </ul>
            </section>

            {/* Demandes d'accès */}
            {nbDemandes > 0 && (
              <section className="rounded-xl border border-secondary-200 bg-secondary-50 px-5 py-4 flex items-center gap-3.5 animate-rise" style={{ animationDelay: "260ms" }}>
                <span className="grid place-items-center w-10 h-10 rounded-lg bg-secondary-600 text-white flex-none">
                  <Icone name="how_to_reg" size={20} />
                </span>
                <div className="flex-1">
                  <p className="text-[13.5px] font-bold text-ink-800">
                    {nbDemandes} demande{nbDemandes > 1 ? "s" : ""} d'accès en attente
                  </p>
                  <p className="text-[11.5px] text-ink-500">Inscriptions via l'écran de connexion.</p>
                </div>
              </section>
            )}

            {/* Accès rapide */}
            <section className="rounded-xl border border-ink-100 bg-ink-900 text-white px-5 py-5 overflow-hidden relative animate-rise" style={{ animationDelay: "320ms" }}>
              <TouchesBalafon className="absolute right-4 top-4 opacity-60" />
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/40">Accès rapide</p>
              <p className="font-display font-extrabold text-[17px] tracking-tight mt-2">Préparer la grille de la semaine ?</p>
              <p className="text-[12.5px] text-white/55 mt-1 leading-relaxed">Créez, ajustez puis soumettez vos créneaux à la Direction d'Antenne.</p>
              <Link
                to="/admin/grille"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-[13px] font-bold transition-colors"
              >
                <Icone name="calendar_month" size={16} /> Ouvrir l'éditeur de grille
              </Link>
            </section>

            {!chargement && emissions.length === 0 && !erreur && (
              <div className="rounded-xl border border-ink-100 bg-paper shadow-card">
                <EtatVide icone="inbox" titre="Aucune émission" texte="Rechargez ou créez votre première émission depuis l'éditeur." />
              </div>
            )}
          </div>
        </div>

        {chargement && (
          <p className="flex items-center justify-center gap-2 text-[12.5px] text-ink-400 py-4">
            <Spinner size={14} /> Chargement de la grille…
          </p>
        )}
      </div>
    </AppShell>
  );
}

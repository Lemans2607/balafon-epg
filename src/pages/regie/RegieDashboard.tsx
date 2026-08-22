import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, PastilleWs } from "../../components/layout/AppShell";
import { TypeDiffusionBadge } from "../../components/grille/badges";
import { Icone, Spinner, useToast } from "../../components/ui/kit";
import { useGrille, useWsEvents } from "../../hooks/useGrille";
import {
  getVmixJournal,
  getVmixStatut,
  setVmixEnLigne,
  synchroniserVmix,
  MODE_DEMO,
} from "../../api";
import type { VmixJournalEntry, VmixStatut } from "../../api/mockDb";
import {
  enDirectSurChaine,
  fmtJourLong,
  isoJour,
  prochaineSurChaine,
  progresPct,
  toMin,
  trousAntenne,
  type Chaine,
  type Emission,
} from "../../utils/epgHelpers";

interface Alerte {
  id: string;
  severite: "critique" | "attention" | "info";
  texte: string;
  ts: number;
}

function fmtDans(mins: number): string {
  if (mins < 1) return "imminent";
  if (mins < 60) return `dans ${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  return `dans ${h} h ${String(Math.round(mins) % 60).padStart(2, "0")}`;
}

export function RegieDashboard() {
  const { emissions, chaines, chargement, wsStatut, recharger } = useGrille();
  const toast = useToast();

  const [now, setNow] = useState(() => new Date());
  const [vmix, setVmix] = useState<VmixStatut | null>(null);
  const [journal, setJournal] = useState<VmixJournalEntry[]>([]);
  const [vmixIndispo, setVmixIndispo] = useState(false);
  const [sync, setSync] = useState(false);
  const [bascule, setBascule] = useState(false);
  const [alertesWs, setAlertesWs] = useState<Alerte[]>([]);

  const tic = useCallback(() => setNow(new Date()), []);
  useEffect(() => {
    const t = setInterval(tic, 1000);
    return () => clearInterval(t);
  }, [tic]);

  const chargerVmix = useCallback(async () => {
    try {
      const [st, j] = await Promise.all([getVmixStatut(), getVmixJournal()]);
      setVmix(st);
      setJournal(j);
      setVmixIndispo(false);
    } catch {
      setVmixIndispo(true);
    }
  }, []);

  useEffect(() => {
    void chargerVmix();
  }, [chargerVmix]);

  useWsEvents((msg) => {
    if (msg.type === "grille.validee" && msg.emission) {
      const em = msg.emission;
      toast.push({
        type: "succes",
        titre: "Grille validée — notification Direction",
        message: `« ${em.titre} » (${em.debut} – ${em.fin}) entre en grille. Synchronisation vMix recommandée.`,
      });
      setAlertesWs((a) => [
        { id: `w-${Date.now()}`, severite: "info", texte: `Grille validée : « ${em.titre} » — pensez à synchroniser vMix.`, ts: Date.now() },
        ...a.slice(0, 4),
      ]);
      void recharger();
    }
    if (msg.type === "regie.vmix") void chargerVmix();
  });

  const aujourdhui = isoJour(now);
  const maintenantMin = now.getHours() * 60 + now.getMinutes();

  const directs = useMemo(
    () => chaines.map((c) => ({ chaine: c, live: enDirectSurChaine(emissions, c.id, now) })),
    [chaines, emissions, now]
  );
  const nbDirects = directs.filter((d) => d.live).length;

  const aSuivre = useMemo(() => {
    const liste: { chaine: Chaine; e: Emission; dans: number }[] = [];
    for (const c of chaines) {
      const prochaine = prochaineSurChaine(emissions, c.id, now);
      if (prochaine) liste.push({ chaine: c, e: prochaine, dans: toMin(prochaine.debut) - maintenantMin });
    }
    return liste.sort((a, b) => a.dans - b.dans).slice(0, 5);
  }, [chaines, emissions, now, maintenantMin]);

  const alertes = useMemo(() => {
    const out: Alerte[] = [];
    if (vmixIndispo) {
      out.push({ id: "a-indispo", severite: "critique", texte: "Endpoints vMix injoignables — état « vMix indisponible ». Vérifiez le backend (VITE_API_URL).", ts: 0 });
    } else if (vmix && !vmix.en_ligne) {
      out.push({ id: "a-hs", severite: "critique", texte: "vMix hors ligne — la synchronisation de grille est suspendue.", ts: 0 });
    }
    for (const c of chaines) {
      const prochaine = prochaineSurChaine(emissions, c.id, now);
      if (prochaine && prochaine.type_diffusion === "direct") {
        const dans = toMin(prochaine.debut) - maintenantMin;
        if (dans >= 0 && dans <= 15) {
          out.push({ id: `prep-${c.id}`, severite: "attention", texte: `Préparer plateau ${c.nom} : « ${prochaine.titre} » — direct ${fmtDans(dans)}.`, ts: 0 });
        }
      }
      const trous = trousAntenne(emissions, c.id, aujourdhui);
      for (const trou of trous) {
        out.push({ id: `trou-${c.id}-${trou}`, severite: "info", texte: `Trou d'antenne détecté sur ${c.nom} : ${trou}.`, ts: 0 });
      }
    }
    const ordre = { critique: 0, attention: 1, info: 2 } as const;
    return [...alertesWs, ...out].sort((a, b) => ordre[a.severite] - ordre[b.severite]);
  }, [vmixIndispo, vmix, chaines, emissions, now, maintenantMin, aujourdhui, alertesWs]);

  const lancerSync = async () => {
    setSync(true);
    try {
      const res = await synchroniserVmix();
      toast.push({ type: "succes", titre: "Synchronisation terminée", message: `${res.message} (${res.envoyes} émissions envoyées).` });
      await chargerVmix();
    } catch (e) {
      toast.push({ type: "erreur", titre: "Échec de synchronisation", message: e instanceof Error ? e.message : "vMix ne répond pas." });
      await chargerVmix();
    } finally {
      setSync(false);
    }
  };

  const basculerLigne = async () => {
    setBascule(true);
    try {
      const cible = !(vmix?.en_ligne ?? false);
      await setVmixEnLigne(cible);
      toast.push({
        type: cible ? "succes" : "alerte",
        titre: cible ? "vMix reconnecté" : "Coupure vMix simulée",
        message: cible ? "L'API vMix répond de nouveau." : "L'écran bascule en état « vMix indisponible ».",
      });
      await chargerVmix();
    } finally {
      setBascule(false);
    }
  };

  const derniereSync = vmix?.derniere_sync
    ? new Date(vmix.derniere_sync).toTimeString().slice(0, 5)
    : null;

  return (
    <AppShell titre="Régie de diffusion" sousTitre="Monitoring antenne · synchronisation vMix" dark actions={<PastilleWs statut={wsStatut} dark />}>
      <div className="px-5 sm:px-7 py-6 max-w-[1320px] mx-auto">
        {/* ——— Bandeau ON AIR ——— */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-rise">
          <div className="flex items-center gap-4">
            <span
              className={`grid place-items-center rounded-lg px-4 py-2.5 font-display font-black tracking-[0.14em] text-[15px] ${
                nbDirects > 0 ? "bg-live text-white animate-blink" : "bg-dark-800 text-white/35 border border-dark-line"
              }`}
            >
              ● ON AIR
            </span>
            <div>
              <p className="font-display font-extrabold text-[19px] tracking-tight capitalize">{fmtJourLong(aujourdhui)}</p>
              <p className="text-[12px] text-white/40 mt-0.5">
                {nbDirects > 0 ? `${nbDirects} antenne${nbDirects > 1 ? "s" : ""} en direct` : "Aucune antenne en direct"} · grille validée uniquement
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[34px] font-bold leading-none tabular-nums text-white/90">
              {String(now.getHours()).padStart(2, "0")}
              <span className="text-accent">:</span>
              {String(now.getMinutes()).padStart(2, "0")}
              <span className="text-[19px] text-white/35">:{String(now.getSeconds()).padStart(2, "0")}</span>
            </p>
            <p className="text-[10.5px] text-white/35 font-mono mt-1">heure locale régie</p>
          </div>
        </div>

        {/* ——— Panneaux chaînes : En direct / À suivre ——— */}
        <div className="grid md:grid-cols-3 gap-4">
          {directs.map(({ chaine, live }, i) => {
            const suivante = prochaineSurChaine(emissions, chaine.id, now);
            return (
              <article
                key={chaine.id}
                className="relative overflow-hidden rounded-xl border border-dark-line bg-dark-800 p-5 animate-rise transition-colors hover:border-dark-600"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: chaine.accent }} />
                <header className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-[13px] tracking-wide uppercase text-white/70 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-[3px]" style={{ background: chaine.accent }} /> {chaine.nom}
                  </p>
                  {live ? (
                    <span className="flex items-center gap-1.5 text-[10.5px] font-black text-live bg-live/10 border border-live/30 rounded-md px-2 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse-dot" /> EN DIRECT
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-black text-white/30 border border-dark-line rounded-md px-2 py-1">HORS DIRECT</span>
                  )}
                </header>

                {live ? (
                  <div className="mt-4">
                    <h3 className="font-display font-extrabold text-[19px] tracking-tight leading-tight">{live.titre}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <TypeDiffusionBadge type={live.type_diffusion} compact />
                      <span className="font-mono text-[11px] text-white/45 tabular-nums">
                        {live.debut} – {live.fin}
                      </span>
                    </div>
                    <div className="mt-3.5 h-[6px] rounded-full bg-dark-700 overflow-hidden">
                      <div className="relative h-full rounded-full bg-live transition-[width] duration-1000" style={{ width: `${progresPct(live, now)}%` }}>
                        <span className="absolute inset-0 bg-stripes-live animate-stripes" />
                      </div>
                    </div>
                    <p className="font-mono text-[11px] text-white/45 mt-1.5 tabular-nums">
                      {Math.round(progresPct(live, now))}% déroulé
                    </p>
                  </div>
                ) : suivante ? (
                  <div className="mt-4">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/35">Prochaine émission</p>
                    <h3 className="font-display font-bold text-[16px] tracking-tight leading-tight mt-1 text-white/80">{suivante.titre}</h3>
                    <p className="font-mono text-[12px] text-accent font-semibold mt-1.5 tabular-nums">
                      {suivante.debut} · {fmtDans(toMin(suivante.debut) - maintenantMin)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-[13px] text-white/35">Fin de grille validée pour aujourd'hui.</p>
                  </div>
                )}

                {live && suivante && (
                  <p className="mt-3.5 pt-3 border-t border-dark-line text-[11.5px] text-white/40 truncate">
                    À suivre : <span className="text-white/70 font-semibold">{suivante.titre}</span> à <span className="font-mono text-white/70">{suivante.debut}</span>
                  </p>
                )}
              </article>
            );
          })}
        </div>

        {/* ——— Colonne inférieure ——— */}
        <div className="mt-6 grid lg:grid-cols-3 gap-4 items-start">
          {/* À suivre */}
          <section className="rounded-xl border border-dark-line bg-dark-800 overflow-hidden animate-rise" style={{ animationDelay: "180ms" }}>
            <header className="flex items-center justify-between px-5 py-3.5 border-b border-dark-line">
              <h2 className="font-display font-bold text-[14px] tracking-tight flex items-center gap-2">
                <Icone name="queue_play_next" size={17} className="text-accent" /> À suivre sur l'antenne
              </h2>
            </header>
            {chargement ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-[46px] rounded-lg bg-dark-700 animate-pulse" />)}
              </div>
            ) : aSuivre.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12.5px] text-white/35">Plus aucune émission validée aujourd'hui.</p>
            ) : (
              <ul className="p-2">
                {aSuivre.map(({ chaine, e, dans }) => (
                  <li key={`${chaine.id}-${e.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-dark-750 transition-colors">
                    <span className="font-mono text-[13px] font-bold text-accent w-[46px] flex-none tabular-nums">{e.debut}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-white/85 truncate">{e.titre}</p>
                      <p className="text-[10.5px] text-white/35 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-[2px]" style={{ background: chaine.accent }} /> {chaine.nom}
                      </p>
                    </div>
                    <TypeDiffusionBadge type={e.type_diffusion} compact />
                    <span className={`font-mono text-[10.5px] font-semibold flex-none ${dans <= 15 ? "text-warn" : "text-white/40"}`}>{fmtDans(dans)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* vMix */}
          <section className="rounded-xl border border-dark-line bg-dark-800 overflow-hidden animate-rise" style={{ animationDelay: "240ms" }}>
            <header className="flex items-center justify-between px-5 py-3.5 border-b border-dark-line">
              <h2 className="font-display font-bold text-[14px] tracking-tight flex items-center gap-2">
                <Icone name="sync" size={17} className="text-accent" /> Synchronisation vMix
              </h2>
              {vmix && !vmixIndispo && (
                <span className={`flex items-center gap-1.5 text-[10.5px] font-bold rounded-md px-2 py-1 border ${vmix.en_ligne ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-live border-live/30 bg-live/10"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vmix.en_ligne ? "bg-emerald-400" : "bg-live animate-pulse-dot"}`} />
                  {vmix.en_ligne ? "Connecté" : "Hors ligne"}
                </span>
              )}
            </header>

            {vmixIndispo ? (
              <div className="p-5">
                <div className="rounded-lg border border-live/30 bg-live/5 px-4 py-4 flex items-start gap-3">
                  <Icone name="wifi_off" size={20} className="text-live mt-0.5" />
                  <div>
                    <p className="text-[13.5px] font-bold text-live">vMix indisponible</p>
                    <p className="text-[12px] text-white/50 mt-1 leading-relaxed">
                      Les endpoints <span className="font-mono text-[11px]">/api/regie/vmix/*</span> ne répondent pas. Aucun faux indicateur n'est affiché — branchez le backend ou passez en mode démo.
                    </p>
                  </div>
                </div>
                <button onClick={() => void chargerVmix()} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dark-line text-white/60 hover:text-white py-2.5 text-[13px] font-bold transition-colors">
                  <Icone name="refresh" size={16} /> Réessayer la connexion
                </button>
              </div>
            ) : (
              <div className="p-5">
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="rounded-lg bg-dark-750 border border-dark-line px-2 py-2.5">
                    <p className="font-mono text-[13px] font-bold text-white/85">{vmix ? `${vmix.latence_ms} ms` : "—"}</p>
                    <p className="text-[9.5px] uppercase tracking-wider text-white/30 font-bold mt-0.5">Latence</p>
                  </div>
                  <div className="rounded-lg bg-dark-750 border border-dark-line px-2 py-2.5">
                    <p className="font-mono text-[13px] font-bold text-white/85 truncate">{vmix?.version ?? "—"}</p>
                    <p className="text-[9.5px] uppercase tracking-wider text-white/30 font-bold mt-0.5">Version</p>
                  </div>
                  <div className="rounded-lg bg-dark-750 border border-dark-line px-2 py-2.5">
                    <p className="font-mono text-[13px] font-bold text-white/85">{derniereSync ?? "—"}</p>
                    <p className="text-[9.5px] uppercase tracking-wider text-white/30 font-bold mt-0.5">Dernière sync</p>
                  </div>
                </div>

                <button
                  onClick={() => void lancerSync()}
                  disabled={sync || !vmix?.en_ligne}
                  className="mt-3.5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-[13.5px] font-bold transition-all active:scale-[0.99]"
                >
                  {sync ? <Spinner size={16} /> : <Icone name="cloud_sync" size={17} />}
                  {sync ? "Envoi de la grille…" : "Synchroniser la grille"}
                </button>
                {!vmix?.en_ligne && (
                  <p className="text-[11px] text-live/80 mt-2 flex items-center gap-1.5">
                    <Icone name="error" size={13} /> Synchronisation suspendue — vMix hors ligne.
                  </p>
                )}

                {MODE_DEMO && (
                  <button
                    onClick={() => void basculerLigne()}
                    disabled={bascule}
                    className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dark-line text-white/50 hover:text-white py-2 text-[12px] font-semibold transition-colors disabled:opacity-50"
                    title="Simulation pour la démonstration"
                  >
                    <Icone name={vmix?.en_ligne ? "power_settings_new" : "settings_power"} size={15} />
                    {vmix?.en_ligne ? "Simuler une coupure (démo)" : "Rétablir la connexion (démo)"}
                  </button>
                )}
              </div>
            )}

            {/* Journal */}
            {!vmixIndispo && (
              <div className="border-t border-dark-line">
                <p className="px-5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Journal de synchronisation</p>
                <ul className="max-h-[190px] overflow-y-auto dark-scroll px-2 pb-2">
                  {journal.length === 0 && <li className="px-3 py-4 text-[12px] text-white/30 text-center">Journal vide.</li>}
                  {journal.map((j) => (
                    <li key={j.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-dark-750 transition-colors">
                      <span className="font-mono text-[10.5px] text-white/35 flex-none tabular-nums">{j.heure}</span>
                      <span className="text-[11.5px] text-white/70 font-semibold flex-none">{j.action}</span>
                      <span className="text-[11px] text-white/35 truncate flex-1">{j.element}</span>
                      <Icone
                        name={j.succes ? "check_circle" : "cancel"}
                        size={14}
                        filled
                        className={j.succes ? "text-emerald-400" : "text-live"}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Alertes */}
          <section className="rounded-xl border border-dark-line bg-dark-800 overflow-hidden animate-rise" style={{ animationDelay: "300ms" }}>
            <header className="flex items-center justify-between px-5 py-3.5 border-b border-dark-line">
              <h2 className="font-display font-bold text-[14px] tracking-tight flex items-center gap-2">
                <Icone name="notifications_active" size={17} className="text-accent" /> Alertes antenne
              </h2>
              <span className={`text-[10.5px] font-bold rounded-md px-2 py-1 border ${alertes.some((a) => a.severite === "critique") ? "text-live border-live/30 bg-live/10" : "text-white/40 border-dark-line"}`}>
                {alertes.length} active{alertes.length > 1 ? "s" : ""}
              </span>
            </header>
            {chargement ? (
              <div className="p-4 space-y-2">
                {[0, 1].map((i) => <div key={i} className="h-[40px] rounded-lg bg-dark-700 animate-pulse" />)}
              </div>
            ) : alertes.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Icone name="verified" size={30} className="text-emerald-400 mx-auto" />
                <p className="text-[13px] font-semibold text-white/60 mt-2">Aucune alerte — antenne nominale</p>
                <p className="text-[11.5px] text-white/30 mt-1">Les directs imminents et trous d'antenne apparaîtront ici.</p>
              </div>
            ) : (
              <ul className="p-2.5 space-y-1.5 max-h-[380px] overflow-y-auto dark-scroll">
                {alertes.map((a) => {
                  const style =
                    a.severite === "critique"
                      ? { bord: "border-live/35", fond: "bg-live/8", icone: "error", coul: "text-live" }
                      : a.severite === "attention"
                      ? { bord: "border-amber-400/30", fond: "bg-amber-400/[0.07]", icone: "warning", coul: "text-amber-400" }
                      : { bord: "border-dark-line", fond: "bg-dark-750", icone: "info", coul: "text-secondary-300" };
                  return (
                    <li key={a.id} className={`flex items-start gap-2.5 rounded-lg border ${style.bord} ${style.fond} px-3.5 py-3 animate-fade-in`}>
                      <Icone name={style.icone} size={16} filled className={`${style.coul} mt-0.5 flex-none`} />
                      <p className="text-[12.5px] text-white/75 leading-snug">{a.texte}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <p className="text-[11px] text-white/25 mt-6 flex items-center gap-2">
          <Icone name="monitor_heart" size={13} />
          Indicateurs calculés en continu depuis la grille validée · WebSocket <span className="font-mono">{wsStatut === "ouvert" ? "connecté" : "reconnexion…"}</span> · {MODE_DEMO ? "mode démo (données locales)" : "connecté au backend Django"}
        </p>
      </div>
    </AppShell>
  );
}

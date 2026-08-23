import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BellRing,
  CheckCheck,
  Clapperboard,
  Cog,
  ListChecks,
  Loader2,
  MonitorPlay,
  Radio,
  RefreshCw,
} from "lucide-react";
import { PROGRAMMES } from "../data/mock";
import {
  aSuivreAujourdhui,
  enDirectMaintenant,
  finBlocLabel,
  ilYa,
  jourIdxAujourdhui,
  slotLabel,
  toHHMM,
} from "../utils/epg";
import { useNow, useStudio } from "../state/store";
import { OngletsJours, ProgressBar, useToast } from "../components/shared";
import { TimelineJour } from "../components/EpgTimeline";

export function RegieControl() {
  const { db, grilleAntenne, acquitter, vmix, syncVmix } = useStudio();
  const toast = useToast();
  const now = useNow(1000);
  const [jourIdx, setJourIdx] = useState(() => jourIdxAujourdhui());

  const live = useMemo(() => enDirectMaintenant(grilleAntenne, PROGRAMMES, now), [grilleAntenne, now]);
  const suivants = useMemo(() => aSuivreAujourdhui(grilleAntenne, PROGRAMMES, now).slice(0, 3), [grilleAntenne, now]);

  const actives = db.alertes.filter((a) => !a.acquittee);
  const traitees = db.alertes.filter((a) => a.acquittee);

  const lancerSync = async () => {
    if (vmix.syncing) return;
    toast.push({ type: "info", titre: "Synchronisation vMix en cours", message: "Envoi du miroir de la grille validée…" });
    await syncVmix();
    toast.push({ type: "succes", titre: "vMix synchronisé", message: "Playlist antenne à jour — aucun écart détecté." });
  };

  return (
    <div className="px-5 sm:px-7 py-7 max-w-[1400px] mx-auto">
      {/* ——— Bandeau EN DIRECT ——— */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative overflow-hidden rounded-xl border border-bred/30 bg-gradient-to-r from-[#1a0d08] via-night2 to-night2"
      >
        <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-bred" />
        <div className="absolute inset-0 bg-studio-grid opacity-40 pointer-events-none" />
        <div className="relative flex flex-wrap items-center gap-5 px-5 sm:px-7 py-5">
          <span className={`grid place-items-center w-12 h-12 rounded-xl flex-none ${live ? "bg-bred text-white animate-pulse-red shadow-glow-red" : "bg-white/[0.06] text-white/40"}`}>
            <Radio size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-bred flex items-center gap-2">
              {live ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-bred animate-pulse-red" /> En direct sur Balafon TV
                </>
              ) : (
                <span className="text-white/35">Antenne — hors direct</span>
              )}
            </p>
            <h1 className="font-display font-black text-[22px] sm:text-[26px] tracking-tight leading-tight mt-1 truncate">
              {live ? live.prog.titre : suivants[0] ? `À suivre : ${suivants[0].prog.titre}` : "L'antenne reprend à 06:00"}
            </h1>
            {live && (
              <div className="flex items-center gap-3 mt-2 max-w-[420px]">
                <ProgressBar value={live.progres} striped className="h-[5px]" />
                <span className="font-mono text-[11px] font-bold text-bred tabular-nums flex-none">
                  {Math.round(live.progres)}% · fin {finBlocLabel(live.bloc.slot, live.prog.duree)}
                </span>
              </div>
            )}
          </div>
          <div className="text-right flex-none">
            <p className="font-mono text-[26px] font-bold tabular-nums text-white/90">
              {toHHMM(now.getHours() * 60 + now.getMinutes())}
              <span className="text-bred">:{String(now.getSeconds()).padStart(2, "0")}</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mt-0.5">Heure régie · Douala</p>
          </div>
        </div>
      </motion.section>

      <div className="grid xl:grid-cols-[1fr_360px] gap-6 mt-6 items-start">
        {/* ——— Timeline miroir ——— */}
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06, ease: "easeOut" }} className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display font-extrabold text-[18px] tracking-tight flex items-center gap-2.5">
                <MonitorPlay size={18} className="text-bred" /> Timeline EPG — lecture seule
              </h2>
              <p className="text-[11.5px] text-white/35 mt-0.5">
                Miroir de « {grilleAntenne?.nom ?? "—"} » · la régie ne saisit rien, elle supervise
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-sgreen bg-sgreen/[0.07] border border-sgreen/25 rounded-full px-2.5 py-1">
              <CheckCheck size={12} /> Zéro double saisie
            </span>
          </div>

          <div className="mb-4">
            <OngletsJours actif={jourIdx} onChange={setJourIdx} soulignerAujourdhui={jourIdxAujourdhui()} />
          </div>

          {grilleAntenne ? (
            <TimelineJour grilleId={grilleAntenne.id} jourIdx={jourIdx} mode="lecture" playhead={jourIdx === jourIdxAujourdhui()} />
          ) : (
            <div className="h-[220px] rounded-xl skeleton" />
          )}

          {/* À suivre */}
          <div className="mt-5 glass-pane rounded-xl overflow-hidden">
            <header className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <ListChecks size={15} className="text-gold" />
              <h3 className="font-display font-bold text-[13.5px] tracking-tight">À suivre sur l'antenne</h3>
            </header>
            {suivants.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-white/30">Plus aucun programme aujourd'hui — reprise à 06:00.</p>
            ) : (
              <ul className="p-2">
                {suivants.map(({ bloc, prog }) => (
                  <li key={bloc.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
                    <span className="font-mono text-[13px] font-bold text-bred w-[52px] flex-none tabular-nums">{slotLabel(bloc.slot)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold truncate">{prog.titre}</span>
                      <span className="block text-[10.5px] text-white/35">
                        {prog.duree >= 60 ? `${prog.duree / 60} h` : `${prog.duree} min`} · {prog.type === "direct" ? "DIRECT à préparer" : "fichier playlist"}
                      </span>
                    </span>
                    {prog.type === "direct" && (
                      <span className="flex-none text-[9px] font-black text-bred border border-bred/35 bg-bred/10 rounded px-1.5 py-0.5">PLATEAU</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.section>

        {/* ——— Console d'alertes + vMix ——— */}
        <motion.aside initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }} className="space-y-5 xl:sticky xl:top-[86px]">
          {/* Console d'alertes */}
          <section className="glass-pane rounded-xl overflow-hidden">
            <header className="px-4 py-3.5 border-b border-white/[0.06] flex items-center gap-2.5">
              <span className="relative">
                <BellRing size={16} className="text-bred" />
                {actives.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-bred animate-pulse-red" />}
              </span>
              <h2 className="font-display font-bold text-[14px] tracking-tight">Console d'Alertes Temps Réel</h2>
              {actives.length > 0 && (
                <span className="ml-auto font-mono text-[10.5px] font-bold bg-bred text-white rounded-full px-2 py-0.5 animate-blink-alert tabular-nums">
                  {actives.length}
                </span>
              )}
            </header>

            <div className="max-h-[330px] overflow-y-auto p-2.5 space-y-2">
              {actives.length === 0 && (
                <p className="px-3 py-8 text-center text-[12px] text-white/30">
                  Aucune alerte active — antenne nominale.
                </p>
              )}
              {actives.map((a) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-bred/40 bg-bred/[0.07] p-3.5 animate-blink-alert"
                  style={{ animationDuration: "2.4s" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] font-bold text-bred tabular-nums">{a.heure}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-bred bg-bred/15 border border-bred/35 rounded px-1.5 py-0.5">
                      Action requise
                    </span>
                  </div>
                  <p className="text-[12px] text-white/80 leading-snug mt-2">{a.texte}</p>
                  <button
                    onClick={() => {
                      acquitter(a.id);
                      toast.push({ type: "succes", titre: "Alerte acquittée", message: "Action vMix confirmée par la régie." });
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-bred hover:bg-bred2 text-white text-[11.5px] font-bold px-3 py-1.5 transition-all active:scale-[0.97]"
                  >
                    <CheckCheck size={13} /> Acquitter l'alerte
                  </button>
                </motion.div>
              ))}

              {traitees.length > 0 && (
                <div className="pt-1">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.18em] text-white/25 px-1.5 pb-1.5">Acquittées</p>
                  {traitees.map((a) => (
                    <div key={a.id} className="rounded-lg border border-line bg-night2/60 p-3 mb-1.5 opacity-55">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-white/40 tabular-nums">{a.heure}</span>
                        <CheckCheck size={11} className="text-sgreen" />
                      </div>
                      <p className="text-[11.5px] text-white/45 leading-snug mt-1.5">{a.texte}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Panneau vMix */}
          <section className={`glass-pane rounded-xl overflow-hidden ${vmix.syncing ? "" : "!border-sgreen/25"}`}>
            <header className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-display font-bold text-[14px] tracking-tight flex items-center gap-2">
                <Cog size={15} className="text-sgreen" /> API vMix
              </h2>
              <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold rounded-full px-2.5 py-1 border ${vmix.syncing ? "text-gold border-gold/35 bg-gold/[0.07]" : "text-sgreen border-sgreen/30 bg-sgreen/[0.07]"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${vmix.syncing ? "bg-gold animate-blink-alert" : "bg-sgreen animate-pulse"}`} />
                {vmix.syncing ? "Synchronisation…" : "Synchronisée"}
              </span>
            </header>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg bg-night2 border border-line px-3 py-2.5">
                  <p className="font-mono text-[12px] font-bold text-white/80 tabular-nums">
                    {vmix.lastSync ? toHHMM(new Date(vmix.lastSync).getHours() * 60 + new Date(vmix.lastSync).getMinutes()) : "—"}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mt-0.5">Dernière sync</p>
                </div>
                <div className="rounded-lg bg-night2 border border-line px-3 py-2.5">
                  <p className="font-mono text-[12px] font-bold text-white/80 tabular-nums">{grilleAntenne?.jours.reduce((s, j) => s + j.length, 0) ?? 0}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mt-0.5">Éléments playlist</p>
                </div>
              </div>
              <button
                onClick={() => void lancerSync()}
                disabled={vmix.syncing}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sgreen text-night font-black text-[13px] py-2.5 hover:brightness-110 transition-all active:scale-[0.99] disabled:opacity-60 shadow-glow-green"
              >
                {vmix.syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {vmix.syncing ? "Envoi du miroir…" : "Synchroniser vMix"}
              </button>
              <p className="text-[10.5px] text-white/30 leading-relaxed mt-3">
                La régie lit le miroir de la grille validée — plus aucune ressaisie manuelle des conducteurs.
              </p>
            </div>
          </section>

          {/* Journal récent */}
          <section className="glass-pane rounded-xl overflow-hidden">
            <header className="px-4 py-3 border-b border-white/[0.06]">
              <h2 className="font-display font-bold text-[13px] tracking-tight">Derniers événements</h2>
            </header>
            <ul className="p-2">
              {db.log.slice(0, 5).map((l) => {
                const Icon = l.acteur === "directeur" ? Clapperboard : l.acteur === "regie" ? Radio : Cog;
                return (
                  <li key={l.id} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white/[0.03] transition-colors">
                    <Icon size={13} className={`mt-0.5 flex-none ${l.acteur === "directeur" ? "text-sgreen" : l.acteur === "regie" ? "text-bred" : "text-white/30"}`} />
                    <p className="text-[11.5px] text-white/60 leading-snug flex-1">{l.action}</p>
                    <span className="font-mono text-[9.5px] text-white/25 flex-none">{ilYa(l.ts)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </motion.aside>
      </div>
    </div>
  );
}

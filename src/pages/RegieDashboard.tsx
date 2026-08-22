import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Cog,
  Eye,
  EyeOff,
  ListChecks,
  Loader2,
  MonitorPlay,
  Pencil,
  Radio,
  Trash2,
  XCircle,
} from "lucide-react";
import type { Grille } from "../types";
import { chaineDe } from "../data/mock";
import { useApp } from "../context/AppContext";
import * as storage from "../services/storage";
import {
  conflitsDe,
  couvertureMoyenne,
  emissionLive,
  emissionSuivante,
  fmtSemaine,
  ilYa,
  progresPct,
} from "../utils/epg";
import { ConfirmModal, ConsoleShell, EtatVide, HorlogeMono, Modale, ProgressBar, StatutBadge, useToast } from "../components/ui";
import { GrilleEditorModal } from "../components/GrilleEditor";
import { Link } from "react-router-dom";

export function RegieDashboard() {
  const { user, grilles, activite, pret } = useApp();
  const toast = useToast();

  const [now, setNow] = useState(() => new Date());
  const [editeeId, setEditeeId] = useState<string | null>(null);
  const editee = grilles.find((g) => g.id === editeeId) ?? null;
  const [aValider, setAValider] = useState<Grille | null>(null);
  const [aRejeter, setARejeter] = useState<Grille | null>(null);
  const [aSupprimer, setASupprimer] = useState<Grille | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [errRejet, setErrRejet] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [apercus, setApercus] = useState<string[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);

  const pendantes = useMemo(() => grilles.filter((g) => g.statut === "en_attente").sort((a, b) => b.majLe - a.majLe), [grilles]);
  const validees = useMemo(() => grilles.filter((g) => g.statut === "valide"), [grilles]);
  const directs = useMemo(() => validees.filter((g) => emissionLive(g, now)).length, [validees, now]);
  const totalConflits = useMemo(() => pendantes.reduce((s, g) => s + conflitsDe(g).length, 0), [pendantes]);

  const valider = async () => {
    if (!aValider) return;
    setBusyId(aValider.id);
    try {
      await storage.validerGrille(aValider.id, user!);
      toast.push({
        type: "succes",
        titre: "Grille validée — passage à l'antenne",
        message: `« ${aValider.nom} » est visible sur le portail téléspectateur et le Guide TV.`,
      });
      setAValider(null);
    } catch (e) {
      toast.push({ type: "erreur", titre: "Validation impossible", message: e instanceof Error ? e.message : undefined });
    } finally {
      setBusyId(null);
    }
  };

  const rejeter = async () => {
    if (!aRejeter) return;
    if (commentaire.trim().length < 5) {
      setErrRejet("Merci d'indiquer un motif (5 caractères minimum).");
      return;
    }
    setBusyId(aRejeter.id);
    try {
      await storage.rejeterGrille(aRejeter.id, commentaire.trim(), user!);
      toast.push({
        type: "info",
        titre: "Grille rejetée",
        message: `« ${aRejeter.nom} » retourne en brouillon avec votre commentaire.`,
      });
      setARejeter(null);
      setCommentaire("");
      setErrRejet(null);
    } catch (e) {
      toast.push({ type: "erreur", titre: "Rejet impossible", message: e instanceof Error ? e.message : undefined });
    } finally {
      setBusyId(null);
    }
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    setBusyId(aSupprimer.id);
    try {
      await storage.supprimerGrille(aSupprimer.id, user!);
      toast.push({
        type: "alerte",
        titre: "Grille supprimée par la Régie",
        message: `« ${aSupprimer.nom} » ${aSupprimer.statut === "valide" ? "a été retirée de l'antenne et " : ""}placée en corbeille.`,
      });
      setASupprimer(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ConsoleShell
      titre="Régie de Diffusion"
      sousTitre="Validation et supervision des grilles en temps réel"
      role="regie"
      itemPrincipal={{ label: "Supervision antenne", Icon: Radio }}
      actions={
        <Link
          to="/guide"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3.5 py-2 text-[12.5px] font-bold text-white/70 hover:text-white hover:border-line2 transition-colors"
        >
          <MonitorPlay size={15} /> Guide TV public
        </Link>
      }
    >
      <div className="px-5 sm:px-8 py-7 max-w-[1280px] mx-auto">
        {/* ——— Statistiques temps réel ——— */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-wrap items-stretch rounded-xl border border-line bg-panel divide-x divide-line overflow-hidden"
        >
          {[
            { label: "En attente de validation", val: pendantes.length, cls: "text-warn", pulse: pendantes.length > 0 },
            { label: "Directs en cours", val: directs, cls: "text-brand", pulse: directs > 0 },
            { label: "Grilles à l'antenne", val: validees.length, cls: "text-ok", pulse: false },
            { label: "Conflits détectés", val: totalConflits, cls: totalConflits > 0 ? "text-danger" : "text-white/60", pulse: false },
          ].map((s) => (
            <div key={s.label} className="px-6 py-4 min-w-[160px] flex-1">
              <div className="flex items-center gap-2.5">
                {!pret ? (
                  <div className="h-8 w-12 rounded skeleton" />
                ) : (
                  <p className={`font-display font-black text-[28px] leading-none tabular-nums ${s.cls}`}>{s.val}</p>
                )}
                {s.pulse && <span className="w-2 h-2 rounded-full bg-current animate-pulse-dot flex-none" style={{ color: "inherit" }} />}
              </div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/30 mt-1.5">{s.label}</p>
            </div>
          ))}
          <div className="px-6 py-4 min-w-[150px] flex flex-col justify-center">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/30">Heure régie</p>
            <HorlogeMono secondes className="text-[22px] font-bold text-white/85 mt-1" />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1.55fr_1fr] gap-6 mt-7 items-start">
          {/* ——— Colonne principale ——— */}
          <div className="space-y-8">
            {/* File de validation */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display font-extrabold text-[19px] tracking-tight">File de validation</h2>
                {pendantes.length > 0 && (
                  <span className="font-mono text-[11px] font-bold bg-warn text-oled rounded-full px-2.5 py-1">{pendantes.length}</span>
                )}
              </div>

              {!pret ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-[150px] rounded-xl skeleton" />
                  ))}
                </div>
              ) : pendantes.length === 0 ? (
                <div className="rounded-xl border border-line bg-panel">
                  <EtatVide
                    Icon={ListChecks}
                    titre="Aucune grille en attente"
                    texte="Les grilles soumises par le Directeur d'Antenne apparaissent ici pour validation."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {pendantes.map((g, i) => {
                    const ch = chaineDe(g.chaineId);
                    const conflits = conflitsDe(g);
                    const ouvert = apercus.includes(g.id);
                    return (
                      <motion.article
                        key={g.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: Math.min(i, 5) * 0.06, ease: "easeOut" }}
                        className="relative rounded-xl border border-warn/25 bg-panel overflow-hidden hover:border-warn/45 transition-colors"
                      >
                        <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-warn" />
                        <div className="p-5 pl-6">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-display font-extrabold text-[17px] tracking-tight">{g.nom}</h3>
                              <p className="flex items-center gap-2 text-[11.5px] text-white/35 mt-1 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-white/60">
                                  <span className="w-2 h-2 rounded-[3px]" style={{ background: ch.accent }} /> {ch.nom}
                                </span>
                                <span>{fmtSemaine(g.semaineDebut)}</span>
                                <span className="font-mono">{g.emissions.length} émissions</span>
                                <span>soumise par {g.creePar} · {ilYa(g.majLe)}</span>
                              </p>
                            </div>
                            <StatutBadge statut="en_attente" />
                          </div>

                          <div className="flex items-center gap-4 mt-3.5">
                            <div className="flex-1 max-w-[260px]">
                              <div className="flex justify-between text-[10px] font-mono text-white/35 mb-1">
                                <span>Couverture antenne</span>
                                <span>{couvertureMoyenne(g)}%</span>
                              </div>
                              <ProgressBar value={couvertureMoyenne(g)} color={couvertureMoyenne(g) > 85 ? "var(--color-ok)" : "var(--color-warn)"} className="h-[5px]" />
                            </div>
                            {conflits.length > 0 && (
                              <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-danger bg-danger/10 border border-danger/25 rounded-md px-2.5 py-1.5">
                                <AlertTriangle size={13} /> {conflits.length} conflit{conflits.length > 1 ? "s" : ""} horaire{conflits.length > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>

                          {conflits.length > 0 && (
                            <p className="mt-2 text-[11.5px] text-white/45">
                              Chevauchement : « {conflits[0][0].titre} » ↔ « {conflits[0][1].titre} » — correction recommandée avant validation.
                            </p>
                          )}

                          {/* Aperçu */}
                          <button
                            onClick={() => setApercus((a) => (ouvert ? a.filter((x) => x !== g.id) : [...a, g.id]))}
                            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/50 hover:text-white transition-colors"
                          >
                            {ouvert ? <EyeOff size={13} /> : <Eye size={13} />}
                            {ouvert ? "Masquer" : "Aperçu"} des programmes
                            <ChevronDown size={13} className={`transition-transform ${ouvert ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {ouvert && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                {g.emissions.slice(0, 6).map((e) => (
                                  <li key={e.id} className="flex items-center gap-3 py-1.5 border-b border-line/50 last:border-0">
                                    <span className="font-mono text-[11px] text-white/50 w-[92px] tabular-nums">
                                      {e.debut} – {e.fin}
                                    </span>
                                    <span className="text-[12.5px] font-semibold truncate flex-1">{e.titre}</span>
                                    <span className="text-[10px] text-white/30">{e.jour.slice(8)}/{e.jour.slice(5, 7)}</span>
                                  </li>
                                ))}
                                {g.emissions.length > 6 && (
                                  <li className="pt-1.5 text-[11px] text-white/30">… et {g.emissions.length - 6} autres programmes</li>
                                )}
                              </motion.ul>
                            )}
                          </AnimatePresence>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            <button
                              onClick={() => setAValider(g)}
                              className="inline-flex items-center gap-2 rounded-lg bg-ok hover:brightness-110 text-white px-4 py-2 text-[13px] font-bold transition-all active:scale-[0.98]"
                            >
                              <CheckCircle2 size={16} /> Valider la grille
                            </button>
                            <button
                              onClick={() => {
                                setARejeter(g);
                                setCommentaire("");
                                setErrRejet(null);
                              }}
                              className="inline-flex items-center gap-2 rounded-lg border border-danger/35 text-danger hover:bg-danger/10 px-4 py-2 text-[13px] font-bold transition-colors"
                            >
                              <XCircle size={16} /> Rejeter
                            </button>
                            <button
                              onClick={() => setEditeeId(g.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-line text-white/60 hover:text-white hover:border-line2 px-3.5 py-2 text-[13px] font-semibold transition-colors"
                              title="Modifier la grille"
                            >
                              <Pencil size={14} /> Modifier
                            </button>
                            <button
                              onClick={() => setASupprimer(g)}
                              className="grid place-items-center w-9 h-9 rounded-lg border border-line text-white/55 hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-colors"
                              title="Supprimer la grille"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Grilles à l'antenne */}
            <section>
              <h2 className="font-display font-extrabold text-[19px] tracking-tight mb-4">Grilles à l'antenne</h2>
              {!pret ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[58px] rounded-xl skeleton" />
                  ))}
                </div>
              ) : (
                <ul className="rounded-xl border border-line bg-panel divide-y divide-line/60 overflow-hidden">
                  {validees.map((g) => {
                    const ch = chaineDe(g.chaineId);
                    const live = emissionLive(g, now);
                    return (
                      <li key={g.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 hover:bg-panel2/60 transition-colors">
                        <span className="w-[4px] self-stretch rounded-full" style={{ background: ch.accent }} />
                        <div className="min-w-[200px] flex-1">
                          <p className="font-display font-bold text-[14px] flex items-center gap-2">
                            {g.nom}
                            {live && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-brand bg-brand/10 border border-brand/30 rounded px-1.5 py-0.5">
                                <span className="w-1 h-1 rounded-full bg-brand animate-pulse-dot" /> DIRECT
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-white/35 mt-0.5">
                            {ch.nom} · couverture {couvertureMoyenne(g)}%
                            {live ? ` · en direct : ${live.titre}` : ""}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-ok/80">{ilYa(g.majLe)}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditeeId(g.id)}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-line text-white/55 hover:text-white hover:border-line2 text-[11.5px] font-bold transition-colors"
                            title="Modification en temps réel"
                          >
                            <Pencil size={12} /> Modifier
                          </button>
                          <button
                            onClick={() => setASupprimer(g)}
                            className="grid place-items-center w-8 h-8 rounded-lg border border-line text-white/55 hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-colors"
                            title="Retirer de l'antenne"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="flex items-center gap-2 text-[11.5px] text-white/30 mt-3">
                <AlertTriangle size={13} className="text-warn" />
                Toute modification ou suppression est répercutée instantanément sur le Guide TV et le portail téléspectateur.
              </p>
            </section>
          </div>

          {/* ——— Colonne latérale ——— */}
          <div className="space-y-6">
            {/* Monitor antenne */}
            <section className="rounded-xl border border-line bg-panel overflow-hidden">
              <header className="flex items-center justify-between px-5 py-3.5 border-b border-line">
                <h2 className="font-display font-bold text-[14px] tracking-tight flex items-center gap-2">
                  <MonitorPlay size={16} className="text-brand" /> Antenne — en direct
                </h2>
                <HorlogeMono className="text-[12px] text-white/40" />
              </header>
              <ul className="p-3 space-y-2">
                {!pret
                  ? [0, 1, 2].map((i) => <li key={i} className="h-[52px] rounded-lg skeleton" />)
                  : validees.map((g) => {
                      const ch = chaineDe(g.chaineId);
                      const live = emissionLive(g, now);
                      const next = emissionSuivante(g, now);
                      return (
                        <li key={g.id} className="rounded-lg border border-line bg-panel2 px-3.5 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded" style={{ background: ch.accent, color: ch.accent === "#FFD54F" ? "#0A0A0A" : "#fff" }}>
                              {ch.short}
                            </span>
                            {live ? (
                              <span className="font-mono text-[10.5px] font-bold text-brand tabular-nums">{Math.round(progresPct(live, now))}%</span>
                            ) : (
                              <span className="text-[9.5px] font-bold text-white/30 uppercase tracking-wider">Hors direct</span>
                            )}
                          </div>
                          {live ? (
                            <>
                              <p className="text-[12.5px] font-bold truncate mt-1.5">{live.titre}</p>
                              <div className="mt-1.5">
                                <ProgressBar value={progresPct(live, now)} striped className="h-[4px]" />
                              </div>
                            </>
                          ) : (
                            <p className="text-[11.5px] text-white/45 truncate mt-1.5">
                              {next ? <>À suivre : <span className="text-white/75 font-semibold">{next.titre}</span> · <span className="font-mono">{next.debut}</span></> : "Fin de grille"}
                            </p>
                          )}
                        </li>
                      );
                    })}
              </ul>
            </section>

            {/* Journal temps réel */}
            <section className="rounded-xl border border-line bg-panel overflow-hidden">
              <header className="flex items-center justify-between px-5 py-3.5 border-b border-line">
                <h2 className="font-display font-bold text-[14px] tracking-tight">Journal temps réel</h2>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ok">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-dot" /> SYNCHRO
                </span>
              </header>
              <ul className="p-2 max-h-[440px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {activite.slice(0, 14).map((a) => {
                    const Ic = a.role === "regie" ? Radio : a.role === "directeur" ? Clapperboard : Cog;
                    const coul = a.role === "regie" ? "text-ok" : a.role === "directeur" ? "text-brand" : "text-white/35";
                    return (
                      <motion.li
                        key={a.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-panel2 transition-colors"
                      >
                        <span className={`grid place-items-center w-8 h-8 rounded-lg bg-panel2 border border-line flex-none ${coul}`}>
                          <Ic size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] leading-snug">
                            <span className="font-bold">{a.acteur}</span> <span className="text-white/55">{a.action}</span>{" "}
                            <span className="font-semibold text-white/85">« {a.cible} »</span>
                          </p>
                          <p className="font-mono text-[10px] text-white/30 mt-0.5">{ilYa(a.ts)}</p>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
                {activite.length === 0 && <li className="px-4 py-8 text-center text-[12px] text-white/30">Journal vide.</li>}
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* ——— Éditeur partagé ——— */}
      <GrilleEditorModal grille={editee} ouvert={editee !== null} onFermer={() => setEditeeId(null)} />

      {/* ——— Confirmation de validation ——— */}
      <ConfirmModal
        ouvert={aValider !== null}
        titre="Valider la grille"
        danger={false}
        message={
          <>
            « <span className="font-bold text-white">{aValider?.nom}</span> » ({aValider ? chaineDe(aValider.chaineId).nom : ""},{" "}
            {aValider ? fmtSemaine(aValider.semaineDebut) : ""}) sera immédiatement publiée sur le portail téléspectateur et le Guide TV.
            {aValider && conflitsDe(aValider).length > 0 && (
              <span className="block mt-2 text-warn font-semibold">
                Attention : {conflitsDe(aValider).length} conflit(s) horaire(s) subsiste(nt) dans cette grille.
              </span>
            )}
          </>
        }
        confirmLabel="Valider et publier"
        loading={busyId === aValider?.id}
        onAnnuler={() => setAValider(null)}
        onConfirmer={() => void valider()}
      />

      {/* ——— Rejet avec motif ——— */}
      <Modale
        ouvert={aRejeter !== null}
        onFermer={() => setARejeter(null)}
        titre="Rejeter la grille"
        sousTitre={aRejeter ? `« ${aRejeter.nom} » — retour en brouillon` : undefined}
      >
        <p className="text-[13px] text-white/55 leading-relaxed">
          Le Directeur d'Antenne recevra votre motif et devra corriger la grille avant une nouvelle soumission.
        </p>
        <textarea
          className="mt-4 w-full rounded-lg bg-panel2 border border-line px-3.5 py-2.5 text-[13.5px] resize-none min-h-[110px] focus:border-brand outline-none placeholder:text-white/25"
          placeholder="Ex. : Conflit horaire le mercredi soir — décaler le Débrief CAN après le direct."
          value={commentaire}
          onChange={(e) => {
            setCommentaire(e.target.value);
            setErrRejet(null);
          }}
          autoFocus
        />
        {errRejet && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-danger">
            <AlertTriangle size={14} /> {errRejet}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <button onClick={() => setARejeter(null)} className="px-4 py-2 rounded-lg border border-line text-[13px] font-semibold text-white/60 hover:bg-panel3 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => void rejeter()}
            disabled={busyId === aRejeter?.id}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-danger hover:bg-red-700 text-white text-[13px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busyId === aRejeter?.id ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Rejeter avec ce motif
          </button>
        </div>
      </Modale>

      {/* ——— Suppression ——— */}
      <ConfirmModal
        ouvert={aSupprimer !== null}
        titre="Supprimer la grille"
        message={
          <>
            « <span className="font-bold text-white">{aSupprimer?.nom}</span> »{" "}
            {aSupprimer?.statut === "valide"
              ? "sera retirée de l'antenne : le Guide TV et le portail téléspectateur seront mis à jour immédiatement. "
              : "sera retirée de la file. "}
            Elle sera placée en corbeille.
          </>
        }
        confirmLabel="Supprimer"
        loading={busyId === aSupprimer?.id}
        onAnnuler={() => setASupprimer(null)}
        onConfirmer={() => void supprimer()}
      />

    </ConsoleShell>
  );
}

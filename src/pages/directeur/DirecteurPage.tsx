import { useMemo, useState } from "react";
import { AppShell, PastilleWs } from "../../components/layout/AppShell";
import { CategoriePuce, PastilleChaine, StatutBadge, TypeDiffusionBadge } from "../../components/grille/badges";
import { EtatVide, Icone, Modale, Spinner, TouchesBalafon, useToast } from "../../components/ui/kit";
import { useGrille } from "../../hooks/useGrille";
import { rejeterEmission, validerEmission } from "../../api";
import {
  JOURS_COURT,
  chevauche,
  fmtJourLong,
  fmtSemaine,
  isoJour,
  lundiDe,
  parseJour,
  toMin,
  type Emission,
} from "../../utils/epgHelpers";

export function DirecteurPage() {
  const { emissions, chaines, chargement, erreur, recharger, wsStatut } = useGrille();
  const toast = useToast();

  const [rejet, setRejet] = useState<Emission | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [errRejet, setErrRejet] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [jourIdx, setJourIdx] = useState((new Date().getDay() + 6) % 7);
  const [chaineFiltre, setChaineFiltre] = useState<string>("toutes");

  const lundi = lundiDe(new Date());
  const jours = Array.from({ length: 7 }, (_, i) => isoJour(new Date(lundi.getTime() + i * 86_400_000)));
  const jourSel = jours[jourIdx];
  const aujourdhui = isoJour(new Date());

  const pendantes = useMemo(
    () => emissions.filter((e) => e.statut === "en_attente_validation").sort((a, b) => a.jour.localeCompare(b.jour) || toMin(a.debut) - toMin(b.debut)),
    [emissions]
  );
  const validees = useMemo(() => emissions.filter((e) => e.statut === "valide" || e.statut === "diffusion"), [emissions]);

  /** Rapprochement client : même chaîne, même jour, créneau qui se chevauche. */
  const remplace = (p: Emission): Emission | undefined =>
    validees.find((v) => v.id !== p.id && chevauche(p, v));

  const valider = async (e: Emission) => {
    setEnCours(e.id);
    try {
      await validerEmission(e.id);
      toast.push({ type: "succes", titre: "Émission validée", message: `« ${e.titre} » entre en grille — la régie est notifiée en temps réel.` });
      await recharger();
    } catch (err) {
      toast.push({ type: "erreur", titre: "Validation impossible", message: err instanceof Error ? err.message : undefined });
    } finally {
      setEnCours(null);
    }
  };

  const rejeter = async () => {
    if (!rejet) return;
    if (commentaire.trim().length < 5) {
      setErrRejet("Merci d'indiquer un motif (5 caractères minimum).");
      return;
    }
    setEnCours(rejet.id);
    try {
      await rejeterEmission(rejet.id, commentaire.trim());
      toast.push({ type: "info", titre: "Proposition rejetée", message: `« ${rejet.titre} » retourne en brouillon avec votre commentaire.` });
      setRejet(null);
      setCommentaire("");
      setErrRejet(null);
      await recharger();
    } catch (err) {
      toast.push({ type: "erreur", titre: "Rejet impossible", message: err instanceof Error ? err.message : undefined });
    } finally {
      setEnCours(null);
    }
  };

  /* ——— Comparateur ——— */
  const comparer = useMemo(() => {
    const filtre = (e: Emission) => e.jour === jourSel && (chaineFiltre === "toutes" || e.chaine === chaineFiltre);
    const actuelles = validees.filter(filtre).sort((a, b) => toMin(a.debut) - toMin(b.debut));
    const propositions = pendantes.filter(filtre).sort((a, b) => toMin(a.debut) - toMin(b.debut));
    const remplacees = new Set(propositions.map((p) => remplace(p)?.id).filter(Boolean) as string[]);
    const apres = [
      ...actuelles.filter((v) => !remplacees.has(v.id)),
      ...propositions.map((p) => ({ ...p, statut: "valide" as const })),
    ].sort((a, b) => toMin(a.debut) - toMin(b.debut));
    return { actuelles, propositions, apres, remplacees };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validees, pendantes, jourSel, chaineFiltre]);

  return (
    <AppShell
      titre="Validation antenne"
      sousTitre={`${fmtSemaine(lundi)} · ${pendantes.length} proposition${pendantes.length > 1 ? "s" : ""} en attente`}
      actions={<PastilleWs statut={wsStatut} />}
    >
      <div className="px-5 sm:px-7 py-6 max-w-[1240px] mx-auto">
        {erreur && (
          <div className="mb-6 rounded-xl border border-live/25 bg-red-50 px-5 py-4 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-live flex items-center gap-2">
              <Icone name="cloud_off" size={18} /> {erreur}
            </p>
            <button onClick={() => void recharger()} className="text-[13px] font-bold underline underline-offset-2">Réessayer</button>
          </div>
        )}

        {/* ——— File de validation ——— */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display font-extrabold text-[19px] tracking-tight">Propositions de l'Administrateur</h2>
            {pendantes.length > 0 && (
              <span className="font-mono text-[11.5px] font-bold bg-warn text-white rounded-full px-2.5 py-1 animate-fade-in">
                {pendantes.length} en attente
              </span>
            )}
          </div>

          {chargement ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="h-[180px] rounded-xl bg-ink-100 animate-pulse" />
              ))}
            </div>
          ) : pendantes.length === 0 ? (
            <div className="rounded-xl border border-ink-100 bg-paper shadow-card">
              <EtatVide
                icone="fact_check"
                titre="Aucune proposition en attente"
                texte="Les nouvelles émissions soumises par l'Administrateur apparaîtront ici pour validation."
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {pendantes.map((p, i) => {
                const cible = remplace(p);
                const chaine = chaines.find((c) => c.id === p.chaine);
                return (
                  <article
                    key={p.id}
                    className="relative rounded-xl border border-amber-200 bg-paper shadow-card overflow-hidden animate-rise transition-shadow hover:shadow-pop"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-warn" />
                    <div className="p-5 pl-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display font-extrabold text-[17px] tracking-tight text-ink-900 leading-snug">{p.titre}</h3>
                          <p className="text-[12px] text-ink-400 font-mono mt-1 capitalize">
                            {fmtJourLong(p.jour)} · {p.debut} – {p.fin}
                          </p>
                        </div>
                        <StatutBadge statut="en_attente_validation" />
                      </div>

                      <p className="text-[13px] text-ink-500 leading-relaxed mt-2.5 line-clamp-2">{p.description}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {chaine && <PastilleChaine nom={chaine.nom} accent={chaine.accent} compact />}
                        <CategoriePuce categorie={p.categorie} compact />
                        <TypeDiffusionBadge type={p.type_diffusion} compact />
                      </div>

                      {/* Annotation diff */}
                      {cible ? (
                        <div className="mt-3.5 flex items-start gap-2 rounded-lg border border-warn/30 bg-amber-50 px-3 py-2.5">
                          <Icone name="compare_arrows" size={16} className="text-warn mt-0.5" />
                          <p className="text-[12px] text-ink-700 leading-snug">
                            <span className="font-bold text-warn">Remplace</span> « {cible.titre} » ({cible.debut} – {cible.fin}) sur le même créneau.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2.5">
                          <Icone name="add_circle" size={16} className="text-secondary-600" />
                          <p className="text-[12px] font-semibold text-secondary-700">Nouveau créneau — aucun chevauchement avec la grille validée.</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 mt-4">
                        <button
                          onClick={() => void valider(p)}
                          disabled={enCours === p.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-ok hover:brightness-110 text-white px-4 py-2 text-[13px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                        >
                          {enCours === p.id ? <Spinner size={15} /> : <Icone name="check" size={17} />} Valider
                        </button>
                        <button
                          onClick={() => {
                            setRejet(p);
                            setCommentaire("");
                            setErrRejet(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-live/30 text-live hover:bg-live/5 px-4 py-2 text-[13px] font-bold transition-colors"
                        >
                          <Icone name="close" size={17} /> Rejeter
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ——— Comparateur ——— */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display font-extrabold text-[19px] tracking-tight">Comparateur de grille</h2>
              <p className="text-[12.5px] text-ink-400 mt-1">Grille validée actuelle ↔ résultat si les propositions du jour sont validées.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={chaineFiltre}
                onChange={(e) => setChaineFiltre(e.target.value)}
                className="rounded-lg border border-ink-200 bg-paper px-3 py-2 text-[12.5px] font-semibold text-ink-700"
              >
                <option value="toutes">Toutes les chaînes</option>
                {chaines.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
            {jours.map((j, i) => {
              const d = parseJour(j);
              const nb = pendantes.filter((p) => p.jour === j).length;
              return (
                <button
                  key={j}
                  onClick={() => setJourIdx(i)}
                  className={`flex-none flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[12px] font-bold transition-colors ${
                    i === jourIdx ? "bg-ink-900 text-white border-ink-900" : "bg-paper text-ink-500 border-ink-200 hover:border-ink-300"
                  }`}
                >
                  {JOURS_COURT[i]} {d.getDate()}
                  {nb > 0 && <span className={`rounded-full px-1.5 text-[10px] font-mono ${i === jourIdx ? "bg-primary-500 text-white" : "bg-warn text-white"}`}>{nb}</span>}
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Actuelle */}
            <div className="rounded-xl border border-ink-100 bg-paper shadow-card">
              <header className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-[14px] tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-600" /> Grille validée — {jourSel === aujourdhui ? "aujourd'hui" : fmtJourLong(jourSel)}
                </h3>
                <span className="text-[11px] font-mono text-ink-400">{comparer.actuelles.length} créneaux</span>
              </header>
              <ul className="max-h-[420px] overflow-y-auto p-2">
                {comparer.actuelles.length === 0 && (
                  <li className="px-4 py-6 text-center text-[12.5px] text-ink-400">Aucune émission validée sur ce périmètre.</li>
                )}
                {comparer.actuelles.map((e) => {
                  const rempl = comparer.remplacees.has(e.id);
                  const prop = comparer.propositions.find((p) => remplace(p)?.id === e.id);
                  return (
                    <li
                      key={e.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${rempl ? "bg-amber-50 border border-amber-200" : "hover:bg-ink-50"}`}
                    >
                      <span className="font-mono text-[12px] font-bold text-ink-600 w-[92px] flex-none tabular-nums">
                        {e.debut} – {e.fin}
                      </span>
                      <span className={`flex-1 min-w-0 truncate text-[13px] font-semibold ${rempl ? "text-ink-400 line-through decoration-warn" : "text-ink-800"}`}>
                        {e.titre}
                      </span>
                      <span className="w-2 h-2 rounded-[3px] flex-none" style={{ background: chaines.find((c) => c.id === e.chaine)?.accent }} title={chaines.find((c) => c.id === e.chaine)?.nom} />
                      {rempl && prop && (
                        <span className="flex-none text-[10px] font-bold text-warn uppercase tracking-wide">← remplacée</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Après validation */}
            <div className="rounded-xl border border-ok/25 bg-paper shadow-card">
              <header className="px-5 py-3.5 border-b border-emerald-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-[14px] tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ok" /> Après validation des propositions
                </h3>
                <span className="text-[11px] font-mono text-ink-400">{comparer.apres.length} créneaux</span>
              </header>
              <ul className="max-h-[420px] overflow-y-auto p-2">
                {comparer.apres.length === 0 && (
                  <li className="px-4 py-6 text-center text-[12.5px] text-ink-400">Rien à afficher pour ce périmètre.</li>
                )}
                {comparer.apres.map((e) => {
                  const estProp = comparer.propositions.some((p) => p.id === e.id);
                  const cible = estProp ? remplace(e) : undefined;
                  return (
                    <li
                      key={e.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${estProp ? "bg-emerald-50 border border-ok/25" : "hover:bg-ink-50"}`}
                    >
                      <span className="font-mono text-[12px] font-bold text-ink-600 w-[92px] flex-none tabular-nums">
                        {e.debut} – {e.fin}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block truncate text-[13px] font-semibold ${estProp ? "text-ink-900" : "text-ink-800"}`}>{e.titre}</span>
                        {estProp && (
                          <span className="block text-[10.5px] text-ok font-bold">
                            {cible ? `Remplace « ${cible.titre} »` : "Nouveau créneau"}
                          </span>
                        )}
                      </span>
                      <span className="w-2 h-2 rounded-[3px] flex-none" style={{ background: chaines.find((c) => c.id === e.chaine)?.accent }} />
                      {estProp && <Icone name="fiber_new" size={15} className="text-ok flex-none" />}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <p className="flex items-center gap-2 text-[11.5px] text-ink-400 mt-3">
            <Icone name="info" size={14} />
            Rapprochement effectué par recoupement horaire (même chaîne, créneau qui se chevauche). Les suppressions pures ne sont pas détectables sans historique côté backend.
          </p>
        </section>

        {/* Pied de page signature */}
        <div className="mt-10 flex items-center gap-4 rounded-xl bg-ink-900 text-white px-6 py-5 overflow-hidden relative">
          <TouchesBalafon className="opacity-70" />
          <div>
            <p className="font-display font-extrabold text-[15px] tracking-tight">Circuit de validation Balafon+</p>
            <p className="text-[12.5px] text-white/55 mt-0.5">Brouillon → En attente → Validée → Diffusion. Chaque validation notifie la régie en temps réel.</p>
          </div>
        </div>
      </div>

      {/* ——— Modale de rejet ——— */}
      <Modale
        ouvert={rejet !== null}
        onFermer={() => setRejet(null)}
        titre="Rejeter la proposition"
        sousTitre={rejet ? `« ${rejet.titre} » — ${rejet.debut} – ${rejet.fin}` : undefined}
      >
        <p className="text-[13px] text-ink-500 leading-relaxed">
          L'émission retournera en <span className="font-bold text-ink-700">brouillon</span> chez l'Administrateur avec votre motif. Ce commentaire est obligatoire.
        </p>
        <textarea
          className="mt-4 w-full rounded-lg border border-ink-200 bg-paper px-3.5 py-2.5 text-[13.5px] resize-none focus:border-primary-500 min-h-[110px]"
          placeholder="Ex. : Créneau déjà couvert par le Journal de la Nuit — proposer après 23 h."
          value={commentaire}
          onChange={(e) => {
            setCommentaire(e.target.value);
            setErrRejet(null);
          }}
          autoFocus
        />
        {errRejet && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-live">
            <Icone name="error" size={15} /> {errRejet}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setRejet(null)}
            className="px-4 py-2 rounded-lg border border-ink-200 text-[13px] font-semibold text-ink-500 hover:bg-ink-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => void rejeter()}
            disabled={enCours === rejet?.id}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-live hover:bg-red-700 text-white text-[13px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {enCours === rejet?.id ? <Spinner size={15} /> : <Icone name="close" size={16} />} Rejeter avec ce motif
          </button>
        </div>
      </Modale>
    </AppShell>
  );
}

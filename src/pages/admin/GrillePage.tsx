import { useMemo, useState } from "react";
import { AppShell, PastilleWs } from "../../components/layout/AppShell";
import { GrilleHebdomadaire, LegendeGrille } from "../../components/grille/GrilleHebdomadaire";
import { EmissionEditorModal, type EditorResult } from "../../components/grille/EmissionEditorModal";
import { StatutBadge, PastilleChaine } from "../../components/grille/badges";
import { EtatVide, Icone, Spinner, useToast } from "../../components/ui/kit";
import { useGrille } from "../../hooks/useGrille";
import { createEmission, deleteEmission, soumettreEmission, updateEmission } from "../../api";
import {
  JOURS_COURT,
  addDays,
  fmtJourLong,
  fmtSemaine,
  isoJour,
  lundiDe,
  parseJour,
  toHHMM,
  toMin,
  type Emission,
} from "../../utils/epgHelpers";

interface EditorState {
  ouvert: boolean;
  emission: Emission | null;
  defauts?: Partial<EditorResult>;
}

export function GrillePage() {
  const { emissions, chaines, chargement, erreur, recharger, wsStatut } = useGrille();
  const toast = useToast();

  const [offsetSemaine, setOffsetSemaine] = useState(0);
  const [jourIdx, setJourIdx] = useState(() => (lundiDe(new Date()).getTime() === new Date(new Date().setHours(0, 0, 0, 0)).getTime() ? 0 : Math.min(6, Math.max(0, (new Date().getDay() + 6) % 7))));
  const [editor, setEditor] = useState<EditorState>({ ouvert: false, emission: null });
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const lundi = useMemo(() => addDays(lundiDe(new Date()), offsetSemaine * 7), [offsetSemaine]);
  const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => isoJour(addDays(lundi, i))), [lundi]);
  const jour = jours[jourIdx];
  const aujourdhui = isoJour(new Date());

  const brouillons = useMemo(
    () => emissions.filter((e) => e.statut === "brouillon").sort((a, b) => b.updated_at - a.updated_at),
    [emissions]
  );
  const enAttente = useMemo(
    () => emissions.filter((e) => e.statut === "en_attente_validation").sort((a, b) => b.updated_at - a.updated_at),
    [emissions]
  );

  const enregistrer = async (data: EditorResult) => {
    try {
      if (editor.emission) {
        await updateEmission(editor.emission.id, data);
        toast.push({ type: "succes", titre: "Émission mise à jour", message: `« ${data.titre} » — ${data.debut} – ${data.fin}` });
      } else {
        await createEmission({ ...data, statut: "brouillon" });
        toast.push({ type: "succes", titre: "Émission créée", message: `Brouillon ajouté sur ${chaines.find((c) => c.id === data.chaine)?.nom ?? ""}.` });
      }
      setEditor({ ouvert: false, emission: null });
      await recharger();
    } catch (e) {
      toast.push({ type: "erreur", titre: "Enregistrement impossible", message: e instanceof Error ? e.message : undefined });
    }
  };

  const supprimer = async (id: string) => {
    try {
      await deleteEmission(id);
      toast.push({ type: "info", titre: "Émission supprimée" });
      setEditor({ ouvert: false, emission: null });
      await recharger();
    } catch (e) {
      toast.push({ type: "erreur", titre: "Suppression impossible", message: e instanceof Error ? e.message : undefined });
    }
  };

  const soumettre = async (id: string) => {
    setActionEnCours(id);
    try {
      const em = await soumettreEmission(id);
      toast.push({ type: "succes", titre: "Soumise pour validation", message: `« ${em.titre} » attend la Direction d'Antenne.` });
      setEditor({ ouvert: false, emission: null });
      await recharger();
    } catch (e) {
      toast.push({ type: "erreur", titre: "Soumission impossible", message: e instanceof Error ? e.message : undefined });
    } finally {
      setActionEnCours(null);
    }
  };

  const retirer = async (id: string) => {
    setActionEnCours(id);
    try {
      await updateEmission(id, { statut: "brouillon" });
      toast.push({ type: "info", titre: "Proposition retirée", message: "L'émission repasse en brouillon." });
      await recharger();
    } finally {
      setActionEnCours(null);
    }
  };

  return (
    <AppShell titre="Éditeur de grille" sousTitre={`${fmtSemaine(lundi)} · hebdomadaire`} actions={<PastilleWs statut={wsStatut} />}>
      <div className="px-5 sm:px-7 py-6 max-w-[1320px] mx-auto">
        {/* ——— Barre d'outils ——— */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffsetSemaine((o) => o - 1)}
              className="grid place-items-center w-9 h-9 rounded-lg border border-ink-200 bg-paper text-ink-500 hover:text-ink-900 hover:border-ink-300 transition-colors"
              aria-label="Semaine précédente"
            >
              <Icone name="chevron_left" size={19} />
            </button>
            <button
              onClick={() => {
                setOffsetSemaine(0);
                setJourIdx((new Date().getDay() + 6) % 7);
              }}
              className={`px-3.5 h-9 rounded-lg border text-[12.5px] font-bold transition-colors ${
                offsetSemaine === 0
                  ? "bg-ink-900 text-white border-ink-900"
                  : "bg-paper text-ink-500 border-ink-200 hover:border-ink-300"
              }`}
            >
              {offsetSemaine === 0 ? "Semaine courante" : "Revenir à aujourd'hui"}
            </button>
            <button
              onClick={() => setOffsetSemaine((o) => o + 1)}
              className="grid place-items-center w-9 h-9 rounded-lg border border-ink-200 bg-paper text-ink-500 hover:text-ink-900 hover:border-ink-300 transition-colors"
              aria-label="Semaine suivante"
            >
              <Icone name="chevron_right" size={19} />
            </button>
          </div>

          <button
            onClick={() => setEditor({ ouvert: true, emission: null, defauts: { jour, chaine: chaines[0]?.id, debut: "20:00", fin: "21:00" } })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-4 h-10 text-[13.5px] font-bold transition-all active:scale-[0.98]"
          >
            <Icone name="add" size={18} /> Nouvelle émission
          </button>
        </div>

        {/* ——— Onglets de jours ——— */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
          {jours.map((j, i) => {
            const d = parseJour(j);
            const actif = i === jourIdx;
            const estAuj = j === aujourdhui;
            return (
              <button
                key={j}
                onClick={() => setJourIdx(i)}
                className={`flex-none flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                  actif ? "bg-ink-900 text-white border-ink-900 shadow-card" : "bg-paper text-ink-500 border-ink-200 hover:border-ink-300"
                }`}
              >
                <span className={`font-display font-extrabold text-[17px] leading-none ${actif ? "text-white" : estAuj ? "text-primary-600" : "text-ink-700"}`}>
                  {d.getDate()}
                </span>
                <span className="leading-tight">
                  <span className={`block text-[11px] font-bold ${actif ? "text-white" : "text-ink-600"}`}>{JOURS_COURT[i]}</span>
                  <span className={`block text-[9.5px] capitalize ${actif ? "text-white/60" : "text-ink-400"}`}>
                    {estAuj ? "aujourd'hui" : d.toLocaleDateString("fr-FR", { month: "short" })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ——— Grille ——— */}
        <div className="animate-rise">
          {chargement ? (
            <div className="rounded-xl border border-ink-100 bg-paper p-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[74px] rounded-lg bg-ink-100 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          ) : erreur ? (
            <div className="rounded-xl border border-live/25 bg-red-50 px-6 py-8 text-center">
              <p className="text-[14px] font-bold text-live">{erreur}</p>
              <button onClick={() => void recharger()} className="mt-3 text-[13px] font-bold underline underline-offset-2 text-ink-700">
                Réessayer
              </button>
            </div>
          ) : (
            <GrilleHebdomadaire
              jour={jour}
              chaines={chaines}
              emissions={emissions}
              onCreer={(chaineId, debut) =>
                setEditor({
                  ouvert: true,
                  emission: null,
                  defauts: { jour, chaine: chaineId, debut, fin: toHHMM(Math.min(toMin(debut) + 60, 1439)) },
                })
              }
              onEditer={(em) => setEditor({ ouvert: true, emission: em })}
            />
          )}
        </div>

        <div className="mt-4">
          <LegendeGrille />
        </div>

        {/* ——— Flux de validation ——— */}
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <section className="rounded-xl border border-ink-100 bg-paper shadow-card">
            <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink-100">
              <h2 className="font-display font-extrabold text-[15px] tracking-tight flex items-center gap-2">
                <Icone name="edit_note" size={18} className="text-ink-400" /> Brouillons
                <span className="text-[11px] font-mono font-bold bg-ink-100 text-ink-500 rounded-full px-2 py-0.5">{brouillons.length}</span>
              </h2>
            </header>
            {brouillons.length === 0 ? (
              <EtatVide icone="drafts" titre="Aucun brouillon" texte="Créez une émission puis soumettez-la à la validation." />
            ) : (
              <ul className="p-2.5 space-y-1.5">
                {brouillons.map((e) => (
                  <li key={e.id} className="rounded-lg border border-ink-100 hover:border-ink-200 hover:shadow-card transition-all px-3.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button onClick={() => setEditor({ ouvert: true, emission: e })} className="text-[13.5px] font-bold text-ink-800 hover:text-primary-700 transition-colors text-left truncate block max-w-full">
                          {e.titre}
                        </button>
                        <p className="text-[11px] text-ink-400 font-mono mt-0.5">
                          {fmtJourLong(e.jour)} · {e.debut} – {e.fin}
                        </p>
                        <div className="mt-1.5">
                          <PastilleChaine nom={chaines.find((c) => c.id === e.chaine)?.nom ?? ""} accent={chaines.find((c) => c.id === e.chaine)?.accent ?? "#888"} compact />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-none">
                        <StatutBadge statut="brouillon" compact />
                        <button
                          onClick={() => void soumettre(e.id)}
                          disabled={actionEnCours === e.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-600 hover:bg-secondary-700 text-white text-[11.5px] font-bold px-3 py-1.5 transition-all active:scale-[0.97] disabled:opacity-60"
                        >
                          {actionEnCours === e.id ? <Spinner size={12} /> : <Icone name="send" size={13} />} Soumettre
                        </button>
                      </div>
                    </div>
                    {e.commentaire_rejet && (
                      <p className="mt-2 text-[11.5px] text-live bg-live/5 border border-live/20 rounded-md px-2.5 py-1.5 flex items-start gap-1.5">
                        <Icone name="undo" size={13} className="mt-0.5 flex-none" /> {e.commentaire_rejet}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-amber-200 bg-paper shadow-card">
            <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-amber-100">
              <h2 className="font-display font-extrabold text-[15px] tracking-tight flex items-center gap-2">
                <Icone name="hourglass_top" size={18} className="text-warn" /> En attente de validation
                <span className="text-[11px] font-mono font-bold bg-amber-100 text-warn rounded-full px-2 py-0.5">{enAttente.length}</span>
              </h2>
            </header>
            {enAttente.length === 0 ? (
              <EtatVide icone="fact_check" titre="Rien à valider" texte="Aucune émission en attente chez la Direction d'Antenne." />
            ) : (
              <ul className="p-2.5 space-y-1.5">
                {enAttente.map((e) => (
                  <li key={e.id} className="rounded-lg border border-amber-100 hover:shadow-card transition-all px-3.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button onClick={() => setEditor({ ouvert: true, emission: e })} className="text-[13.5px] font-bold text-ink-800 hover:text-primary-700 transition-colors text-left truncate block max-w-full">
                          {e.titre}
                        </button>
                        <p className="text-[11px] text-ink-400 font-mono mt-0.5">
                          {fmtJourLong(e.jour)} · {e.debut} – {e.fin}
                        </p>
                        <div className="mt-1.5">
                          <PastilleChaine nom={chaines.find((c) => c.id === e.chaine)?.nom ?? ""} accent={chaines.find((c) => c.id === e.chaine)?.accent ?? "#888"} compact />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-none">
                        <StatutBadge statut="en_attente_validation" compact />
                        <button
                          onClick={() => void retirer(e.id)}
                          disabled={actionEnCours === e.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 hover:bg-ink-50 text-ink-500 text-[11.5px] font-bold px-3 py-1.5 transition-colors disabled:opacity-60"
                        >
                          {actionEnCours === e.id ? <Spinner size={12} /> : <Icone name="undo" size={13} />} Retirer
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <EmissionEditorModal
        ouvert={editor.ouvert}
        emission={editor.emission}
        defauts={editor.defauts}
        chaines={chaines}
        emissions={emissions}
        onFermer={() => setEditor({ ouvert: false, emission: null })}
        onEnregistrer={enregistrer}
        onSupprimer={supprimer}
        onSoumettre={soumettre}
        peutSoumettre
      />
    </AppShell>
  );
}

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import type { Categorie, Emission, Grille, TypeDiffusion } from "../types";
import { CATS, IMG, TYPES, chaineDe } from "../data/mock";
import { useApp } from "../context/AppContext";
import * as storage from "../services/storage";
import {
  JOURS_COURT,
  conflitsDe,
  couvertureJour,
  couvertureMoyenne,
  chevauche,
  finEnMin,
  fmtJour,
  joursSemaine,
  parseJour,
  toMin,
} from "../utils/epg";
import { ConfirmModal, Modale, StatutBadge, useToast } from "./ui";

const CHOIX_IMAGES: { label: string; value?: string }[] = [
  { label: "Aucune affiche" },
  { label: "Visuel Concert", value: IMG.concert },
  { label: "Visuel Football", value: IMG.foot },
  { label: "Visuel Série", value: IMG.drama },
];

/* ——— Formulaire d'émission (ajout / modification) ——— */

export function EmissionFormModal({
  grille,
  emission,
  ouvert,
  onFermer,
}: {
  grille: Grille;
  emission: Emission | null;
  ouvert: boolean;
  onFermer: () => void;
}) {
  const { user } = useApp();
  const toast = useToast();
  const jours = useMemo(() => joursSemaine(grille.semaineDebut), [grille.semaineDebut]);

  const [form, setForm] = useState(() => ({
    titre: emission?.titre ?? "",
    jour: emission?.jour ?? jours[0],
    debut: emission?.debut ?? "20:00",
    fin: emission?.fin ?? "21:00",
    categorie: (emission?.categorie ?? "divertissement") as Categorie,
    type: (emission?.type ?? "enregistre") as TypeDiffusion,
    description: emission?.description ?? "",
    image: emission?.image ?? "",
  }));
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErreur(null);
  };

  const enregistrer = async () => {
    if (form.titre.trim().length < 2) return setErreur("Le titre est obligatoire.");
    const fin = toMin(form.fin) === 0 ? 1440 : toMin(form.fin);
    if (fin <= toMin(form.debut)) return setErreur("La fin doit être postérieure au début.");
    const candidate: Emission = {
      id: emission?.id ?? "__new__",
      titre: form.titre.trim(),
      jour: form.jour,
      debut: form.debut,
      fin: form.fin,
      categorie: form.categorie,
      type: form.type,
      description: form.description.trim() || CATS[form.categorie].label,
      image: form.image || undefined,
    };
    const conflit = grille.emissions.find((e) => e.id !== candidate.id && chevauche(e, candidate));
    if (conflit) {
      return setErreur(`Conflit horaire avec « ${conflit.titre} » (${conflit.debut} – ${conflit.fin}) le ${fmtJour(form.jour)}.`);
    }
    setBusy(true);
    try {
      if (emission) {
        await storage.majEmission(grille.id, emission.id, candidate, user!);
        toast.push({ type: "succes", titre: "Émission mise à jour", message: candidate.titre });
      } else {
        const { id: _id, ...reste } = candidate;
        void _id;
        await storage.ajouterEmission(grille.id, reste, user!);
        toast.push({ type: "succes", titre: "Émission ajoutée à la grille", message: `${candidate.titre} · ${candidate.debut} – ${candidate.fin}` });
      }
      onFermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-lg bg-panel2 border border-line px-3.5 py-2.5 text-[13.5px] font-medium text-white placeholder:text-white/25 focus:border-brand transition-colors";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-white/35 mb-1.5";

  return (
    <Modale
      ouvert={ouvert}
      onFermer={onFermer}
      titre={emission ? "Modifier l'émission" : "Ajouter une émission"}
      sousTitre={`${grille.nom} · ${chaineDe(grille.chaineId).nom}`}
      footer={
        <div className="flex justify-end gap-2.5">
          <button onClick={onFermer} className="px-4 py-2 rounded-lg border border-line text-[13px] font-semibold text-white/60 hover:bg-panel3 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => void enregistrer()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand2 text-white text-[13px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {emission ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Titre de l'émission</label>
          <input className={inputCls} value={form.titre} onChange={(e) => set({ titre: e.target.value })} placeholder="Ex. : Grande soirée Makossa" autoFocus />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Jour</label>
            <select className={inputCls} value={form.jour} onChange={(e) => set({ jour: e.target.value })}>
              {jours.map((j, i) => (
                <option key={j} value={j} className="bg-panel">
                  {JOURS_COURT[i]} {(parseJour(j).getDate() + "").padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Début</label>
            <input type="time" className={`${inputCls} font-mono`} value={form.debut} onChange={(e) => set({ debut: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Fin</label>
            <input type="time" className={`${inputCls} font-mono`} value={form.fin} onChange={(e) => set({ fin: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Catégorie</label>
            <select className={inputCls} value={form.categorie} onChange={(e) => set({ categorie: e.target.value as Categorie })}>
              {Object.entries(CATS).map(([k, c]) => (
                <option key={k} value={k} className="bg-panel">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Type de diffusion</label>
            <select className={inputCls} value={form.type} onChange={(e) => set({ type: e.target.value as TypeDiffusion })}>
              {Object.entries(TYPES).map(([k, t]) => (
                <option key={k} value={k} className="bg-panel">
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Affiche (depuis le Stockage)</label>
          <div className="grid grid-cols-4 gap-2">
            {CHOIX_IMAGES.map((c) => (
              <button
                key={c.label}
                onClick={() => set({ image: c.value ?? "" })}
                className={`relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${
                  (form.image ?? "") === (c.value ?? "") ? "border-brand scale-[1.02]" : "border-line hover:border-line2"
                }`}
                title={c.label}
              >
                {c.value ? (
                  <img src={c.value} alt={c.label} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full grid place-items-center bg-panel2 text-white/25">
                    <ImageIcon size={18} />
                  </span>
                )}
                {(form.image ?? "") === (c.value ?? "") && (
                  <span className="absolute top-1 right-1 grid place-items-center w-4.5 h-4.5 w-5 h-5 rounded-full bg-brand text-white">
                    <CheckCircle2 size={12} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={`${inputCls} min-h-[74px] resize-none`}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Quelques mots pour le Guide TV…"
          />
        </div>
        {erreur && (
          <p className="flex items-start gap-2 text-[12.5px] font-semibold text-danger bg-danger/10 border border-danger/25 rounded-lg px-3 py-2.5 animate-fade">
            <AlertTriangle size={15} className="mt-0.5 flex-none" /> {erreur}
          </p>
        )}
      </div>
    </Modale>
  );
}

/* ——— Éditeur de grille (partagé Directeur / Régie) ——— */

export function GrilleEditorModal({
  grille,
  ouvert,
  onFermer,
  peutSoumettre = false,
}: {
  grille: Grille | null;
  ouvert: boolean;
  onFermer: () => void;
  peutSoumettre?: boolean;
}) {
  const { user } = useApp();
  const toast = useToast();
  const [formEmission, setFormEmission] = useState<{ ouvert: boolean; emission: Emission | null }>({ ouvert: false, emission: null });
  const [aSupprimer, setASupprimer] = useState<Emission | null>(null);
  const [busy, setBusy] = useState(false);

  if (!grille) return null;
  const chaine = chaineDe(grille.chaineId);
  const jours = joursSemaine(grille.semaineDebut);
  const conflits = conflitsDe(grille);
  const idsEnConflit = new Set(conflits.flatMap(([a, b]) => [a.id, b.id]));

  const soumettre = async () => {
    setBusy(true);
    try {
      await storage.soumettreGrille(grille.id, user!);
      toast.push({
        type: "succes",
        titre: "Grille soumise à la Régie",
        message: `« ${grille.nom} » passe en attente de validation.`,
      });
      onFermer();
    } catch (e) {
      toast.push({ type: "erreur", titre: "Soumission impossible", message: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const retirer = async (e: Emission) => {
    try {
      await storage.retirerEmission(grille.id, e.id, user!);
      toast.push({ type: "info", titre: "Émission retirée", message: e.titre });
      setASupprimer(null);
    } catch (err) {
      toast.push({ type: "erreur", titre: "Suppression impossible", message: err instanceof Error ? err.message : undefined });
    }
  };

  return (
    <>
      <Modale
        ouvert={ouvert}
        onFermer={onFermer}
        titre={grille.nom}
        sousTitre={`${chaine.nom} · ${grille.emissions.length} émission${grille.emissions.length > 1 ? "s" : ""} · créée par ${grille.creePar}`}
        largeur="max-w-3xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StatutBadge statut={grille.statut} compact />
              <span className="text-[11.5px] text-white/40">
                Couverture moyenne : <span className="font-mono font-bold text-white/70">{couvertureMoyenne(grille)}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setFormEmission({ ouvert: true, emission: null })}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-line text-[13px] font-semibold text-white/70 hover:bg-panel3 transition-colors"
              >
                <Plus size={15} /> Ajouter une émission
              </button>
              {peutSoumettre && grille.statut === "brouillon" && (
                <button
                  onClick={() => void soumettre()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand2 text-white text-[13px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Soumettre à la Régie
                </button>
              )}
            </div>
          </div>
        }
      >
        {grille.commentaireRejet && (
          <p className="mb-4 flex items-start gap-2.5 text-[12.5px] text-danger bg-danger/10 border border-danger/25 rounded-lg px-3.5 py-3">
            <AlertTriangle size={16} className="mt-0.5 flex-none" />
            <span>
              <span className="font-bold">Rejetée par la Régie :</span> {grille.commentaireRejet}
            </span>
          </p>
        )}
        {conflits.length > 0 && (
          <p className="mb-4 flex items-start gap-2.5 text-[12.5px] text-warn bg-warn/10 border border-warn/25 rounded-lg px-3.5 py-3">
            <AlertTriangle size={16} className="mt-0.5 flex-none" />
            <span>
              <span className="font-bold">{conflits.length} conflit{conflits.length > 1 ? "s" : ""} horaire{conflits.length > 1 ? "s" : ""} détecté{conflits.length > 1 ? "s" : ""}.</span>{" "}
              La Régie risque de rejeter la grille — corrigez les créneaux en surbrillance.
            </span>
          </p>
        )}

        <div className="space-y-5">
          {jours.map((jour, i) => {
            const liste = grille.emissions.filter((e) => e.jour === jour).sort((a, b) => toMin(a.debut) - toMin(b.debut));
            return (
              <div key={jour}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-white/45">
                    <CalendarDays size={13} className="text-brand" />
                    {fmtJour(jour)}
                    <span className="font-mono text-[10px] text-white/25">({JOURS_COURT[i]} · couv. {couvertureJour(grille, jour)}%)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-white/30">{liste.length} émission{liste.length > 1 ? "s" : ""}</span>
                </div>
                {liste.length === 0 ? (
                  <p className="text-[12px] text-white/25 border border-dashed border-line rounded-lg px-3.5 py-3">
                    Aucun programme — trou d'antenne sur cette journée.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {liste.map((e) => {
                      const cat = CATS[e.categorie];
                      const enConflit = idsEnConflit.has(e.id);
                      return (
                        <li
                          key={e.id}
                          className={`group flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                            enConflit ? "border-warn/40 bg-warn/[0.06]" : "border-line bg-panel2 hover:border-line2"
                          }`}
                        >
                          <span className="font-mono text-[12px] font-bold text-white/75 w-[92px] flex-none tabular-nums">
                            {e.debut} – {e.fin}
                          </span>
                          <span className="w-[3px] self-stretch rounded-full flex-none" style={{ background: cat.color }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold truncate">
                              {e.titre}
                              {enConflit && <AlertTriangle size={12} className="inline ml-1.5 text-warn" />}
                            </p>
                            <p className="text-[10.5px] text-white/35">
                              {cat.label} · {TYPES[e.type].label}
                            </p>
                          </div>
                          {e.image && <img src={e.image} alt="" className="w-7 h-10 object-cover rounded flex-none" />}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-none">
                            <button
                              onClick={() => setFormEmission({ ouvert: true, emission: e })}
                              className="grid place-items-center w-7 h-7 rounded-md text-white/45 hover:text-white hover:bg-panel3 transition-colors"
                              title="Modifier"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setASupprimer(e)}
                              className="grid place-items-center w-7 h-7 rounded-md text-white/45 hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Modale>

      {formEmission.ouvert && (
        <EmissionFormModal
          grille={grille}
          emission={formEmission.emission}
          ouvert={formEmission.ouvert}
          onFermer={() => setFormEmission({ ouvert: false, emission: null })}
        />
      )}

      <ConfirmModal
        ouvert={aSupprimer !== null}
        titre="Supprimer l'émission"
        message={
          <>
            « <span className="font-bold text-white">{aSupprimer?.titre}</span> » ({aSupprimer?.debut} – {aSupprimer?.fin}) sera retirée de la grille. Cette action est journalisée.
          </>
        }
        confirmLabel="Supprimer"
        onAnnuler={() => setASupprimer(null)}
        onConfirmer={() => aSupprimer && void retirer(aSupprimer)}
      />
    </>
  );
}

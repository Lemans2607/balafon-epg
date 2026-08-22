import { useEffect, useMemo, useState } from "react";
import type { Chaine, Categorie, Emission, Emission as _E, TypeDiffusion } from "../../utils/epgHelpers";
import { CATEGORIES, TYPES_DIFFUSION, conflitsDe, fmtJourLong, toMin, finEnMin } from "../../utils/epgHelpers";
import { Modale, Icone, Spinner } from "../ui/kit";
import { CategoriePuce } from "./badges";

export interface EditorResult {
  titre: string;
  chaine: string;
  jour: string;
  debut: string;
  fin: string;
  categorie: Categorie;
  type_diffusion: TypeDiffusion;
  description: string;
}

export function EmissionEditorModal({
  ouvert,
  emission,
  chaines,
  emissions,
  defauts,
  onFermer,
  onEnregistrer,
  onSupprimer,
  onSoumettre,
  peutSoumettre = false,
}: {
  ouvert: boolean;
  emission: Emission | null;
  chaines: Chaine[];
  emissions: Emission[];
  defauts?: Partial<EditorResult>;
  onFermer: () => void;
  onEnregistrer: (data: EditorResult) => Promise<void>;
  onSupprimer?: (id: string) => Promise<void>;
  onSoumettre?: (id: string) => Promise<void>;
  peutSoumettre?: boolean;
}) {
  const [form, setForm] = useState<EditorResult>({
    titre: "",
    chaine: chaines[0]?.id ?? "",
    jour: new Date().toISOString().slice(0, 10),
    debut: "20:00",
    fin: "21:00",
    categorie: "information",
    type_diffusion: "enregistre",
    description: "",
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [confirmSuppr, setConfirmSuppr] = useState(false);
  const [soumission, setSoumission] = useState(false);
  const [secousse, setSecousse] = useState(0);

  useEffect(() => {
    if (!ouvert) return;
    setErreur(null);
    setConfirmSuppr(false);
    setEnregistrement(false);
    if (emission) {
      setForm({
        titre: emission.titre,
        chaine: emission.chaine,
        jour: emission.jour,
        debut: emission.debut,
        fin: emission.fin,
        categorie: emission.categorie,
        type_diffusion: emission.type_diffusion,
        description: emission.description,
      });
    } else {
      setForm((f) => ({ ...f, ...defauts, titre: "", description: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, emission]);

  const enLecture = emission !== null && emission.statut !== "brouillon";
  const chaineNom = chaines.find((c) => c.id === form.chaine)?.nom ?? form.chaine;

  const conflits = useMemo(() => {
    const candidate: Emission = {
      ...(emission ?? { id: "__nouvelle__", statut: "brouillon", commentaire_rejet: undefined, updated_at: 0 }),
      ...form,
    };
    return conflitsDe(candidate, emissions);
  }, [emission, form, emissions]);

  const champ = (patch: Partial<EditorResult>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErreur(null);
  };

  const enregistrer = async () => {
    if (!form.titre.trim()) {
      setErreur("Le titre est obligatoire.");
      setSecousse((s) => s + 1);
      return;
    }
    if (finEnMin({ fin: form.fin } as _E) <= toMin(form.debut)) {
      setErreur("L'heure de fin doit être après l'heure de début.");
      setSecousse((s) => s + 1);
      return;
    }
    if (conflits.length > 0) {
      setErreur(
        `Conflit horaire sur ${chaineNom} : « ${conflits[0].titre} » (${conflits[0].debut} – ${conflits[0].fin}). Ajustez le créneau.`
      );
      setSecousse((s) => s + 1);
      return;
    }
    setEnregistrement(true);
    try {
      await onEnregistrer(form);
    } finally {
      setEnregistrement(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-ink-200 bg-paper px-3 py-2 text-[13.5px] font-medium text-ink-900 placeholder:text-ink-300 transition-colors focus:border-primary-500 disabled:bg-ink-50 disabled:text-ink-400";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5";

  return (
    <Modale
      ouvert={ouvert}
      onFermer={onFermer}
      titre={emission ? "Modifier l'émission" : "Nouvelle émission"}
      sousTitre={
        emission
          ? `${fmtJourLong(emission.jour)} · ${emission.statut === "brouillon" ? "modifiable" : "verrouillée — déjà soumise ou validée"}`
          : `Créneau sur ${chaineNom}`
      }
      largeur="max-w-xl"
    >
      <div key={secousse} className={secousse > 0 && erreur ? "animate-shake" : ""}>
        {emission?.commentaire_rejet && (
          <div className="flex items-start gap-2.5 rounded-lg border border-live/25 bg-live/5 px-3.5 py-3 mb-5">
            <Icone name="undo" size={17} className="text-live mt-0.5" />
            <div className="text-[12.5px]">
              <p className="font-bold text-live">Rejetée par la Direction d'Antenne</p>
              <p className="text-ink-600 mt-0.5">{emission.commentaire_rejet}</p>
            </div>
          </div>
        )}

        {enLecture && (
          <div className="flex items-center gap-2.5 rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5 mb-5 text-[12.5px] text-ink-500">
            <Icone name="lock" size={16} />
            Émission {emission?.statut === "valide" || emission?.statut === "diffusion" ? "validée" : "en attente de validation"} — lecture seule.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Titre de l'émission</label>
            <input
              className={inputCls}
              value={form.titre}
              onChange={(e) => champ({ titre: e.target.value })}
              placeholder="Ex. : Grand Débat Citoyen"
              disabled={enLecture}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Chaîne</label>
            <select className={inputCls} value={form.chaine} onChange={(e) => champ({ chaine: e.target.value })} disabled={enLecture}>
              {chaines.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Jour de diffusion</label>
            <input type="date" className={inputCls} value={form.jour} onChange={(e) => champ({ jour: e.target.value })} disabled={enLecture} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Début</label>
              <input type="time" className={inputCls} value={form.debut} onChange={(e) => champ({ debut: e.target.value })} disabled={enLecture} />
            </div>
            <div>
              <label className={labelCls}>Fin</label>
              <input type="time" className={inputCls} value={form.fin} onChange={(e) => champ({ fin: e.target.value })} disabled={enLecture} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Type de diffusion</label>
            <div className="flex rounded-lg border border-ink-200 overflow-hidden">
              {(Object.keys(TYPES_DIFFUSION) as TypeDiffusion[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={enLecture}
                  onClick={() => champ({ type_diffusion: t })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11.5px] font-semibold transition-colors ${
                    form.type_diffusion === t
                      ? t === "direct"
                        ? "bg-live text-white"
                        : "bg-ink-900 text-white"
                      : "bg-paper text-ink-500 hover:bg-ink-50"
                  }`}
                >
                  <Icone name={TYPES_DIFFUSION[t].icon} size={13} filled={t === "direct" && form.type_diffusion === t} />
                  {TYPES_DIFFUSION[t].short}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORIES) as Categorie[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={enLecture}
                  onClick={() => champ({ categorie: c })}
                  className={`transition-all duration-150 rounded-full ${
                    form.categorie === c ? "ring-2 ring-offset-1 ring-ink-900 scale-[1.03]" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <CategoriePuce categorie={c} />
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => champ({ description: e.target.value })}
              placeholder="Synopsis, invités, conducteur…"
              disabled={enLecture}
            />
          </div>
        </div>

        {conflits.length > 0 && !enLecture && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-warn/30 bg-amber-50 px-3.5 py-3">
            <Icone name="warning" size={17} className="text-warn mt-0.5" />
            <div className="text-[12.5px] text-ink-700">
              <p className="font-bold text-warn">Chevauchement détecté sur {chaineNom}</p>
              <p className="mt-0.5">
                {conflits.map((c) => `« ${c.titre} » (${c.debut} – ${c.fin})`).join(", ")}
              </p>
            </div>
          </div>
        )}

        {erreur && (
          <p className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-live">
            <Icone name="error" size={16} /> {erreur}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {emission && onSupprimer && !enLecture && (
              confirmSuppr ? (
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-live animate-fade-in">
                  Supprimer définitivement ?
                  <button
                    onClick={async () => {
                      setSuppression(true);
                      try {
                        await onSupprimer(emission.id);
                      } finally {
                        setSuppression(false);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-live text-white hover:bg-red-700 transition-colors"
                  >
                    {suppression ? <Spinner size={14} /> : "Oui, supprimer"}
                  </button>
                  <button onClick={() => setConfirmSuppr(false)} className="px-2.5 py-1.5 rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 transition-colors">
                    Non
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmSuppr(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-live border border-live/25 hover:bg-live/5 transition-colors"
                >
                  <Icone name="delete" size={16} /> Supprimer
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onFermer}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-ink-500 border border-ink-200 hover:bg-ink-50 transition-colors"
            >
              {enLecture ? "Fermer" : "Annuler"}
            </button>
            {!enLecture && (
              <button
                onClick={enregistrer}
                disabled={enregistrement}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-[13px] font-bold hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {enregistrement ? <Spinner size={15} /> : <Icone name="save" size={16} />}
                {emission ? "Enregistrer" : "Créer l'émission"}
              </button>
            )}
            {emission && peutSoumettre && !enLecture && onSoumettre && (
              <button
                onClick={async () => {
                  setSoumission(true);
                  try {
                    await onSoumettre(emission.id);
                  } finally {
                    setSoumission(false);
                  }
                }}
                disabled={soumission}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-600 text-white text-[13px] font-bold hover:bg-secondary-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {soumission ? <Spinner size={15} /> : <Icone name="send" size={15} />}
                Soumettre
              </button>
            )}
          </div>
        </div>
      </div>
    </Modale>
  );
}

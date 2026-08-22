import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  Film,
  Flame,
  Image as ImageIcon,
  Inbox,
  LayoutGrid,
  Library,
  Loader2,
  Music,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { Grille, MediaItem, MediaType } from "../types";
import { CHAINES, chaineDe } from "../data/mock";
import { useApp } from "../context/AppContext";
import * as storage from "../services/storage";
import {
  addDays,
  conflitsDe,
  couvertureMoyenne,
  fmtSemaine,
  ilYa,
  isoJour,
  joursSemaine,
  lundiDe,
  parseJour,
} from "../utils/epg";
import { ConfirmModal, ConsoleShell, EtatVide, Modale, ProgressBar, StatutBadge, useToast } from "../components/ui";
import { GrilleEditorModal } from "../components/GrilleEditor";

type Tab = "grilles" | "medias" | "corbeille";

const MEDIA_ICON: Record<MediaType, typeof Film> = {
  video: Film,
  audio: Music,
  affiche: ImageIcon,
  "sous-titres": FileText,
};

const NOMS_DEMO = [
  "jt_20h_edition_speciale.mp4",
  "concert_bikutsi_captation.mov",
  "promo_can_2026_v3.mp4",
  "affiche_nuit_du_gospel.png",
  "sous_titres_fr_debat_32.srt",
  "documentaire_ngondo_4k.mov",
];

export function DirecteurDashboard() {
  const { user, grilles, corbeille, medias, pret } = useApp();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("grilles");
  const [recherche, setRecherche] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editeeId, setEditeeId] = useState<string | null>(null);
  const editee = grilles.find((g) => g.id === editeeId) ?? null;
  const [aSupprimer, setASupprimer] = useState<Grille | null>(null);
  const [aDetruire, setADetruire] = useState<Grille | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragActif, setDragActif] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => () => timers.current.forEach((t) => clearInterval(t)), []);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return q ? grilles.filter((g) => g.nom.toLowerCase().includes(q) || chaineDe(g.chaineId).nom.toLowerCase().includes(q)) : grilles;
  }, [grilles, recherche]);

  const stats = useMemo(() => {
    const brouillons = grilles.filter((g) => g.statut === "brouillon").length;
    const attente = grilles.filter((g) => g.statut === "en_attente").length;
    const validees = grilles.filter((g) => g.statut === "valide").length;
    const couv = grilles.length ? Math.round(grilles.reduce((s, g) => s + couvertureMoyenne(g), 0) / grilles.length) : 0;
    return { total: grilles.length, brouillons, attente, validees, couv };
  }, [grilles]);

  const soumettre = async (g: Grille) => {
    setBusyId(g.id);
    try {
      await storage.soumettreGrille(g.id, user!);
      toast.push({ type: "succes", titre: "Grille transmise à la Régie", message: `« ${g.nom} » est en attente de validation.` });
    } catch (e) {
      toast.push({ type: "erreur", titre: "Soumission impossible", message: e instanceof Error ? e.message : undefined });
    } finally {
      setBusyId(null);
    }
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await storage.supprimerGrille(aSupprimer.id, user!);
      toast.push({ type: "info", titre: "Grille supprimée", message: `« ${aSupprimer.nom} » a été déplacée vers la corbeille.` });
      setASupprimer(null);
    } catch (e) {
      toast.push({ type: "erreur", titre: "Suppression impossible", message: e instanceof Error ? e.message : undefined });
    }
  };

  const restaurer = async (g: Grille) => {
    await storage.restaurerGrille(g.id, user!);
    toast.push({ type: "succes", titre: "Grille restaurée", message: `« ${g.nom} » repasse en brouillon.` });
  };

  const detruire = async () => {
    if (!aDetruire) return;
    await storage.detruireGrille(aDetruire.id, user!);
    toast.push({ type: "alerte", titre: "Grille détruite", message: `« ${aDetruire.nom} » a été définitivement supprimée.` });
    setADetruire(null);
  };

  /* ——— Import de médias (Stockage simulé) ——— */

  const traiterFichiers = async (fichiers: FileList | File[]) => {
    const liste = Array.from(fichiers);
    if (liste.length === 0) return;
    toast.push({ type: "info", titre: `Import de ${liste.length} média${liste.length > 1 ? "s" : ""}`, message: "Transfert vers le système de Stockage…" });
    for (const f of liste) {
      const ext = (f.name.split(".").pop() ?? "").toLowerCase();
      const type: MediaType = ["mp4", "mov", "mkv", "avi"].includes(ext)
        ? "video"
        : ["mp3", "wav", "aac"].includes(ext)
        ? "audio"
        : ["png", "jpg", "jpeg", "webp"].includes(ext)
        ? "affiche"
        : "sous-titres";
      const tailleMo = Math.max(1, Math.round(f.size / 1_048_576));
      const item = await storage.importerMedia({ nom: f.name, type, tailleMo }, user!);
      lancerTranscodage(item);
    }
  };

  const lancerTranscodage = (item: MediaItem) => {
    let pct = item.progression;
    const t = setInterval(() => {
      pct += 6 + Math.random() * 12;
      if (pct >= 100) {
        clearInterval(t);
        timers.current.delete(item.id);
        storage.finaliserMedia(item.id);
        toast.push({ type: "succes", titre: "Média prêt à la diffusion", message: item.nom });
      } else {
        storage.avancerTranscodage(item.id, Math.round(pct));
      }
    }, 220);
    timers.current.set(item.id, t);
  };

  const importDemo = () => {
    const nom = NOMS_DEMO[Math.floor(Math.random() * NOMS_DEMO.length)];
    const faux = new File([new Blob(["x".repeat(2_400_000)])], nom, { type: "application/octet-stream" });
    void traiterFichiers([faux]);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActif(false);
    if (e.dataTransfer.files.length) void traiterFichiers(e.dataTransfer.files);
  };

  const tabs: { id: Tab; label: string; count: number; Icon: typeof LayoutGrid }[] = [
    { id: "grilles", label: "Grilles EPG", count: grilles.length, Icon: LayoutGrid },
    { id: "medias", label: "Médiathèque", count: medias.length, Icon: Library },
    { id: "corbeille", label: "Corbeille", count: corbeille.length, Icon: Trash2 },
  ];

  return (
    <ConsoleShell
      titre="Tableau de bord — Directeur d'Antenne"
      sousTitre="Création et administration des grilles de programmes (EPG)"
      role="directeur"
      itemPrincipal={{ label: "Grilles EPG", Icon: LayoutGrid }}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("medias")}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3.5 py-2 text-[12.5px] font-bold text-white/70 hover:text-white hover:border-line2 transition-colors"
          >
            <UploadCloud size={15} /> Importer Media
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand2 px-3.5 py-2 text-[12.5px] font-bold text-white shadow-glow transition-all active:scale-[0.98]"
          >
            <Plus size={15} /> Créer Grille EPG
          </button>
        </div>
      }
    >
      <div className="px-5 sm:px-8 py-7 max-w-[1200px] mx-auto">
        {/* ——— Bandeau de statistiques ——— */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-wrap items-stretch rounded-xl border border-line bg-panel divide-x divide-line overflow-hidden"
        >
          {[
            { label: "Grilles au total", val: stats.total, cls: "text-white" },
            { label: "Brouillons", val: stats.brouillons, cls: "text-white/70" },
            { label: "En attente de validation", val: stats.attente, cls: "text-warn" },
            { label: "Validées (à l'antenne)", val: stats.validees, cls: "text-ok" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-4 min-w-[150px] flex-1">
              {!pret ? (
                <div className="h-8 w-12 rounded skeleton" />
              ) : (
                <p className={`font-display font-black text-[28px] leading-none tabular-nums ${s.cls}`}>{s.val}</p>
              )}
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/30 mt-1.5">{s.label}</p>
            </div>
          ))}
          <div className="px-6 py-4 min-w-[190px] flex-1 flex flex-col justify-center">
            <div className="flex items-baseline justify-between">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/30">Couverture antenne moy.</p>
              <p className="font-mono font-bold text-[14px] text-brand">{pret ? `${stats.couv}%` : "…"}</p>
            </div>
            <div className="mt-2">
              <ProgressBar value={pret ? stats.couv : 0} striped className="h-[6px]" />
            </div>
          </div>
        </motion.div>

        {/* ——— Onglets ——— */}
        <div className="flex items-center gap-1 mt-7 border-b border-line">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-[13px] font-bold transition-colors ${
                tab === t.id ? "text-white" : "text-white/40 hover:text-white/75"
              }`}
            >
              <t.Icon size={15} />
              {t.label}
              <span className={`font-mono text-[10.5px] px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-brand text-white" : "bg-panel3 text-white/45"}`}>
                {t.count}
              </span>
              {tab === t.id && <span className="absolute left-0 right-0 -bottom-px h-[2.5px] rounded-full bg-brand" />}
            </button>
          ))}
        </div>

        {/* ——— Onglet Grilles ——— */}
        {tab === "grilles" && (
          <section className="mt-6 animate-fade">
            <div className="relative max-w-[360px] mb-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Filtrer par nom ou chaîne…"
                className="w-full rounded-lg bg-panel border border-line pl-10 pr-3.5 py-2.5 text-[13px] font-medium placeholder:text-white/25 focus:border-brand transition-colors outline-none"
              />
            </div>

            {!pret ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[76px] rounded-xl skeleton" />
                ))}
              </div>
            ) : visibles.length === 0 ? (
              <div className="rounded-xl border border-line bg-panel">
                <EtatVide
                  Icon={Inbox}
                  titre={recherche ? "Aucune grille ne correspond" : "Aucune grille EPG"}
                  texte={recherche ? "Essayez un autre terme de recherche." : "Créez votre première grille de programmes pour planifier l'antenne."}
                />
              </div>
            ) : (
              <ul className="space-y-3">
                {visibles.map((g, i) => {
                  const ch = chaineDe(g.chaineId);
                  const conflits = conflitsDe(g).length;
                  return (
                    <motion.li
                      key={g.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04, ease: "easeOut" }}
                      className="group relative rounded-xl border border-line bg-panel hover:border-line2 transition-all duration-200 overflow-hidden"
                    >
                      <span className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ background: ch.accent }} />
                      <div className="flex flex-wrap items-center gap-4 pl-5 pr-4 py-4">
                        <div className="min-w-[220px] flex-1">
                          <button onClick={() => setEditeeId(g.id)} className="font-display font-bold text-[15.5px] tracking-tight hover:text-brand transition-colors text-left">
                            {g.nom}
                          </button>
                          <p className="flex items-center gap-2 text-[11.5px] text-white/35 mt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-white/55">
                              <span className="w-2 h-2 rounded-[3px]" style={{ background: ch.accent }} /> {ch.nom}
                            </span>
                            <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {fmtSemaine(g.semaineDebut)}</span>
                            <span className="font-mono">{g.emissions.length} émissions</span>
                            <span>modifiée {ilYa(g.majLe)}</span>
                          </p>
                          {g.commentaireRejet && (
                            <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-danger bg-danger/[0.08] border border-danger/20 rounded-md px-2.5 py-1.5 max-w-[520px]">
                              <AlertTriangle size={12} className="mt-0.5 flex-none" /> {g.commentaireRejet}
                            </p>
                          )}
                          {conflits > 0 && g.statut !== "valide" && (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-warn bg-warn/10 border border-warn/25 rounded-md px-2 py-1">
                              <AlertTriangle size={12} /> {conflits} conflit{conflits > 1 ? "s" : ""} horaire{conflits > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>

                        <div className="w-[130px] hidden md:block">
                          <div className="flex justify-between text-[10px] font-mono text-white/35 mb-1">
                            <span>Couverture</span>
                            <span className="text-white/60">{couvertureMoyenne(g)}%</span>
                          </div>
                          <ProgressBar value={couvertureMoyenne(g)} color={couvertureMoyenne(g) > 85 ? "var(--color-ok)" : "var(--color-warn)"} className="h-[5px]" />
                        </div>

                        <StatutBadge statut={g.statut} />

                        <div className="flex items-center gap-1.5 flex-none">
                          <button
                            onClick={() => setEditeeId(g.id)}
                            className="grid place-items-center w-9 h-9 rounded-lg border border-line text-white/55 hover:text-white hover:border-line2 hover:bg-panel2 transition-colors"
                            title="Modifier la grille"
                          >
                            <Pencil size={15} />
                          </button>
                          {g.statut === "brouillon" && (
                            <button
                              onClick={() => void soumettre(g)}
                              disabled={busyId === g.id}
                              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand/15 text-brand border border-brand/30 hover:bg-brand hover:text-white text-[12px] font-bold transition-all disabled:opacity-50"
                              title="Soumettre pour validation"
                            >
                              {busyId === g.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Soumettre
                            </button>
                          )}
                          <button
                            onClick={() => setASupprimer(g)}
                            className="grid place-items-center w-9 h-9 rounded-lg border border-line text-white/55 hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-colors"
                            title="Supprimer la grille"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ——— Onglet Médiathèque ——— */}
        {tab === "medias" && (
          <section className="mt-6 space-y-6 animate-fade">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActif(true);
              }}
              onDragLeave={() => setDragActif(false)}
              onDrop={onDrop}
              className={`relative rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
                dragActif ? "border-brand bg-brand/[0.07] scale-[1.005]" : "border-line bg-panel"
              }`}
            >
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && void traiterFichiers(e.target.files)} />
              <span className={`mx-auto grid place-items-center w-14 h-14 rounded-xl transition-colors ${dragActif ? "bg-brand text-white" : "bg-panel3 text-brand"}`}>
                <UploadCloud size={26} />
              </span>
              <p className="font-display font-bold text-[16px] mt-4">
                {dragActif ? "Déposez pour importer" : "Glissez-déposez vos médias ici"}
              </p>
              <p className="text-[12.5px] text-white/35 mt-1">
                Vidéos, audios, affiches et sous-titres — envoyés au système de Stockage (simulation frontend).
              </p>
              <div className="flex items-center justify-center gap-2.5 mt-5">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand2 text-white text-[13px] font-bold px-4 py-2.5 transition-all active:scale-[0.98]"
                >
                  <UploadCloud size={15} /> Parcourir les fichiers
                </button>
                <button
                  onClick={importDemo}
                  className="inline-flex items-center gap-2 rounded-lg border border-line text-white/60 hover:text-white hover:border-line2 text-[13px] font-semibold px-4 py-2.5 transition-colors"
                >
                  Simuler un import
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-panel overflow-hidden">
              <header className="flex items-center justify-between px-5 py-3.5 border-b border-line">
                <h2 className="font-display font-bold text-[14px] tracking-tight">Médiathèque — Stockage</h2>
                <span className="text-[11px] font-mono text-white/35">{medias.length} élément{medias.length > 1 ? "s" : ""}</span>
              </header>
              {!pret ? (
                <div className="p-4 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[44px] rounded-lg skeleton" />
                  ))}
                </div>
              ) : medias.length === 0 ? (
                <EtatVide Icon={Library} titre="Médiathèque vide" texte="Importez vos premiers médias pour alimenter les grilles." />
              ) : (
                <ul className="divide-y divide-line/60">
                  {medias.map((m) => {
                    const Ic = MEDIA_ICON[m.type];
                    return (
                      <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-3 hover:bg-panel2/60 transition-colors">
                        <span className={`grid place-items-center w-10 h-10 rounded-lg flex-none ${m.statut === "pret" ? "bg-panel3 text-white/60" : "bg-warn/10 text-warn"}`}>
                          <Ic size={17} />
                        </span>
                        <div className="min-w-[200px] flex-1">
                          <p className="font-mono text-[12.5px] font-semibold truncate">{m.nom}</p>
                          <p className="text-[10.5px] text-white/35 mt-0.5">
                            {m.type} · {m.tailleMo >= 1024 ? `${(m.tailleMo / 1024).toFixed(1)} Go` : `${m.tailleMo} Mo`}
                            {m.duree ? ` · ${m.duree}` : ""} · importé par {m.emisPar} {ilYa(m.emisLe)}
                          </p>
                        </div>
                        {m.statut === "transcodage" ? (
                          <div className="w-[180px]">
                            <div className="flex justify-between text-[10px] font-mono text-warn mb-1">
                              <span className="animate-blink">Transcodage…</span>
                              <span>{m.progression}%</span>
                            </div>
                            <ProgressBar value={m.progression} color="var(--color-warn)" className="h-[4px]" />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ok bg-ok/10 border border-ok/25 rounded-md px-2.5 py-1">
                            Prêt à la diffusion
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ——— Onglet Corbeille ——— */}
        {tab === "corbeille" && (
          <section className="mt-6 animate-fade">
            {corbeille.length === 0 ? (
              <div className="rounded-xl border border-line bg-panel">
                <EtatVide Icon={Trash2} titre="Corbeille vide" texte="Les grilles supprimées apparaissent ici avant destruction définitive." />
              </div>
            ) : (
              <ul className="space-y-3">
                {corbeille.map((g) => {
                  const ch = chaineDe(g.chaineId);
                  return (
                    <li key={g.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-panel px-5 py-4 opacity-80 hover:opacity-100 transition-opacity">
                      <span className="w-[4px] self-stretch rounded-full" style={{ background: ch.accent }} />
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-display font-bold text-[14.5px]">{g.nom}</p>
                        <p className="text-[11.5px] text-white/35 mt-0.5">
                          {ch.nom} · {fmtSemaine(g.semaineDebut)} · supprimée {ilYa(g.majLe)}
                        </p>
                      </div>
                      <StatutBadge statut="supprimee" compact />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => void restaurer(g)}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-ok/35 text-ok text-[12px] font-bold hover:bg-ok/10 transition-colors"
                        >
                          <RotateCcw size={13} /> Restaurer
                        </button>
                        <button
                          onClick={() => setADetruire(g)}
                          className="grid place-items-center w-9 h-9 rounded-lg border border-line text-white/55 hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-colors"
                          title="Détruire définitivement"
                        >
                          <Flame size={15} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* ——— Modale de création ——— */}
      <GrilleFormModal ouvert={createOpen} onFermer={() => setCreateOpen(false)} grilles={grilles} />

      {/* ——— Éditeur ——— */}
      <GrilleEditorModal grille={editee} ouvert={editee !== null} onFermer={() => setEditeeId(null)} peutSoumettre />

      <ConfirmModal
        ouvert={aSupprimer !== null}
        titre="Supprimer la grille"
        message={
          <>
            « <span className="font-bold text-white">{aSupprimer?.nom}</span> » sera retirée {aSupprimer?.statut === "valide" ? "de l'antenne et du Guide TV, puis placée" : "et placée"} dans la corbeille. Vous pourrez la restaurer.
          </>
        }
        confirmLabel="Supprimer"
        onAnnuler={() => setASupprimer(null)}
        onConfirmer={() => void supprimer()}
      />

      <ConfirmModal
        ouvert={aDetruire !== null}
        titre="Détruire définitivement"
        message={
          <>
            « <span className="font-bold text-white">{aDetruire?.nom}</span> » sera définitivement effacée du Stockage. Cette action est irréversible.
          </>
        }
        confirmLabel="Détruire"
        onAnnuler={() => setADetruire(null)}
        onConfirmer={() => void detruire()}
      />
    </ConsoleShell>
  );
}

/* ——— Formulaire « Créer Grille EPG » ——— */

function GrilleFormModal({ ouvert, onFermer, grilles }: { ouvert: boolean; onFermer: () => void; grilles: Grille[] }) {
  const { user } = useApp();
  const toast = useToast();
  const lundi = isoJour(lundiDe(new Date()));
  const [nom, setNom] = useState("");
  const [chaineId, setChaineId] = useState(CHAINES[0].id);
  const [semaine, setSemaine] = useState(lundi);
  const [source, setSource] = useState<string>("vierge");
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const creer = async () => {
    if (nom.trim().length < 3) return setErreur("Le nom de la grille est obligatoire (3 caractères min).");
    setBusy(true);
    try {
      let emissions: Grille["emissions"] = [];
      if (source !== "vierge") {
        const src = grilles.find((g) => g.id === source);
        if (src) {
          const joursSrc = joursSemaine(src.semaineDebut);
          const joursDst = joursSemaine(semaine);
          emissions = src.emissions
            .map((e) => {
              const idx = joursSrc.indexOf(e.jour);
              return idx >= 0 ? { ...e, id: `em-copie-${Math.random().toString(36).slice(2, 9)}`, jour: joursDst[idx] } : null;
            })
            .filter(Boolean) as Grille["emissions"];
        }
      }
      const g = await storage.createGrille({ nom, chaineId, semaineDebut: semaine, emissions }, user!);
      toast.push({
        type: "succes",
        titre: "Grille EPG créée",
        message: `« ${g.nom} » — ${emissions.length ? `${emissions.length} émissions dupliquées, statut brouillon.` : "grille vierge, statut brouillon."}`,
      });
      setNom("");
      setSource("vierge");
      setErreur(null);
      onFermer();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-lg bg-panel2 border border-line px-3.5 py-2.5 text-[13.5px] font-medium text-white placeholder:text-white/25 focus:border-brand transition-colors outline-none";
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-white/35 mb-1.5";

  return (
    <Modale
      ouvert={ouvert}
      onFermer={onFermer}
      titre="Créer une grille EPG"
      sousTitre="La grille démarre au statut Brouillon"
      footer={
        <div className="flex justify-end gap-2.5">
          <button onClick={onFermer} className="px-4 py-2 rounded-lg border border-line text-[13px] font-semibold text-white/60 hover:bg-panel3 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => void creer()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand2 text-white text-[13px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />} Créer la grille
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Nom de la grille</label>
          <input className={inputCls} value={nom} onChange={(e) => { setNom(e.target.value); setErreur(null); }} placeholder="Ex. : Grille spéciale fêtes — Balafon TV" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Chaîne</label>
            <select className={inputCls} value={chaineId} onChange={(e) => setChaineId(e.target.value)}>
              {CHAINES.map((c) => (
                <option key={c.id} value={c.id} className="bg-panel">{c.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Semaine (lundi)</label>
            <input
              type="date"
              className={`${inputCls} font-mono`}
              value={semaine}
              onChange={(e) => {
                const d = e.target.value ? parseJour(e.target.value) : new Date();
                setSemaine(isoJour(addDays(d, -((d.getDay() + 6) % 7))));
              }}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Contenu initial</label>
          <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="vierge" className="bg-panel">Grille vierge (aucune émission)</option>
            {grilles
              .filter((g) => g.emissions.length > 0)
              .map((g) => (
                <option key={g.id} value={g.id} className="bg-panel">
                  Dupliquer « {g.nom} » ({g.emissions.length} émissions)
                </option>
              ))}
          </select>
          <p className="text-[11.5px] text-white/30 mt-1.5">
            La duplication reporte chaque émission sur le même jour de la semaine choisie.
          </p>
        </div>
        {erreur && (
          <p className="flex items-center gap-2 text-[12.5px] font-semibold text-danger bg-danger/10 border border-danger/25 rounded-lg px-3 py-2.5 animate-fade">
            <AlertTriangle size={14} /> {erreur}
          </p>
        )}
      </div>
    </Modale>
  );
}

# Balafon Plus — Gestion de grille & automatisation régie

Application de gestion de grille de programmes / automatisation régie pour
**Balafon Media Group** (stage IAI Cameroun) : frontend React (Vite + Tailwind)
et backend Django (DRF + Channels + PostgreSQL).

## Démarrage rapide (mode démo, sans backend)

```bash
npm install
npm run dev          # ou npm run build && servir dist/
```

Sans `VITE_API_URL`, le frontend utilise un **adaptateur de démonstration** :
contrat REST simulé, persistance `localStorage`, temps réel entre onglets via
`BroadcastChannel`. Ouvrez `#/directeur` et `#/regie` dans deux onglets, validez
une proposition côté directeur → la régie reçoit la notification instantanément.

### Comptes de démonstration (mot de passe `balafon237`)

| Rôle | Email | Route |
|---|---|---|
| Administrateur | `admin@balafon.cm` | `#/admin`, `#/admin/grille` |
| Directeur d'Antenne | `direction@balafon.cm` | `#/directeur` |
| Régie de diffusion | `regie@balafon.cm` | `#/regie` (thème sombre) |

Public non connecté : `#/grille` (hero « en direct » + grille par jour).

## Démarrage avec le backend Django + PostgreSQL

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations accounts programmes
python manage.py migrate
python seed.py
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

Puis, à la racine :

```bash
cp .env.example .env
# VITE_API_URL=http://localhost:8000
# VITE_WS_URL=ws://localhost:8000/ws/grille/
```

Détails dans [`backend/README.md`](backend/README.md).

## Rôles et écrans

| Rôle | Route | Peut faire |
|---|---|---|
| Public | `#/grille` | Consulter la grille validée (plateau « en direct », ticker, liste par jour) |
| Administrateur | `#/admin` | Tableau de bord (stats + programme du jour + activité) |
| Administrateur | `#/admin/grille` | Éditeur hebdomadaire 24 h (créer/modifier, conflits horaires, soumettre) |
| Directeur d'Antenne | `#/directeur` | Comparer grille actuelle ↔ proposition, valider / rejeter (motif requis) |
| Régie | `#/regie` | Monitoring temps réel, « à suivre », alertes, synchronisation vMix |

## Identité visuelle

Design system « Balafon Plus » : orange `#a43700` (primaire), bleu `#005faf`
(secondaire), surfaces claires pour les écrans éditoriaux, thème control-room
sombre (accent `#E65100`) réservé à la Régie. Typo display **Archivo**, corps
**Inter**, timecodes **JetBrains Mono**, icônes Material Symbols.

## Limites connues / pistes de suite

- **Éditeur de grille** : création/modification par modale (pas de
  glisser-déposer ni de redimensionnement souris pour l'instant).
- **Diff Directeur** : rapprochement client par recoupement horaire (même
  chaîne, créneau chevauchant). La détection de **suppression** exige un
  historique backend (`remplace_emission_id` ou endpoint de diff dédié).
- **vMix** : indicateurs calculés depuis la grille validée ; statut et journal
  dépendent des 3 endpoints `/api/regie/vmix/*` (stubs dans le backend — à
  brancher sur l'API vMix réelle). S'ils ne répondent pas, l'écran bascule sur
  « vMix indisponible » sans afficher de fausses données.
- **Gestion des accès (Technicien)** et **centre de notifications** : évoqués
  dans les maquettes Stitch, pas construits ici.

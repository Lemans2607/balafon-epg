# BALAFON+ Guide — Gestion & diffusion de programmes TV

Application React (Vite + Tailwind CSS + Lucide Icons + Framer Motion) de gestion
et de diffusion de programmes TV pour **Balafon Media**, construite autour d'un
diagramme de cas d'utilisation UML à 4 acteurs :

| Acteur | Rôle dans l'application |
|---|---|
| **Directeur d'Antenne** | Crée les grilles EPG, importe les médias, modifie / supprime les grilles |
| **Régie Diffusion** | Valide, modifie et supprime les grilles en temps réel |
| **Téléspectateur** | Consulte le site/TV, sélectionne et affiche les grilles de programmes |
| **Système de Planification / Stockage** | Backend simulé par `src/services/storage.ts` (persistance + temps réel) |

## Démarrage

```bash
npm install
npm run dev        # ou npm run build pour la production
```

Aucun backend requis : le service de Stockage simulé persiste tout en
`localStorage` et synchronise les onglets ouverts via `BroadcastChannel`
(ouvrez `#/directeur` et `#/regie` côte à côte : une validation côté Régie se
voit instantanément côté Directeur, Guide TV et portail).

### Comptes de démonstration (mot de passe `balafon237`)

| Rôle | Email | Redirection |
|---|---|---|
| Directeur d'Antenne | `directeur@balafon.cm` | `#/directeur` |
| Régie Diffusion | `regie@balafon.cm` | `#/regie` |
| Téléspectateur | `telespectateur@balafon.cm` | `#/` (portail) |

Le portail téléspectateur et le Guide TV sont publics (aucune connexion requise).

## Cas d'utilisation couverts

- **S'Authentifier** — `LoginPage` commune, redirection basée sur le rôle.
- **Créer Grille EPG** — modale de création (grille vierge ou duplication d'une
  grille existante sur la semaine choisie), statut initial *Brouillon*.
- **Importer Media** — zone de drag & drop vers le Stockage simulé : upload,
  transcodage animé, médiathèque consultable ; les affiches importées sont
  réutilisables sur les émissions.
- **Modifier / Supprimer Grille** — éditeur complet (émissions par jour,
  détection de conflits horaires, couverture d'antenne), suppression avec
  modale de confirmation → corbeille (restauration / destruction définitive).
- **Valider Grille** — file de validation côté Régie avec aperçu des programmes,
  alerte de conflits, modale de confirmation ; **rejeter** exige un motif.
- **Consulter Site/TV · Sélectionner Grille · Afficher Grille** — portail
  streaming (billboard, rail « En Direct Maintenant » avec progression, rails
  Reprendre / Replays / Top 10) et Guide TV : sélecteur de grille + de jour,
  timeline visuelle heure par heure avec ligne « maintenant ».

## Workflow simulé (états de grille)

`Brouillon` → `En attente de validation` → `Validée` (visible sur le portail et
le Guide TV) — `Supprimée` (corbeille). Chaque action alimente le **journal
temps réel** de la Régie.

## Thème

Dark mode « OLED Black » (`#0A0A0A` / composants `#141414`), accent orange
`#FF5722`, barre de navigation en glassmorphism, cartes avec zoom au survol et
overlay d'informations, typographie Archivo (display) + Inter (corps) +
JetBrains Mono (timecodes).

## Backend Django + PostgreSQL (optionnel)

Un backend Django complet (DRF + Channels + PostgreSQL) livré dans
[`backend/`](backend/README.md) reste disponible si vous souhaitez remplacer la
simulation frontend par une vraie API (workflow d'émissions par rôle,
WebSocket `ws/grille/`, seed PostgreSQL).

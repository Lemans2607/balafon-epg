# Balafon+ Guide — Balafon Media Group

Plateforme centralisée de gestion de la grille des programmes TV, synchronisée
avec la régie vMix, avec un portail public digne de Netflix / Canal+ / DStv+.

Remplace la gestion manuelle identifiée par l'audit interne : plus de compteur
« Nuit 0 » vide, plus de double saisie en régie, plus de validation hors circuit.

## Démarrage

```bash
npm install
npm run dev      # ou npm run build → dist/
```

## Architecture — 2 modules

### Module 1 · Portail public (Téléspectateur) — `#/` et `#/guide`

- **Navbar** glassmorphism : BALAFON TV, Accueil / Guide TV / Replay, recherche, avatar.
- **Le Boulevard du Direct** : bannière 90vh sur l'émission en cours de diffusion
  (badge rouge pulsant EN DIRECT, progression du direct, « Regarder le Live »).
- **Rail « En ce moment »** : cartes 16:9, heure précise à la minute, barre de
  progression rouge du direct.
- **Rail Replays & VOD** : affiches 2:3, zoom 1.05 + overlay au survol.
- **Guide TV (EPG public)** : timeline horizontale 06:00 → 24:00, onglets de
  jours, précision à la minute, et **les plages non diffusées affichent
  « Hors antenne / Rediffusion »** (fin du compteur de nuit vide).

### Module 2 · Back-office (Staff) — `#/login` puis `#/studio`

Layout SaaS (sidebar + topbar). La topbar porte le **switcheur de rôle**
(Admin / Directeur / Régie) et le statut **« API vMix : Synchronisée »**.

- **Administrateur — Constructeur EPG** (`AdminBuilder`)
  Split-screen : à gauche la *Bibliothèque des Programmes* (cartes statut Gold,
  draggables), à droite la *Timeline EPG 24h* (slots de 30 min, 06h → 00h).
  Le bloc déposé devient solide, affiche début/fin exacts et prend la couleur
  de sa catégorie. **Contrôle de complétude** : tout trou de 30 min est hachuré
  rouge « Programme manquant » et « Publier la Grille » reste grisé tant qu'il
  reste un trou.
- **Directeur d'Antenne — Validation éditoriale** (`DirecteurKanban`)
  Kanban 3 colonnes : Brouillons / En attente de validation / Validées pour
  diffusion. Valider → la carte passe en vert et à l'antenne. Modifier une
  grille **déjà validée** → pop-up rouge *« cette modification déclenchera une
  alerte temps réel à la Régie »* + log tracé.
- **Régie de Diffusion — Mission Control** (`RegieControl`)
  Bandeau « EN DIRECT SUR BALAFON TV », timeline EPG en lecture seule avec
  **playhead rouge** qui se déplace en temps réel, *Console d'Alertes Temps
  Réel* (alerte rouge clignotante sur chaque modification Directeur, bouton
  « Acquitter l'alerte ») et synchronisation vMix. **Fin de la double saisie** :
  la régie lit le miroir de la grille validée.

## Stack & signature visuelle

React + Vite + Tailwind CSS v4, Lucide Icons, Framer Motion, drag & drop HTML5
natif. Poppins (display) / Inter (corps) / JetBrains Mono (heures EPG).

- Portail public : noir absolu `#050505`, immersif et cinématographique.
- Back-office : noir bleuté `#0B0E14`, composants anthracite vitré `#1A1F2E`.
- Accents : **Balafon Red** `#FF3D00` (live, playhead), **Studio Green**
  `#00F5A0` (validé, vMix), **Warning Gold** `#FFB800` (brouillons, attente).

## Démo temps réel

Ouvrez `#/studio` (Directeur) et un second onglet `#/studio` (Régie via le
switcheur) : modifier une grille validée côté Directeur fait **clignoter
l'alerte côté Régie instantanément** (BroadcastChannel), de même que les
validations se répercutent sur le portail public et le Guide TV.
L'état persiste en localStorage.

## Backend Django (optionnel)

Une implémentation Django + PostgreSQL du lot précédent reste disponible dans
`backend/` (DRF, Channels, workflow brouillon → validation → diffusion). Le
frontend actuel fonctionne de manière autonome grâce au système de
planification/stockage simulé (`src/state/store.tsx`).

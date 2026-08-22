# Balafon Plus — Backend Django

API REST (Django REST Framework) + WebSocket (Django Channels) + PostgreSQL,
conforme au contrat attendu par le frontend (`src/api/`).

## 1. Prérequis

- Python 3.11+
- PostgreSQL 14+

## 2. Installation

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Base de données

```sql
CREATE DATABASE balafon;
```

Variables d'environnement (ou `.env` à la racine de `backend/`) :

```env
PG_NAME=balafon
PG_USER=postgres
PG_PASSWORD=votre_mot_de_passe
PG_HOST=127.0.0.1
PG_PORT=5432
DJANGO_SECRET_KEY=changez-moi-en-production
```

## 4. Migrations + données de démo

```bash
python manage.py makemigrations accounts programmes
python manage.py migrate
python seed.py          # comptes, chaînes et semaine type (mot de passe : balafon237)
```

Comptes créés : `admin@balafon.cm` (Administrateur), `direction@balafon.cm`
(Directeur d'Antenne), `regie@balafon.cm` (Régie).

## 5. Lancement (HTTP + WebSocket)

```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
# ou en dev : python manage.py runserver 0.0.0.0:8000 (WebSocket via daphne intégré)
```

## 6. Brancher le frontend

À la racine du projet :

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/grille/
```

Sans ces variables, le frontend bascule sur son **adaptateur de démonstration**
(localStorage + BroadcastChannel) — pratique pour tester les 4 écrans sans backend.

## Contrat exposé

| Endpoint | Rôle | Effet |
|---|---|---|
| `POST /api/auth/login/` | — | `{ token, user: { id, nom, role } }` |
| `GET /api/auth/me/` | connecté | profil courant |
| `POST /api/auth/demande-acces/` | — | `{ nom, email, password }` |
| `GET /api/chaines/` | public | liste des chaînes |
| `GET /api/emissions/` | public → validées / admin+directeur → tout | grille |
| `POST · PATCH · DELETE /api/emissions/…` | admin (brouillons uniquement) | CRUD |
| `POST /api/emissions/:id/soumettre/` | admin | brouillon → à valider |
| `POST /api/emissions/:id/valider/` | directeur | → validée + WS `grille.validee` |
| `POST /api/emissions/:id/rejeter/` | directeur | `{ commentaire }` → brouillon |
| `GET /api/regie/vmix/statut/` | régie | état de connexion vMix |
| `POST /api/regie/vmix/synchroniser/` | régie | envoie la grille validée |
| `GET /api/regie/vmix/journal/` | régie | journal de synchronisation |

WebSocket `ws://…/ws/grille/` — messages `{ type: "grille.mise_a_jour" |
"grille.validee", emission }`.

> Les trois endpoints vMix sont des **stubs** (état en mémoire) : branchez-les
> sur l'API HTTP réelle de vMix (`http://localhost:8088/api/`) quand disponible.
> S'ils ne répondent pas, l'écran Régie affiche proprement « vMix indisponible ».

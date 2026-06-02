# Marketplace Application

Une plateforme de vente d'occasion moderne et intuitive construite avec React, Express et PostgreSQL.

## 🏗️ Architecture

```
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Express + TypeScript + Prisma
└── docker-compose.yml # PostgreSQL en développement
```

## 🚀 Stack Technologique

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router
- **Backend**: Express + TypeScript + Prisma ORM
- **Base de Données**: PostgreSQL 15
- **Authentification**: JWT
- **Communication Temps Réel**: Socket.io (messagerie)

## 📋 Fonctionnalités

- ✅ Authentification utilisateur (inscription/connexion)
- ✅ Création et gestion d'annonces
- ✅ Système de catégories et filtres
- ✅ Profils utilisateur
- ✅ Messagerie en temps réel entre acheteurs/vendeurs
- ✅ Système d'évaluation et avis
- ✅ Panier et gestion des favoris

## 🛠️ Installation Locale

### Prérequis
- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🌐 Déploiement sur Render

Ce projet est prêt pour Render avec le fichier de configuration `render.yaml`.

### 1) Préparer le dépôt Git

```powershell
cd "C:\Users\hp\Desktop\Nouveau dossier"
git add marketplace-app
git commit -m "feat: prepare marketplace app for Render deployment"
git branch -M main
git remote add origin https://github.com/<ton-utilisateur>/<ton-repo>.git
git push -u origin main
```

> Si tu veux garder `master` au lieu de `main`, ignore la commande `git branch -M main`.

### 2) Déployer sur Render

1. Connecte ton repo GitHub à Render.
2. Crée un nouveau service à partir du repo.
3. Render doit détecter automatiquement `render.yaml`.
4. Si besoin, vérifie les services créés :
   - `marketplace-backend`
   - `marketplace-frontend`
   - `marketplace-db`

### 3) Variables d'environnement requises

- `JWT_SECRET` : secret fort pour le backend
- `FRONTEND_URL` : URL du frontend Render
- `DATABASE_URL` : fourni par Render si la base est créée automatiquement
- `VITE_API_URL` : URL du backend Render pour le frontend

### 4) Commandes de build Render

Backend :
```bash
npm install && npx prisma generate && npm run build
```
Frontend :
```bash
npm install && npm run build
```

### 5) Vérification

- Backend : `https://<backend-service>.onrender.com/api/products`
- Frontend : URL fournie par Render
- Auth : teste `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

## 📚 Documentation API

Les endpoints de l'API sont documentés dans `backend/API.md`

## 📄 License

MIT

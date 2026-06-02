# Getting Started

## Configuration rapide

### Prérequis
- **Node.js** 18+
- **PostgreSQL** 15+ (ou Docker)
- **Git**
- **npm** ou **yarn**

## 🚀 Démarrage local

### 1. Installation des dépendances

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
2cd frontend
npm install
```

### 2. Configuration de la base de données

#### Option A: Avec Docker (Recommandé)
```bash
docker-compose up -d
```

Cela va démarrer PostgreSQL automatiquement.

#### Option B: PostgreSQL installé localement
```bash
createdb marketplace
```

Puis modifiez `.env` dans le dossier `backend`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/marketplace?schema=public"
```

### 3. Migrations de base de données

```bash
cd backend
npx prisma migrate dev
```

Cela va:
- Créer les tables
- Générer le client Prisma

### 4. Démarrage du serveur

**Backend:**
```bash
cd backend
npm run dev
```

Le serveur sera sur `http://localhost:5000`

**Frontend (dans un autre terminal):**
```bash
cd frontend
npm run dev
```

L'app sera sur `http://localhost:5173`

## 📁 Structure du projet

```
marketplace-app/
├── backend/
│   ├── src/
│   │   └── index.ts          # Point d'entrée
│   ├── prisma/
│   │   ├── schema.prisma     # Schéma base de données
│   │   └── migrations/       # Historique des migrations
│   ├── .env.example          # Variables d'environnement
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/            # Pages principales
│   │   ├── App.tsx           # Application principale
│   │   └── main.tsx          # Point d'entrée
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── docker-compose.yml        # Configuration Docker
├── render.yaml              # Configuration Render
├── README.md
├── DEPLOYMENT_GUIDE.md
└── GETTING_STARTED.md        # Ce fichier
```

## 🔧 Tâches courantes

### Ajouter une nouvelle table dans la base de données

1. Modifiez `backend/prisma/schema.prisma`
2. Créez une migration:
```bash
npx prisma migrate dev --name add_new_table
```

### Générer des données de test

```bash
cd backend
npx ts-node prisma/seed.ts
```

### Vérifier la base de données avec Prisma Studio

```bash
cd backend
npx prisma studio
```

Cela ouvre une interface web pour explorer votre base de données.

### Build pour la production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

## 🐛 Dépannage

### "Cannot find module" error
```bash
npm install
```

### Erreur de connexion à la base de données
1. Vérifiez que PostgreSQL fonctionne
2. Vérifiez la `DATABASE_URL` dans `.env`
3. Vérifiez les credentials

### Port déjà utilisé
- Backend: `npm run dev` utilise le port 5000
- Frontend: `npm run dev` utilise le port 5173

Changez-les dans les fichiers de configuration si nécessaire.

### Problèmes avec Prisma
```bash
cd backend
rm node_modules/.prisma
npx prisma generate
npx prisma migrate deploy
```

## 📚 Ressources

- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Render Documentation](https://render.com/docs)

## 💡 Prochaines étapes

1. ✅ Implémentez l'authentification (JWT)
2. ✅ Créez les endpoints API
3. ✅ Développez les pages React
4. ✅ Testez en local
5. ✅ Déployez sur Render

Voir `DEPLOYMENT_GUIDE.md` pour le déploiement en production.

# 🚀 Quick Start

## Installation rapide (5 minutes)

### 1. Installer les dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configuration Docker (Base de données)

```bash
# À partir du dossier racine
docker-compose up -d
```

Ou si vous avez PostgreSQL installé localement, créez une base:
```bash
createdb marketplace
```

### 3. Configurer les variables d'environnement

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
```

Modifiez si nécessaire la DATABASE_URL.

### 4. Initialiser la base de données

```bash
cd backend
npx prisma migrate dev
```

### 5. Démarrer les serveurs

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) 🎉

---

## 📝 Configuration initiale

### Variables d'environnement importantes

**Backend `(.env)`**:
```env
DATABASE_URL=postgresql://marketplace_user:marketplace_password_dev@localhost:5432/marketplace?schema=public
JWT_SECRET=votre-clé-secrète-ici
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (`.env`)** (optionnel):
```env
VITE_API_URL=http://localhost:5000
```

---

## 🧪 Données de test

Pour charger des données de test:

```bash
cd backend
npx ts-node prisma/seed.ts
```

Puis ouvrez [Prisma Studio](http://localhost:5555) pour explorer:
```bash
npx prisma studio
```

---

## 🐛 Erreurs courantes

### "Port 5000 already in use"
Trouvez et arrêtez le processus:
```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Mac/Linux
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### "Cannot connect to database"
```bash
# Vérifiez que PostgreSQL fonctionne
docker ps  # Si Docker
psql -U postgres  # Si local
```

### "Prisma client not found"
```bash
cd backend
npx prisma generate
```

---

## 📚 Documentation

- [GETTING_STARTED.md](./GETTING_STARTED.md) - Guide complet
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Déploiement sur Render
- [ROADMAP.md](./ROADMAP.md) - Tâches à faire
- [API.md](./backend/API.md) - Endpoints API
- [README.md](./README.md) - Vue d'ensemble

---

## ✨ Étapes suivantes

1. ✅ Implémenter l'authentification
2. ✅ Créer les endpoints API
3. ✅ Développer l'interface utilisateur
4. ✅ Tester en local
5. ✅ Déployer sur Render

**Prêt à développer?** Commencez par le [ROADMAP.md](./ROADMAP.md) 🚀

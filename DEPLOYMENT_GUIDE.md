# Guide de déploiement sur Render

## Étapes de déploiement sur Render (Gratuit)

### 1. Préparation du projet

Assurez-vous que tout est prêt:
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Créer un compte Render

1. Allez sur [https://render.com](https://render.com)
2. Inscrivez-vous avec GitHub

### 3. Connecter votre GitHub

1. Dans Render, allez à **Dashboard**
2. Cliquez sur **New** > **Web Service**
3. Connectez votre compte GitHub
4. Sélectionnez ce repository

### 4. Configuration du Backend

1. **Name**: `marketplace-backend`
2. **Runtime**: Node
3. **Build Command**: `npm install && npx prisma generate && npm run build`
4. **Start Command**: `npm start`
5. **Plan**: Free

#### Variables d'environnement:
```
NODE_ENV=production
JWT_SECRET=<générer une clé sécurisée>
FRONTEND_URL=https://marketplace-frontend.onrender.com
```

### 5. Configuration de la base de données

1. Dans Render, cliquez sur **Databases**
2. Cliquez sur **New** > **PostgreSQL**
3. **Name**: `marketplace-db`
4. **Database**: `marketplace`
5. **User**: `marketplace_user`
6. **Plan**: Free

Copier la **Internal Database URL** et l'ajouter comme variable:
```
DATABASE_URL=<votre-internal-database-url>
```

### 6. Configuration du Frontend

1. Créez un nouveau Web Service pour le frontend
2. **Name**: `marketplace-frontend`
3. **Runtime**: Static Site
4. **Build Command**: `npm install && npm run build`
5. **Publish directory**: `dist`
6. **Plan**: Free

#### Variables d'environnement:
```
VITE_API_URL=https://marketplace-backend.onrender.com
```

### 7. Déploiement avec render.yaml

Alternativement, vous pouvez utiliser le fichier `render.yaml`:

```bash
git push origin main
```

Render va automatiquement déployer tous les services définis dans `render.yaml`.

### 8. Limites du plan gratuit Render

⚠️ Important à savoir:
- Les services vont en veille après 15 minutes d'inactivité (réveil lent)
- Base de données : 100 MB max
- 750 heures de services par mois
- Pas de support email

### 9. Dépannage

**Erreur de connexion à la base de données:**
- Vérifiez que vous utilisez l'**Internal Database URL** dans l'application
- Utilisez l'**External Database URL** pour les outils externes

**Services qui s'arrêtent:**
- C'est normal sur le plan gratuit. Les services vont en veille après 15 min d'inactivité
- Pour garder actif, utilisez un service de monitoring (ex: UptimeRobot - gratuit)

**Migrations Prisma:**
- Utilisez la **Database** tab pour exécuter les migrations
- Ou ajoutez à `package.json`: `"postinstall": "prisma migrate deploy"`

### 10. Alternative: Hébergeurs gratuits

Si Render ne vous convient pas:
- **Railway** (gratuit avec limite)
- **Vercel** (frontend seulement)
- **Replit** (développement)
- **Heroku** (payant maintenant, mais alternatives existent)

## Bonnes pratiques

1. ✅ Utilisez des variables d'environnement pour les secrets
2. ✅ Testez en local avec Docker avant de déployer
3. ✅ Versionnez le code avec Git
4. ✅ Créez des branches pour les nouvelles features
5. ✅ Utilisez des commits clairs et descriptifs

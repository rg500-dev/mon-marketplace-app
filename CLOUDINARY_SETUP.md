# Configuration Cloudinary pour le stockage d'images

## 📋 Étapes de configuration

### 1. Créer un compte Cloudinary
1. Allez sur https://cloudinary.com/
2. Créez un compte gratuit
3. Connectez-vous à votre dashboard

### 2. Récupérer vos identifiants
Dans le dashboard Cloudinary, vous trouverez:
- **Cloud Name** : Votre nom de cloud
- **API Key** : Votre clé API
- **API Secret** : Votre secret API

### 3. Configuration locale (développement)

Ajoutez ces variables dans `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"
```

### 4. Configuration Render (production)

Après avoir déployé sur Render:
1. Allez dans votre service `marketplace-backend`
2. Cliquez sur "Environment" dans le menu
3. Ajoutez les 3 variables suivantes:
   - `CLOUDINARY_CLOUD_NAME` = votre cloud name
   - `CLOUDINARY_API_KEY` = votre API key
   - `CLOUDINARY_API_SECRET` = votre API secret

## ✅ Fonctionnalités implémentées

- Upload automatique des images sur Cloudinary
- Optimisation automatique (max 800x800px, qualité auto)
- Formats acceptés: JPEG, PNG, WebP
- Limite de taille: 5MB par fichier
- Stockage dans le dossier `marketplace-uploads`
- URL sécurisée et CDN inclus

## 🔧 Changements techniques

### Backend
- Installation de `cloudinary` et `multer-storage-cloudinary`
- Modification de `backend/src/routes/upload.ts` pour utiliser Cloudinary
- Ajout des variables d'environnement dans `.env.example`
- Mise à jour de `render.yaml` avec les variables Cloudinary

## 🚀 Test local

```bash
cd backend
npm run dev
```

Testez l'upload d'image via l'interface frontend ou avec Postman:
```
POST http://localhost:5000/api/upload
Content-Type: multipart/form-data
Body: image (fichier)
```

## 📝 Notes importantes

- Les images sont maintenant stockées sur Cloudinary et non localement
- Les URLs retournées sont des URLs Cloudinary (CDN)
- Les images persistent même après redéploiement sur Render
- Le compte gratuit Cloudinary offre 25GB de stockage et 25GB de bande passante mensuelle

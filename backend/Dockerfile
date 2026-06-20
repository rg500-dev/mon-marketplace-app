FROM node:18-alpine

WORKDIR /app

# Installer les dépendances nécessaires pour Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

# Démarrer le serveur après avoir appliqué les migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
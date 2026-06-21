FROM node:18-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Force rebuild - invalidate cache
ARG BUILD_DATE

# Copy backend files
COPY backend/package*.json ./
COPY package.json ./
COPY backend/prisma ./prisma

# Install dependencies
RUN npm install

# Copy rest of backend
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

# Démarrer le serveur après avoir appliqué les migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
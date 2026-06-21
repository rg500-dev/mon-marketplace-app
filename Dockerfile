FROM node:18-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Force rebuild - invalidate cache
ARG BUILD_DATE

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma

# Install dependencies
RUN cd backend && npm install

# Copy rest of backend
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build TypeScript
RUN cd backend && npm run build

EXPOSE 5000

# Démarrer le serveur après avoir appliqué les migrations
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/index.js"]
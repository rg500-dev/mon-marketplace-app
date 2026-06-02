FROM node:18-alpine

WORKDIR /app

# Force rebuild - invalidate cache
ARG BUILD_DATE

# Copy backend files
COPY backend/package*.json ./
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

CMD ["npm", "start"]

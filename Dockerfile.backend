FROM node:18-alpine

WORKDIR /app

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

EXPOSE 5000

CMD ["npm", "start"]

#!/bin/bash
set -e

echo "🔨 Building backend..."

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

echo "✅ Build completed successfully!"

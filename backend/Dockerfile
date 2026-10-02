# Build context: repository root (uses the npm workspace lockfile)
#   docker build -f backend/Dockerfile -t mawami-backend .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend --include-workspace-root=false
COPY backend/ backend/
RUN npm --workspace backend run build

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend --include-workspace-root=false --omit=dev \
    && npm cache clean --force

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist ./backend/dist
WORKDIR /app/backend
USER node
EXPOSE 3001
# Migrations + seed (idempotent): node dist/database-migration.js
CMD ["node", "dist/main"]

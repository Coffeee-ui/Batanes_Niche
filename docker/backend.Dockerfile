# ============================================================
# Batanes Niche Job Portal - Backend Dockerfile
# Production build for Express.js + Prisma backend using pnpm
# ============================================================

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.4.2 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/package.json ./backend/
RUN pnpm --filter batanes-niche-backend install --frozen-lockfile

COPY backend/ ./backend/
RUN pnpm --filter batanes-niche-backend prisma:generate
RUN pnpm --filter batanes-niche-backend build

# Prune dev dependencies for production
RUN pnpm --filter batanes-niche-backend --prod deploy /app/deploy

# Stage 2: Minimal production runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    PORT=8000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Run as non-root user
USER node

COPY --chown=node:node --from=builder /app/backend/dist ./dist
COPY --chown=node:node --from=builder /app/backend/templates ./templates
COPY --chown=node:node --from=builder /app/backend/prisma ./prisma
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/backend/package.json ./package.json

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["node", "dist/main.js"]

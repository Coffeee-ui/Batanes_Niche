# ============================================================
# Batanes Niche Job Portal - Frontend Dockerfile
# Multi-stage production build for React + Vite SPA
# ============================================================

# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /build

RUN corepack enable && corepack prepare pnpm@12.4.2 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY frontend/package.json ./frontend/
RUN pnpm --filter batanes-niche-frontend install --frozen-lockfile

COPY frontend/ ./frontend/
RUN pnpm --filter batanes-niche-frontend build

# Stage 2: Minimal Nginx web server
FROM nginx:1.25-alpine AS runner

# Remove default nginx configs
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy build artifacts
COPY --from=builder /build/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

# =============================================
# MusicFlow Backend - NestJS + Prisma
# Build context = apps/backend (self-contained; no workspace deps)
# =============================================

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache openssl

# Install ALL dependencies (no lockfile is shipped, so use install not ci)
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client + build
RUN npx prisma generate
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl wget

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy built app + deps (node_modules includes the generated Prisma client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=8000

USER nestjs

EXPOSE 8000

# Health check hits the new /api/health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

# Apply migrations, then start. The build preserves the `src/` root (scripts/
# live alongside src/), so the entrypoint is dist/src/main.js — not dist/main.js.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]

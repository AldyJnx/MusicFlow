# syntax=docker/dockerfile:1.7

# El contexto de build es la raíz del monorepo. Así se usa el lockfile de pnpm
# y la imagen es reproducible tanto en la VPS como en CI.
FROM node:20-alpine AS base

RUN apk add --no-cache openssl \
  && corepack enable \
  && corepack prepare pnpm@9.0.0 --activate

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json

FROM base AS dependencies

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile --filter @musicflow/backend...

FROM dependencies AS builder

COPY apps/backend ./apps/backend

RUN pnpm --filter @musicflow/backend run prisma:generate \
  && pnpm --filter @musicflow/backend run build

# `pnpm deploy` crea un árbol de dependencias de producción aislado. Su
# instalación no incluye Prisma CLI, por lo que se copia explícitamente el
# cliente generado durante el build al árbol final.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm --filter @musicflow/backend deploy --prod /opt/musicflow-backend \
  && source_client="$(readlink -f /workspace/apps/backend/node_modules/@prisma/client)" \
  && target_client="$(readlink -f /opt/musicflow-backend/node_modules/@prisma/client)" \
  && cp -R \
    "$(dirname "$(dirname "$source_client")")/.prisma/." \
    "$(dirname "$(dirname "$target_client")")/.prisma/"

FROM node:20-alpine AS production

RUN apk add --no-cache openssl wget \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

COPY --from=builder --chown=nestjs:nodejs /opt/musicflow-backend ./
COPY --from=builder --chown=nestjs:nodejs /workspace/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /workspace/apps/backend/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=8000

USER nestjs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8000/api/health || exit 1

CMD ["node", "dist/src/main.js"]

# ═══════════════════════════════════════════════════════════════════════════
# 1. Étape de base partagée
# ═══════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# ═══════════════════════════════════════════════════════════════════════════
# 2. Étape des dépendances (deps) avec cache store pnpm isolé
# ═══════════════════════════════════════════════════════════════════════════
FROM base AS deps
WORKDIR /app

# Copie uniquement les manifests de dépendances pour maximiser le cache de couche
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* .npmrc* ./

# Autorise explicitement l'exécution des scripts de build pour core-js dans .npmrc
RUN echo "only-built-dependencies[]=core-js" >> .npmrc

# Installation avec cache pnpm Buildx (--unsafe-perm=true autorise core-js et les scripts postinstall)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --unsafe-perm=true; \
    elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else pnpm install --unsafe-perm=true; \
    fi

# ═══════════════════════════════════════════════════════════════════════════
# 3. Étape de construction (builder) avec cache de compilation Next.js
# ═══════════════════════════════════════════════════════════════════════════
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Utilise le cache de compilation Next.js (.next/cache) pour accélérer les builds successifs
RUN --mount=type=cache,id=next,target=/app/.next/cache \
    if [ -f pnpm-lock.yaml ]; then pnpm run build; \
    elif [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    else pnpm run build; \
    fi

# ═══════════════════════════════════════════════════════════════════════════
# 4. Étape d'exécution minimale (runner)
# ═══════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copie uniquement les artefacts autonomes (output: standalone)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

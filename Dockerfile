# syntax=docker/dockerfile:1

# ---- deps (wszystkie zależności, potrzebne do builda) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* jest wbudowywane w build. Domyślnie /api/analyze, bo
# przeglądarka woła proxy na tym samym originie co frontend.
ARG NEXT_PUBLIC_ANALYSIS_API_URL=/api/analyze
ENV NEXT_PUBLIC_ANALYSIS_API_URL=$NEXT_PUBLIC_ANALYSIS_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- prod-deps (tylko runtime) ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runner ----
# next.config.ts nie ustawia output: "standalone", więc używamy `next start`.
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=build --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=nextjs:nodejs /app/next-env.d.ts ./next-env.d.ts
COPY --chown=nextjs:nodejs package.json package-lock.json ./

USER nextjs

EXPOSE 3001

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001"]

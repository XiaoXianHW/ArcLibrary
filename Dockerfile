# syntax=docker/dockerfile:1.7
#
# Multi-stage build for ArcLibrary.
# Produces a slim production image (~150 MB) that runs `next start` from
# the standalone output. Build with:
#
#   docker build -t arclibrary .
#
# Run with:
#
#   docker run --rm -p 3000:3000 \
#     -e OPENAI_API_KEY=sk-... \
#     -e NEXT_PUBLIC_SITE_URL=https://wiki.example.com \
#     arclibrary
#
# Or use the included docker-compose.yml.

ARG NODE_VERSION=22-alpine

# ---------------------------------------------------------------------------
# Stage 1 — install production + dev dependencies for the build step.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2 — build the Next.js standalone server.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `NEXT_PUBLIC_*` values bake into the client bundle at build time. Pass
# them as build args (and forward via ENV) if you need them embedded in
# the image; otherwise leave blank and set at runtime.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TWITTER_HANDLE
ARG NEXT_PUBLIC_RYBBIT_SITE_ID
ARG NEXT_PUBLIC_RYBBIT_SCRIPT_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_TWITTER_HANDLE=${NEXT_PUBLIC_TWITTER_HANDLE}
ENV NEXT_PUBLIC_RYBBIT_SITE_ID=${NEXT_PUBLIC_RYBBIT_SITE_ID}
ENV NEXT_PUBLIC_RYBBIT_SCRIPT_URL=${NEXT_PUBLIC_RYBBIT_SCRIPT_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 3 — minimal runtime image.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

# Static assets and the standalone server bundle.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

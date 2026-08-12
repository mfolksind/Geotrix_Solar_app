FROM node:22-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
# Install build tools for native dependencies (like bcrypt)
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV CI=1
RUN pnpm run build

# Stage 3: Install production dependencies only
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Stage 4: Production server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=6000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy prod dependencies and built files
COPY --from=prod-deps --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/package.json ./package.json

# Create directories for static assets and logs, set permissions
RUN mkdir -p public/uploads logs
RUN chown -R expressjs:nodejs public logs

USER expressjs

EXPOSE 6000

CMD ["node", "dist/server.js"]

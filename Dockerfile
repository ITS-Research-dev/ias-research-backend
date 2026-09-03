# ---- Stage 1: Builder ----
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Install all dependencies (including devDeps needed to build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Generate Prisma client and build NestJS
RUN pnpm prisma generate
RUN pnpm build

# ---- Stage 2: Production ----
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma client in production image
RUN pnpm prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main"]

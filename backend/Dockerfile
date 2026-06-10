FROM node:22-alpine

WORKDIR /app

# Native build tools required by bcrypt (C++ addon compilation)
RUN apk add --no-cache python3 make g++

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests and Prisma config first (better layer caching)
COPY package.json pnpm-lock.yaml prisma.config.js ./

# Copy prisma schema so the client can be generated during install
COPY prisma ./prisma/

# Install all dependencies — allow build scripts for bcrypt & prisma inside docker sandbox
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# Generate Prisma client for the linux-musl target (Alpine)
RUN pnpm prisma generate

# Copy application source
COPY src ./src

EXPOSE 5000

# Run pending migrations then start the API server
CMD ["sh", "-c", "pnpm prisma migrate deploy && node src/index.js"]

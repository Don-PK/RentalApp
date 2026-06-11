# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files and install
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .

# VITE_API_BASE_URL is intentionally left blank — Nginx proxies /api/ to backend
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm build

# ---- Production Stage ----
FROM nginx:1.27-alpine AS runner

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config template
COPY nginx.conf /etc/nginx/conf.d/app.conf.template

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Set default backend URL and start nginx with environment substitution
ENV BACKEND_URL=http://backend:5000/
CMD ["sh", "-c", "envsubst '$$BACKEND_URL' < /etc/nginx/conf.d/app.conf.template > /etc/nginx/conf.d/app.conf && nginx -g 'daemon off;'"]

# Rental Management App

> Full-stack rental/property management application — Node.js/Express backend + React/Vite frontend + PostgreSQL.

## Repository layout

```
rental-management-app/
├── backend/          # Express API, Prisma ORM, migrations
├── frontend/         # Vite + React SPA served by Nginx
├── docker-compose.yml
└── .env.example      # Docker Compose secrets template
```

---

## 🐳 Running with Docker (recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set secure values for `POSTGRES_PASSWORD` and `JWT_SECRET`.

### 2. Build and start all services

```bash
docker compose up --build
```

| Service  | URL                        | Notes                      |
|----------|----------------------------|----------------------------|
| Frontend | http://localhost            | React app served by Nginx  |
| Backend  | http://localhost:5000       | Express REST API           |
| Database | localhost:5432 (internal)   | PostgreSQL (no host port)  |

> Prisma migrations run automatically on backend startup.

### 3. Stop

```bash
docker compose down
```

To also remove the database volume (⚠️ deletes all data):

```bash
docker compose down -v
```

---

## 💻 Local development (without Docker)

### Prerequisites
- Node.js 20+ and pnpm
- PostgreSQL running locally

### 1. Install dependencies

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_SECRET, PORT

# Frontend (optional — defaults to http://localhost:5000)
cp frontend/.env.example frontend/.env
```

### 3. Run database migrations

```bash
cd backend
pnpm prisma migrate deploy
```

### 4. Start dev servers

```bash
# Terminal 1
cd backend && pnpm dev

# Terminal 2
cd frontend && pnpm dev
```

Frontend dev server: `http://localhost:5173`  
Backend API: `http://localhost:5000`

---

## Prisma

Schema: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)  
Migrations: `backend/prisma/migrations/`

Useful commands (run from `backend/`):

```bash
pnpm prisma studio          # visual DB browser
pnpm prisma migrate dev     # create a new migration in dev
pnpm prisma migrate deploy  # apply migrations (used in production/Docker)
pnpm prisma generate        # regenerate Prisma client after schema changes
```

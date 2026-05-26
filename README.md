# Rental Management App

> Full-stack rental/property management application (Node.js backend + React frontend).

## Repository layout

- `backend/` — Express API, Prisma schema and migrations
- `frontend/` — Vite + React single-page app

## Prerequisites

- Node.js 18+ and pnpm (or npm)
- PostgreSQL database (or the DB configured in `prisma/schema.prisma`)

## Quick start

1. Install dependencies

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

2. Configure environment

- Copy example env files if present and set your database URL and JWT secrets in the backend.

3. Run database migrations (backend)

```bash
cd backend
pnpm prisma migrate deploy
```

4. Start backend and frontend (development)

```bash
# terminal 1
cd backend
pnpm dev

# terminal 2
cd frontend
pnpm dev
```

5. Open the frontend in your browser (default Vite URL: `http://localhost:5173`)

## Tests

If tests exist, run them per-package. Example:

```bash
cd backend && pnpm test
cd frontend && pnpm test
```

## Prisma

Prisma schema is in `backend/prisma/schema.prisma`. Migrations are under `backend/prisma/migrations`.

## Notes

- This README is a concise companion to the code. If you want, I can expand sections (environment examples, seed data, Docker, CI, or deployment steps).

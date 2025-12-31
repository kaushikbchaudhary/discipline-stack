# Execution OS

Execution OS is a goal-agnostic execution tracker with a 30-day plan and proof capture, built for a 100% free deployment stack.

## Versioning
- Current version: 0.4.0
- Phase docs: `docs/phase/v0.1.0.md`, `docs/phase/v0.2.0.md`, `docs/phase/v0.3.0.md`, `docs/phase/v0.3.1.md`, `docs/phase/v0.4.0.md`

## Features
- 30-day plan with editable daily tasks (imports overwrite older plans).
- Today view with task check-off and proof capture (text/link).
- AI plan import (JSON) for fast planning.
- Dashboard with completion overview and artifact timeline.
- Auth via Supabase.
- Demo route (`/demo`) that works without login using localStorage.
- JSON export endpoint for progress data.

## Tech
- Next.js static export + TypeScript
- Tailwind CSS
- Prisma schema + Supabase Postgres (no Prisma client at runtime)
- Supabase Auth
- Cloudflare Workers backend
- Zod validation
- Jest unit tests
- ESLint + Prettier

## Getting started
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Note: Prisma CLI currently supports Node 20/22 LTS. If you hit a schema engine error on newer Node versions, switch to an LTS version before running migrations.

## Environment variables
Copy `.env.example` to `.env` and update values.

Required:
- `DATABASE_URL` (Supabase Postgres connection string, for migrations only)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (Cloudflare Worker base URL)

## Database Initialization (First Deploy Only)
Execution OS uses Prisma only for schema definition and the initial Postgres migration.

1. Set `DATABASE_URL` to your Supabase Postgres connection string.
2. Apply the single migration in `prisma/migrations/20260101000000_init_execution_os_schema/`.
3. Run the RLS setup in `docs/database/rls.sql` inside Supabase SQL editor.

Do not run migrations at runtime. All schema changes after the first deploy should be done
with new migrations locally, then applied to Supabase manually.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`

## Cloudflare Worker backend
The Worker lives in `workers/` and exposes REST endpoints for the static frontend.

Setup:
1. `cd workers`
2. `npm install`
3. `wrangler dev`

Set these Worker env vars in `workers/wrangler.toml` or the Cloudflare dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Firebase static hosting
1. Build the static export: `npm run build`
2. Deploy the `out/` directory to Firebase Hosting.

## Key routes
- `/today` - Daily execution and proof.
- `/dashboard` - Completion overview.
- `/plan` - 30-day plan grid and task editing.
- `/plan/import` - AI plan import.
- `/review` - Weekly review questions.
- `/demo` - LocalStorage demo mode.

## Data model highlights
See `prisma/schema.prisma` for full schema.

## Future improvements
- Reminders (email or notifications).
- Inline charts for monthly trends.
- Team mode for accountability partners.

## Dashboard docs
See `docs/dashboard.md` for visual meaning and metrics definitions.

## AI Plan Import
- Generate a strict ChatGPT prompt and import JSON plans at `/plan/import`.
- Validation enforces date order and time fields.

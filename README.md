# Execution OS

Execution OS is a production-ready Next.js app for simple daily execution tracking with a 30-day plan and proof capture.

## Versioning
- Current version: 0.4.0
- Phase docs: `docs/phase/v0.1.0.md`, `docs/phase/v0.2.0.md`, `docs/phase/v0.3.0.md`, `docs/phase/v0.3.1.md`, `docs/phase/v0.4.0.md`

## Features
- 30-day plan with editable daily tasks (imports overwrite older plans).
- Today view with task check-off, proof capture (text/link/file up to 20MB), and push notifications.
- AI plan import (JSON) for fast planning.
- Dashboard with completion overview and artifact timeline.
- Auth-protected routes with NextAuth (credentials + optional Google).
- Demo route (`/demo`) that works without login using localStorage.
- JSON export endpoint for progress data.

## Tech
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite (local dev)
- NextAuth
- Zod validation
- Jest unit tests
- ESLint + Prettier

## Getting started
```bash
npm install
npm run prisma:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Note: Prisma CLI currently supports Node 20/22 LTS. If you hit a schema engine error on newer Node versions, switch to an LTS version before running migrations.

### Credentials for seed user
- Email: `demo@executionos.local`
- Password: `password123`

## Environment variables
Copy `.env.example` to `.env` and update values.

Required:
- `DATABASE_URL` (SQLite default: `file:./dev.db`)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Optional (Google auth):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_ENABLED=1`

Optional (Push notifications):
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (e.g. `mailto:you@example.com`)
- `PUSH_CRON_SECRET` (optional shared secret for the dispatch endpoint)

## Switching to Postgres (production)
1. Update `DATABASE_URL` to a Postgres connection string.
2. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
3. Run `npm run prisma:migrate` to create migrations in your new database.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run prisma:migrate`
- `npm run db:seed`

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
- File upload for goal artifacts.
- Reminders (email or notifications).
- Inline charts for monthly trends.
- Team mode for accountability partners.

## Dashboard docs
See `docs/dashboard.md` for visual meaning and metrics definitions.

## AI Plan Import
- Generate a strict ChatGPT prompt and import JSON plans at `/plan/import`.
- Validation enforces date order, time fields, and daily capacity limits.

## Push notifications
Execution OS can send background notifications at task start times via Web Push.

Setup:
1. Generate VAPID keys (example below).
2. Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` to `.env`.
3. (Optional) Set `PUSH_CRON_SECRET` to protect the dispatch endpoint.
4. Schedule a cron job to hit `/api/push/dispatch` every 5 minutes.

Example key generation:
```bash
npx web-push generate-vapid-keys
```

Cron example (Vercel):
- Create a cron job to `POST https://your-domain.com/api/push/dispatch`
- Add `Authorization: Bearer <PUSH_CRON_SECRET>` if you set a secret.

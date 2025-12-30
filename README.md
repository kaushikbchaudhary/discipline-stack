# Execution OS

Execution OS is a production-ready Next.js app that turns a daily timetable + 30-day tracker into a forced execution loop. A day completes only when mandatory blocks are done and a non-replaceable output is attached.

## Features
- Onboarding that generates a default timetable from wake time + block durations.
- Timetable builder with overlap detection and a schedule lock toggle.
- 30-day execution tracker with daily checklists and non-negotiables.
- Today view with progress bar, mandatory block completion, and output capture.
- Progress analytics with streaks, 7-day completion rate, and weekly review.
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
- `/today` - Core execution loop.
- `/timetable` - Schedule CRUD with overlap protection.
- `/plan` - 30-day tracker and task editing.
- `/progress` - Streaks + completion rate.
- `/review` - Weekly review questions.
- `/export` - Download JSON snapshot.
- `/demo` - LocalStorage demo mode.

## Data model highlights
See `prisma/schema.prisma` for full schema.

## Future improvements
- File upload for non-replaceable output.
- Reminders (email or notifications).
- Inline charts for monthly trends.
- Team mode for accountability partners.

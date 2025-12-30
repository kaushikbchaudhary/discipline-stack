# Execution OS

Execution OS is a production-ready Next.js app that turns a daily timetable + 30-day tracker into a forced execution loop. A day completes only when mandatory blocks are done and a non-replaceable output is attached.

## Versioning
- Current version: 0.3.1
- Phase docs: `docs/phase/v0.1.0.md`, `docs/phase/v0.2.0.md`, `docs/phase/v0.3.0.md`, `docs/phase/v0.3.1.md`

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
- `/dashboard` - Progress & achievement dashboard.
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

## Dashboard docs
See `docs/dashboard.md` for visual meaning and metrics definitions.

## Phase 2 – Execution Reinforcement
- Execution Debt: missed mandatory blocks create debt that must be resolved before completing a day.
- Focus Mode: hides future blocks and distractions, shows only the current block and countdown.
- Output Quality Gate: requires structured text (Problem/Decision/Outcome) or a valid URL.
- Failure Days: intentional off-days with a reflection note; max 2 per 30-day cycle.
- Weekly Insights: missed blocks by category, most skipped hour, consistency trend.
- Plan Lock + Drift Detection: plan locked by default, changes require a reason, warns on frequent edits.
- Timeline: 30-day execution history with outputs, notes, and debt status.

## Phase 3.1 – Retention & Honesty Layer
- Daily Win + Salvaged days
- Next Action enforcement per block
- Resistance logging (enum only)
- Quiet Mode (weekly)
- Time Reality check
- Output portability (Markdown + PDF)

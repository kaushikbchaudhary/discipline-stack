# Free Stack Setup (Supabase + Worker + Static Frontend)

## 1) Supabase project
1. Create a Supabase project.
2. Go to Project Settings → API.
3. Copy:
   - Project URL
   - anon public key
   - service_role key
4. Go to Project Settings → Database.
5. Copy the Postgres connection string (URI format).

## 2) Frontend .env
Set these in `.env`:
- DATABASE_URL="postgresql://user:pass@host:5432/db"
- NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
- NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
- NEXT_PUBLIC_API_URL="http://127.0.0.1:8787"
- NEXT_PUBLIC_VAPID_PUBLIC_KEY="BKm..."

## 3) Worker env vars
Set these in `workers/wrangler.toml` or the Cloudflare dashboard:
- SUPABASE_URL="https://xxxx.supabase.co"
- SUPABASE_ANON_KEY="eyJhbGciOi..."
- SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
- VAPID_PUBLIC_KEY="BKm..."
- VAPID_PRIVATE_KEY="xxxxx"
- VAPID_SUBJECT="mailto:you@example.com"

## 4) VAPID keys (Web Push)
Generate keys:
```
npx web-push generate-vapid-keys
```
Use the public key in the frontend and both keys in the Worker.

## 5) Start the Worker locally
```
cd workers
npm install
wrangler dev
```
Copy the Worker URL into `NEXT_PUBLIC_API_URL`.

## 6) Start the frontend
```
npm install
npm run dev
```

## 7) Database initialization (first deploy only)
1. Apply the single migration in `prisma/migrations/20260101000000_init_execution_os_schema/`.
2. Run the RLS SQL in `docs/database/rls.sql`.

## 8) Static deploy
1. Build: `npm run build`
2. Deploy the `out/` directory to Firebase Hosting.

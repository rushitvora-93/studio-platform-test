# Studio Platform — Technical Test

A Next.js + Supabase recording studio web app. This is the **technical test version** of a real client project: the frontend is fully built, your job is to implement the missing backend wiring for the **Beat Marketplace** feature.

## What you need to deliver

See [`TEST_BRIEF.md`](./TEST_BRIEF.md) for the full scope, evaluation criteria and deadline.

**Short version:** make the beat marketplace fully functional from upload to playback to favorites — using your own Supabase project. No Stripe / payment required.

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack, Server Actions)
- **Language:** TypeScript
- **Auth & DB:** Supabase (Auth + PostgreSQL + Storage + RLS)
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **Validation:** Zod v4
- **Icons:** Lucide React

## Setup (5 minutes)

### 1. Fork this repo

Click "Fork" on GitHub. **All your work happens on your fork** — open the PR on your own fork, not against this repo.

### 2. Clone and install

```bash
git clone https://github.com/<your-username>/studio-platform-test
cd studio-platform-test
npm install
```

### 3. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier is enough)
2. Wait for it to provision (~2 min)
3. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and paste your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5. Run the database migrations

In your Supabase dashboard → **SQL Editor**, run the migrations in order:

```
supabase/migrations/20260313_initial_schema.sql
supabase/migrations/20260314_contact_messages.sql
supabase/migrations/20260315_slot_locks.sql
supabase/migrations/20260318_add_phone_to_contact.sql
supabase/migrations/20260319_fix_rls_recursion.sql
supabase/migrations/20260330_storage_buckets.sql
```

Then run the seed file:

```
supabase/seed/seed.sql
```

This creates the studios, default pricing, platform settings, and CMS content.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the homepage.

### 7. Create an admin user

1. Go to `/signup` and create an account
2. In your Supabase dashboard → **Table Editor** → `profiles` table, find your user and set `role = 'admin'`
3. You can now access `/admin`

## Project structure

```
src/
├── app/
│   ├── (auth)/                # Login, signup, forgot-password
│   ├── (public)/              # All public + authenticated pages
│   │   ├── page.tsx           # Homepage
│   │   ├── beats/             # Beat marketplace (your main focus)
│   │   ├── booking/           # Studio booking flow
│   │   ├── mixing/            # Mixing service
│   │   ├── account/           # Member space
│   │   ├── admin/             # Admin panel
│   │   └── engineer/          # Engineer backoffice
│   └── auth/callback/         # OAuth callback
├── actions/                   # Server actions (extend src/actions/beats.ts)
├── components/
│   ├── beats/                 # BeatSwipeCard, AudioPlayer (REUSE these)
│   ├── booking/
│   ├── mixing/
│   ├── home/
│   ├── shared/
│   └── ui/
├── lib/
│   ├── supabase/              # Client setup (client, server, middleware)
│   ├── pricing.ts
│   └── mock-beats.ts          # Remove this once you have real beats
├── schemas/                   # Zod schemas
├── stores/                    # Zustand stores
└── types/                     # TypeScript types
supabase/
├── migrations/                # SQL migrations (run in order)
└── seed/seed.sql              # Initial data
```

## Important rules

- ✅ **Reuse the existing frontend** — do not redesign anything. The components are already built (`BeatSwipeCard`, `AudioPlayer`, etc.). Your job is to make them work end-to-end with real data.
- ✅ **Use server actions** — extend `src/actions/beats.ts`, don't create new API routes
- ✅ **Use the existing Supabase clients** — `src/lib/supabase/server.ts` for server, `src/lib/supabase/client.ts` for client components
- ✅ **Create proper RLS policies** — anyone reading public data, only admins/engineers uploading beats, only purchasers/owners reading private files
- ✅ **Self-test before submitting** — record a 2-minute video showing your feature works end-to-end
- ❌ **Do not refactor or redesign** the existing UI
- ❌ **Do not add unrelated dependencies** or build tools
- ❌ **Do not push placeholder data** — everything must persist to Supabase

## Available scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Lint check
npm run typecheck    # TypeScript check
```

## Submission checklist

Before submitting, make sure:

- [ ] Beat upload from `/admin/beats` works (audio + cover + metadata persist to Supabase)
- [ ] Audio formats accepted: WAV, MP3, AIFF, FLAC
- [ ] Files are uploaded to Supabase Storage with proper buckets and RLS
- [ ] The marketplace at `/beats` shows real beats from the database
- [ ] The play button on the swipe card actually plays the preview (with progress bar)
- [ ] **Audio AUTO-PLAYS** when a beat becomes the active card (after first user interaction)
- [ ] Previous audio stops when the next beat becomes active (no overlap)
- [ ] Swipe left rejects, swipe right adds to favorites/cart
- [ ] Logged-in users can see their favorites/cart on a dedicated page
- [ ] You recorded a 2-minute video showing the full flow working
- [ ] You opened a Pull Request on **your own fork** (not on the original repo)
- [ ] You sent the PR link + video link via Upwork message

## Questions?

Read `TEST_BRIEF.md` first. If something is still unclear, ask via Upwork before starting to code — better than wasting your time guessing.

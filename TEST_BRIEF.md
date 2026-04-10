# Technical Test — Beat Marketplace

Hi,

Thanks for applying. Before moving forward with the full mission, I'd like to evaluate your skills on a real piece of the project, not on a generic test. The result of this test directly determines who gets hired.

This test is **unpaid**, but the full mission (which is significantly larger) is paid. I respect your time — if you don't want to do an unpaid test, that's totally fine.

## What you need to do

Fork this repository and implement the **Beat Marketplace feature** end to end.

**Repository:** (this repo)

The frontend is already built — you must **reuse the existing components**, not rebuild them. Your job is to make the feature actually work with real data, not to redesign anything.

## Scope

### 1. Beat upload from the admin back-office

On `/admin/beats`, an admin (or user with `engineer` role) can upload a new beat with:

- **Audio file** — formats accepted: **WAV, MP3, AIFF, FLAC** (max 200MB)
- **Cover image** — JPG, PNG, WEBP (max 10MB)
- **Metadata:** title, BPM, key, genre, tags, simple license price, exclusive license price
- **Publish / Draft** toggle

Files must be uploaded to **Supabase Storage** with proper buckets and RLS policies:

- `beat-previews` bucket (public) → cover image + 30-second preview audio
- `beat-files` bucket (private) → full audio file, only accessible after purchase

The validation must happen server-side using server actions in `src/actions/beats.ts`.

### 2. Beat marketplace with swipe + audio playback

On `/beats`, visitors (no account required) can:

- See published beats one by one in the swipe card UI (already built — reuse `BeatSwipeCard`)
- **Actually listen to the audio preview** — the play button must work end-to-end (currently it's disabled because no audio is wired in the database)
- **Audio must AUTO-PLAY** when a beat becomes the active card (i.e. when you land on it or swipe to the next one). The user shouldn't have to click play manually — it's a Tinder-like discovery experience, the music should start by itself
- The previous beat's audio must stop when the next one starts (no overlapping)
- See progress bar, play/pause, and 30-second duration display
- Pause/resume button to manually control playback
- Swipe **left** (reject / next beat — also stops current audio and plays the next)
- Swipe **right** (add to favorites/cart — also stops current audio and plays the next)
- See the counter (1/N)

The audio player must stream the real preview file from Supabase Storage.

**Important note about autoplay:** browsers block autoplay with sound until the user has interacted with the page at least once. Handle this gracefully — for example, autoplay starts working after the user clicks "C'est parti" on the onboarding screen, or after the first manual play. Don't crash, don't show errors.

### 3. Favorites / cart page

A simple page (`/account/favorites` or similar) where logged-in users can:

- See the beats they've added to their favorites/cart
- Remove items from the list

**No payment / Stripe required for this test.** Just the UI + database persistence.

## What you must NOT do

- ❌ Rebuild or redesign the existing frontend components
- ❌ Use mock data — everything must persist to Supabase
- ❌ Hardcode anything — use the existing types, schemas, server actions, and Supabase client
- ❌ Push placeholder images or fake metadata
- ❌ Add new tooling files (no new ESLint/Prettier config, no new build setup)
- ❌ Skip self-testing — if it doesn't work end-to-end on your side, don't submit it

## What you must do

- ✅ Reuse `src/components/beats/beat-swipe-card.tsx` and `src/components/beats/audio-player.tsx`
- ✅ Use `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`
- ✅ Extend server actions in `src/actions/beats.ts`
- ✅ Add a SQL migration in `supabase/migrations/` for the storage buckets and RLS policies
- ✅ Validate file types and sizes server-side
- ✅ Add RLS policies: only authenticated admins/engineers can upload beats, anyone can read previews, only purchasers can read full files
- ✅ Self-test on your local machine + your own Supabase project before submitting

## Deliverables

1. **Pull Request on your own fork** with all your code changes
2. **2-minute video** (Loom, YouTube unlisted, anything) showing:
   - You uploading a real beat from the admin (audio + cover + metadata)
   - The beat appearing in the marketplace
   - You **playing the preview audio** (sound on, please)
   - You swiping through beats and adding one to favorites
   - The favorites page showing the saved beat
3. **Your Supabase project URL** so I can verify the buckets and tables (you can delete the project right after my review if you want)

## Deadline

**72 hours** from when I send you the test. Late submissions will not be evaluated.

## Evaluation criteria

| Criteria | Weight |
|---|---|
| Audio playback works end-to-end (this is the main thing) | High |
| Reuses the existing frontend without redesigning | High |
| Code quality (TypeScript types, no `any`, clean server actions) | High |
| Supabase Storage buckets and RLS policies are correctly set up | High |
| Self-tested before submission (the video proves it works) | High |
| Respects the 72h deadline | Medium |
| Clean commit history (atomic, descriptive messages) | Medium |
| Asks clarifying questions before coding (if needed) | Bonus |

## Why this test exists

I've already been burned by a developer who claimed experience but delivered broken features and asked me to debug their work. I'm not paying for that experience again.

This test is the fastest way for both of us to know if we're a good fit. If you can't make a basic beat upload + audio playback work end-to-end, the full mission is going to be a nightmare. If you can, the rest of the project is straightforward.

If you have questions about the brief, ask me **before starting**. Don't waste time guessing. I respond fast.

Looking forward to seeing your work.

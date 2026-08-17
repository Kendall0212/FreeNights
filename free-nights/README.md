# Free Nights

A shared availability tracker for a friend group. Everyone opens one link,
taps the mornings / afternoons / evenings they're free, and the best times to
meet up light up automatically.

- **Stack:** React 18 + TypeScript + Vite + Tailwind, Supabase (Postgres +
  realtime), deploy on Vercel.
- **No accounts.** Access is by unguessable share link, like a shared Google
  Sheet. Each person is remembered on their own device.

## Run locally

```bash
pnpm install
pnpm dev
```

`.env.local` is already filled in with the project URL and publishable key, so
it should just work. (`.env.example` shows the two variables if you ever need
to recreate it.)

## Deploy (Vercel — same as DogEared)

1. Push this folder to a new GitHub repo.
2. Import it in Vercel. Framework preset: **Vite**. Build command `pnpm build`,
   output dir `dist`.
3. Add two Environment Variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`

   (Same values as `.env.local`.)
4. Deploy. Share the deployed URL — the app appends `?g=<code>` per group.

## Supabase

Project `free-nights` (region ap-southeast-2). Three tables: `groups`,
`members`, `availability`. RLS is on with anon read/write policies — this is
deliberate: security comes from the unguessable `share_code` in the link, not
from logins. If you later want it locked down, the natural upgrade is adding
Supabase Auth and scoping policies to group membership.

Realtime is enabled on `members` and `availability`, so updates from friends
appear live.

## How the code is laid out

- `src/lib/` — Supabase client, types, date + colour helpers, data access
  (two-step fetches, no FK joins), overlap ranking.
- `src/hooks/useGroup.ts` — loads a group and keeps it live over realtime.
- `src/components/` — Landing, JoinName, Header, Calendar, DateSheet, Overlap.
- `src/App.tsx` — routes between landing → join → the calendar / best-times
  views based on the URL and who this device is.

## Ideas for v2

RSVP once a night is picked, nudges/reminders, recurring nights, an ICS export
to drop the chosen time straight into calendars.

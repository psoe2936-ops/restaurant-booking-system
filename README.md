# Restaurant Booking Platform

A website for a mid-size restaurant in Myanmar. Guests see the menu and book a table online. Staff manage bookings in an admin dashboard.

**Live site:** https://restaurant-booking-system-ufyz.vercel.app

## Tech stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres), Clerk, Vercel, GitHub Actions.

## Run it on your computer

1. Install Node.js 20 or newer.
2. Install packages:

```bash
npm install
```

3. Create a `.env.local` file with these names (get the values from Supabase and Clerk):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/admin
```

4. Start the server:

```bash
npm run dev
```

Open http://localhost:3000.

## Database

SQL files are in `supabase/migrations/`. They are the source of truth for the database. `supabase/seed.sql` has sample data.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local server |
| `npm run build` | Make a production build |
| `npm run lint` | Check the code style |
| `npm run typecheck` | Check TypeScript types |

## Docs

The technical design is in `docs/`.
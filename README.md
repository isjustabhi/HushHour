# HushHour

![HushHour chat screenshot](public/hero-chat.png)

**Five minutes. One stranger. Nobody alone tonight.**

HushHour matches verified university students for short, anonymous, moderated peer support chats. Sessions are time-bounded, safety-first, and designed for the late-night gap between "I need someone now" and formal counseling.

- Safety architecture: [`docs/SAFETY.md`](docs/SAFETY.md)
- Research memo: [`docs/RESEARCH_MEMO.md`](docs/RESEARCH_MEMO.md)
- Demo script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- Privacy posture: [`docs/PRIVACY.md`](docs/PRIVACY.md)
- Ethics and product boundaries: [`docs/ETHICS.md`](docs/ETHICS.md)
- Live demo link: `https://hushhour-demo.example.com`

## Stack

- Next.js 16 + TypeScript + App Router
- Supabase (Postgres, auth-linked data, realtime)
- Claude Haiku moderation via `@anthropic-ai/sdk`
- NextAuth email magic links (`.edu` only)
- Tailwind + shadcn/ui
- PostHog (anonymous product analytics only)

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and fill values:
   ```bash
   cp .env.local.example .env.local
   ```
3. Apply Supabase migrations in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_journal_entries.sql`
   - `supabase/migrations/003_extend_votes.sql`
4. Run dev server:
   ```bash
   npm run dev
   ```

## Core Product Guarantees

- `.edu`-restricted access with hashed identifiers
- Real-time message moderation before delivery
- Crisis route separated from peer matching
- Time-bounded sessions (5 min default, max 15)
- Ephemeral messaging with TTL cleanup
- Aftercare and resources after every chat

## Repo Structure

- `app/` - routes and API handlers
- `components/` - UI primitives and flows
- `lib/` - domain logic, prompts, schemas, clients
- `supabase/` - SQL migrations and cleanup function
- `docs/` - hackathon-facing documentation

## License

MIT

# Godot Learning Lab

Browser lessons and Canvas practice activities that teach real Godot 4 concepts to high-school beginners on low-end laptops. Final team games are built in the **real Godot editor** on school computers. Interface defaults to **Bahasa Indonesia**, with full English.

> Every activity is a browser simulation of a Godot concept. GDScript is never executed here.

- Product baseline: [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) · Build brief: [`MASTER_BUILD_PROMPT.md`](MASTER_BUILD_PROMPT.md)
- Status, test evidence, and release blockers: [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md)
- Architecture, schema, and RLS: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Operator runbook (provisioning, recovery, export, deletion, backup, incidents): [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- Deployment and staging: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- Teacher and student walkthroughs: [`docs/CLASSROOM_GUIDE.md`](docs/CLASSROOM_GUIDE.md)
- Tests and measurements: [`docs/TESTING.md`](docs/TESTING.md) · Godot snippet checks: [`docs/GODOT_VERIFICATION.md`](docs/GODOT_VERIFICATION.md)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · next-intl 4 · Zod 4 · Supabase (Postgres, Auth, RLS) via `@supabase/ssr` · Canvas 2D · Vitest · Playwright + axe. Node ≥ 22.12, npm (lockfile committed). Godot pinned for snippets: **4.6.1 stable**.

## Run locally from a clean checkout

Requires Node 22.12+ (tested on 24.12), Docker Desktop (for the local Supabase stack).

```bash
npm ci
npx supabase start                # local Postgres/Auth/Mailpit in Docker
npx supabase db reset             # applies supabase/migrations/* (schema, RLS, seeded content)
cp .env.example .env.local        # then paste values from `npx supabase status`
npm run seed:demo                 # optional: synthetic LOCAL-ONLY demo data (refuses remote URLs)
npm run build && npm start        # http://127.0.0.1:3000
```

Demo accounts (local only, printed by `seed:demo`): `guru.sari@example.test`, `siswa1@example.test` … password `demo-lokal-2026`. Never use these anywhere but a local stack.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Unit tests: simulations, checks, content, i18n, validation, CSV |
| `npm run test:db` | RLS/invariant/concurrency tests against the local stack |
| `npm run test:e2e` | Browser workflows, accessibility, performance (needs `npm run build` + local stack) |
| `SOAK=1 npx playwright test soak` | 15-minute play/reset/navigation memory soak |
| `npm run content:sql` | Regenerate the content seed migration from `content/` |
| `npm run db:types` | Regenerate `lib/db/types.ts` from the local schema |
| `npm run provision -- --role teacher --email … --name …` | Operator: invite a teacher/student |
| `npm run retention` | Operator: retention review (dry run by default) |
| `npm run godot:check` | Export seeded GDScript to a scratch project for the pinned editor |

## Layout

```
app/                 routes (student/, teacher/, sign-in, privacy, auth/confirm, export route)
components/          small shared UI (status badge, blocks, header controls)
features/            per-domain server actions + client forms (lessons, surveys, teams, projects, reviews)
exercises/           activity schemas, registered checks, runtime loop/input, eight simulations
content/             bilingual lessons, surveys, 12-week plan, rubric (source of truth)
lib/                 auth/session, supabase clients, db queries, validation, time, csv, autosave
messages/            UI strings (id.json default, en.json)
supabase/            config, migrations (schema → invariants → RLS/RPC → content), email templates
scripts/             provision, seed-demo, retention, content SQL, Godot snippet export
tests/               unit/, db/, e2e/
```

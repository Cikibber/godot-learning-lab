# Deployment and staging

Nothing has been deployed. These steps produce a staging environment for review; production requires the release conditions in `IMPLEMENTATION_STATUS.md`.

## Environments

Use separate Supabase projects for **development** (local Docker stack), **staging**, and **production**. Never seed demo data into staging/production (`seed:demo` refuses non-local URLs anyway).

Before choosing plans: check current Supabase and hosting (e.g. Vercel or a school Node host) pricing, quotas, regions, backup retention, and terms for a school deployment with minors' data. Do not assume a free plan covers a school or offers adequate backups. Choose a region acceptable to the school.

## 1. Supabase project (staging, then production)

1. Create the project in the approved region.
2. Link and push migrations from a clean checkout:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push          # applies 001…004 in order
   ```
3. Auth settings (Dashboard → Authentication):
   - Disable public sign-ups; keep the Email provider enabled; disable anonymous sign-ins.
   - **Site URL:** `https://<your-domain>`; **Redirect URLs:** `https://<your-domain>/auth/confirm`.
   - Email templates: paste `supabase/templates/invite.html` and `recovery.html` (they use `{{ .TokenHash }}` with `/auth/confirm`).
   - Configure a school-approved SMTP sender (the built-in sender is rate-limited and not for production).
   - Minimum password length 10.
4. API keys: copy the **publishable** key for the web app. Keep the **secret** key for operator tooling only.
5. Confirm RLS is enabled on all public tables (Dashboard → Database → Tables) and that the `private` schema is not in the exposed schemas list (API settings: expose `public` only).

## 2. Web app host

Node ≥ 22.12. Build `npm ci && npm run build`, start `npm start` (or deploy to Vercel with the default Next.js preset).

Environment variables (web host):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` |
| `SCHOOL_CONTACT_NAME`, `SCHOOL_CONTACT_EMAIL` | real school privacy contact |

Do **not** set `SUPABASE_SECRET_KEY` on the web host. Serve over HTTPS only. The app sets CSP and security headers itself (`next.config.ts`). Missing public variables fail at startup with a clear message.

## 3. Staging smoke test

1. Provision a test teacher and two test students (operator commands in `docs/OPERATIONS.md`) using school test addresses.
2. Walk through `docs/CLASSROOM_GUIDE.md` (class, code, approval, lesson, review, survey, team, proposal, milestone, rubric, export).
3. Run the automated suites against staging where appropriate (E2E needs operator keys for fixtures: run only against staging, never production).
4. Perform a restore drill (OPERATIONS.md).

## Updates and rollback

- Ship schema changes only as new forward migrations; test them on staging with a copy of production-like synthetic data.
- Web rollback: redeploy the previous build. DB rollback: forward-fix migration; never drop tables holding student work.
- New lesson content: add a new `version` in `content/`, run `npm run content:sql` into a **new** migration file (do not edit `…004_content_v1.sql` after release), deploy, then teachers assign the new version.

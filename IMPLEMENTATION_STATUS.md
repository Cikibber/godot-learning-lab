# Implementation status and handoff

**Date:** 13 October 2026 · **State:** Phases 0–3 implemented and verified locally; Phase 4 automated gates pass; **not released** — external/manual release blockers listed below.

## 1. Outcome

A working MVP of Godot Learning Lab: invite-only teacher/student app (Bahasa Indonesia default, full English) with eight playable Canvas activities teaching Godot 4 concepts, versioned bilingual lessons and surveys, draft/save/submit/review/revise workflows, private surveys with teacher summaries, transactional teams, versioned proposals and milestones, private contribution statements, a 60/40 rubric, teacher dashboard, and safe CSV exports — on Supabase Postgres with RLS and DB-level invariants.

### Implemented features

- **Auth & roles:** invite-only (public sign-up disabled), operator provisioning script, invite/recovery templates via `/auth/confirm`, role from `app_metadata` only, verified claims + DB role on every server action.
- **Classes:** create/archive, timezone, hashed rotating class codes (expiry, max uses, revocation, rate-limited generic redemption), mandatory approval, withdraw/reinstate, school-computer sessions.
- **Curriculum:** 8 modules × (explanation, worked example, activity, checks, hints, code question, reflection, fidelity notes, misconceptions, "Try in Godot" card with parse-verified GDScript for 4.6). Teacher publishes/orders/dates/closes assignments.
- **Activities:** Scene Composer, Movement, Collision, Control, Signal, State, Timer, Mini-game — fixed step, seeded randomness, bounded catch-up, hidden-tab pause, input cleared on blur, lazy per-kind chunks, 30 FPS render option, on-screen pad, keyboard capture only on focus, **text/step mode** equivalent, registered checks, server recomputation.
- **Work:** debounced + explicit save with acknowledged status, optimistic concurrency, bounded retry, local session copy with restore, conflict detection, idempotent submit, immutable submissions, revisions as new attempts, review history.
- **Surveys:** exact R1–R12 / P1–P14 with bounds and "prefer not to answer"; drafts, versioned resubmission, teacher counts/percentages with skipped counts, private questions excluded from aggregates and exports, individual drill-down.
- **Teams & project:** same-class 3–4 member teams with concurrency-safe capacity, exceptions, private preference panel; proposal versions (changes requested → new version → approval of that version); 3 milestones with https-only school links; teacher observations; private contribution statements; rubric with per-criterion maxima; student sees own team and own individual scores only.
- **Dashboard & exports:** roster, pending approvals, needs-attention, per-assignment distribution, review queue with filters/pagination, survey summaries, team/project overview, 4 CSV exports (no emails, formula-safe, no-store, audited, rate-limited).
- **Other:** privacy notice with configurable school contact, 12-week plan + printable rubric, retention dry-run/deletion tool, demo seed (local only), CSP and security headers.

## 2. Tests actually run (this machine, 13 Oct 2026)

See `docs/TESTING.md` for commands and details.

| Gate | Result |
|---|---|
| A — install, lint, types, build | `npm ci` lockfile, `eslint .` 0 problems, `tsc --noEmit` clean, `next build` succeeds, `next start` serves |
| B — simulation/content | 47 unit tests pass (simulations, checks, content schemas, both locales, identifier parity, generated migration drift, validation, CSV, timezone, progress) |
| C — database/security | `supabase db reset` clean; 30 DB tests pass through real user sessions (anon/wrong role/other student/cross-class/forged IDs, protected role, immutability, stale saves, team concurrency, proposal versions, rubric bounds/visibility, survey privacy/versioning, audit) |
| D — workflows | Playwright: 7 pass (2 workflow specs + 5 quality checks); soak passes separately: movement slice (class, code, approval, play, save/reload, submit, review, revision, cross-user 404) and project workflow (both surveys, private views, teams, proposal revision/approval, milestone link validation, private contribution, rubric visibility, CSV) |
| E — usability/perf | axe (WCAG 2.0/2.1/2.2 A/AA tags): 0 violations on 15 routes at 1366×768 and 375×740; no horizontal scroll at 375 px; keyboard capture/Escape/skip link; all 8 activities load/step/check; language switch keeps drafts; perf + 15-min soak (below) |
| F — release readiness | **Not complete** — see blockers |

**Measured (emulated, not the representative laptop):** lesson page cold transfer **240 KB** total incl. the activity chunk (budget 500 + 200 KB); readable 0.8 s, usable 1.8 s at 5 Mbps/150 ms/4× CPU (budget 5 s); warm navigation 1.1 s under the same throttling (budget 1 s unthrottled — re-measure on target hardware); 60 rAF/s under 4× CPU; JS heap ~16 MB. 15-minute soak: heap flat at 9.5 MB (post-GC), listener count constant.

## 3. Release blockers (must be resolved by the school/operator)

1. **School approvals:** identity model (school emails/aliases), privacy notice text and contact, retention period (term + 90 days proposed), hosting region, parent/guardian communication.
2. **Provider setup:** staging + production Supabase projects, plan with adequate backups (verify current pricing/limits), SMTP sender, auth URLs/templates, web host with HTTPS. Restore drill.
3. **Representative device testing:** measure on the agreed 4 GB / dual-core / 1366×768 laptop with Chrome/Edge/Firefox; record FPS, load times, memory.
4. **Manual accessibility audit:** keyboard-only and screen-reader walkthroughs (NVDA/TalkBack), 200% zoom, reduced motion. Automated zero-violation results are not proof.
5. **Godot editor verification** of transfer tasks on school computers (`docs/GODOT_VERIFICATION.md` checklist) and the school-computer access plan.
6. **Pilot** with one class using synthetic, then real (approved) accounts.

## 4. Security/privacy decisions and limitations

- Client play-summary checks are formative and can be forged by a determined student via direct API calls; config-derived checks are recomputed server-side and at review time. Teacher review + observed editor tasks establish understanding.
- CSP allows inline scripts (Next.js without nonces). Upgrade path: nonce-based CSP in `proxy.ts`.
- Survey preferences (P9) reference classmates by ID; teachers see names; students never see others' answers.
- No offline sync; unsent work survives short interruptions in-tab (sessionStorage) and is cleared on sign-out.
- Supabase Auth rate limits apply to sign-in; class code redemption and exports have their own DB rate limits.

## 5. Files and migrations

Migrations: `supabase/migrations/20261013000001_core_schema.sql`, `…002_invariants.sql`, `…003_rls_and_rpc.sql`, `…004_content_v1.sql` (generated). Layout in `README.md`.

## 6. Post-MVP backlog (from PROJECT_CONTEXT priorities)

1. Additional content packs and lesson versions; configurable survey templates.
2. Bulk roster onboarding (CSV → invitations) with review.
3. Nonce-based CSP; optional approved error monitoring with redaction.
4. Read-only offline lesson cache; later, offline draft sync with conflict design.
5. School SSO; richer accommodations; cross-class reporting with permissions.
6. Teacher content editor with versioning/review.
7. Optional, clearly separate Godot web-export previews on capable devices.

## 7. Next tasks (exact)

1. School reviews `/privacy` copy, identity model, retention → update `SCHOOL_CONTACT_*`.
2. Create staging Supabase project → `supabase db push` → auth settings per `docs/DEPLOYMENT.md`.
3. Deploy web app to staging; run the staging smoke test and restore drill.
4. Run `npm run test:e2e -- -g performance` from the representative laptop's browser and record results in `docs/TESTING.md`.
5. Teacher completes `docs/GODOT_VERIFICATION.md` manual checklist on school machines.

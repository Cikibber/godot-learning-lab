# Architecture, schema, and RLS

## Shape

- **Server-rendered pages** (React Server Components) read through a per-request Supabase client acting as the signed-in user, so every read is scoped by RLS.
- **Mutations** are Next.js Server Actions (built-in origin check) plus one POST route for CSV export (explicit same-origin check). Each action re-derives the actor with `getClaims()` and the role from `profiles` — never from client input or JWT metadata alone (`lib/auth/session.ts`). Actor IDs are never accepted from the client; DB triggers overwrite `student_id`/`teacher_id` with `auth.uid()`.
- **Proxy** (`proxy.ts`, Next 16) refreshes the session per Supabase SSR guidance and redirects unauthenticated users away from `/student`, `/teacher`, `/account`. It is a convenience, not the security boundary. Personalized responses get `Cache-Control: private, no-store`.
- **Activities** are client-only and lazy-loaded per kind (`exercises/registry.ts`). Per-frame state lives in plain TypeScript `Sim` objects; React shows a HUD refreshed 4×/s and announces only phase changes.
- **No** queues, Redis, realtime subscriptions, Storage, LLM APIs, or third-party scripts.

## Activity runtime (`exercises/`)

| Piece | Behaviour |
|---|---|
| `runtime/loop.ts` | Fixed 1/60 s step, accumulator, elapsed clamp 0.25 s, ≤8 steps/frame then drop backlog, render rate capped at 60 or 30 (toggle) independent of simulation, pauses when `document.hidden`. DPR capped at 1.5. |
| `runtime/core.ts` | Action-based `InputState` (like Input Map; `isPressed` vs `isJustPressed`, `getVector` normalized), AABB `moveAndCollide`, seeded PRNG, bounded event `Trace`, `runStepAction` for the text/step mode. Hard entity cap 100. |
| `sims/*.ts` | Movement, collision, input, signals, state, timer, loop — DOM-free and unit-tested. Scene Composer is pure tree operations (`sims/scene.ts`). |
| `schema.ts` | Versioned discriminated configs (`kind`, `v`) with bounds; bounded `summary` (≤24 scalar fields); evidence ≤64 KB (DB check). |
| `checks.ts` | Registered check IDs only. `source: "config"` checks are recomputable from saved config; `source: "summary"` are play-derived. |

Input capture: keys are handled only on the focused `<canvas>`; Escape blurs; blur/visibility change clears held input. On-screen pad uses pointer capture. **Text/step mode** runs the same simulation in fixed time slices and describes state in text, producing equivalent evidence.

### Evidence trust model

The server re-validates evidence with Zod, checks kind/content version, and **recomputes every registered check** before saving (`features/lessons/validate.ts`). The DB rejects unregistered check IDs and wrong content versions on submit (`private.validate_evidence`). The teacher review page recomputes again and labels checks *verified* (config) or *reported* (play summary) and flags mismatches. Play-summary results remain student-supplied formative evidence — not exam proof (by design; see PROJECT_CONTEXT §7).

## Data model (`supabase/migrations/`)

1. `…001_core_schema.sql` — tables, enums, bounds, partial unique indexes, profile trigger.
2. `…002_invariants.sql` — `private.*` helpers and triggers enforcing invariants on every write path.
3. `…003_rls_and_rpc.sql` — least-privilege grants (column-level), RLS policies, narrow RPCs.
4. `…004_content_v1.sql` — generated from `content/` (test fails on drift).

| Domain | Tables | Key invariants |
|---|---|---|
| Identity | `profiles` | Role comes only from `auth.users.raw_app_meta_data` (service-role writable); users may update only `display_name`, `locale` (column grants). |
| Classes | `classes`, `class_sessions`, `class_invites`, `enrollments` | Owner must be a teacher and cannot change. Invites store SHA-256 of a 50-bit code; expiry, max uses, revocation. Enrollment unique per class/student. |
| Content | `lesson_versions`, `survey_versions`, `assignments` | Content immutable (trigger). Assignment references exactly one version matching its kind; reference immutable. |
| Work | `exercise_attempts`, `attempt_reviews`, `survey_responses` | One draft per student/assignment (partial unique). `revision` bumped by trigger → optimistic concurrency via `.eq("revision", n)`. Submitted rows immutable. Revisions are new linked attempts / new response versions. Reviews append-only. |
| Teams | `teams`, `team_members` | Composite FK keeps member class = team class. Partial unique: one active team per student per class. **Capacity ≤4 enforced in a trigger that locks the team row (`FOR UPDATE`)**, so concurrent inserts from any path serialize. Leaving sets `left_at`; history kept; teams cannot be deleted by teachers. |
| Project | `project_proposals`, `proposal_reviews`, `project_milestones`, `milestone_reviews`, `contribution_statements` | Versioned; submit requires 3–4 active members or a recorded `size_exception_reason`; one review per version and only for the latest submitted version; new version only after changes requested; milestones only after approval. |
| Assessment | `rubric_scores` | Per-criterion maxima (60 team / 40 individual) in a CHECK; individual scores only for current or former team members; unique per subject+criterion. |
| Audit | `audit_events` | Metadata only (actor, class, action, target, time) written by definer triggers/RPCs. |

Progress is **derived** (`lib/progress.ts`) from attempts + reviews: `not_started`, `draft`, `submitted`, `practice_passed` (all checks pass, awaiting review — never a grade), `needs_revision`, `accepted`.

## RLS summary

All 20 application tables have RLS; `anon` has no table grants. Helpers in schema `private` (not exposed by the Data API) are `SECURITY DEFINER` with `search_path = ''` and answer questions **only about the caller** (`owns_class`, `is_approved_student`, `is_active_member`, `can_work_on`, …), which avoids policy recursion.

| Resource | Student | Teacher |
|---|---|---|
| Profiles | own row; classmates' display names only via `class_roster_names()` / `team_roster()` | students enrolled in own classes |
| Classes / enrollments | own enrollments; enrolled classes; create requests only via `redeem_class_code()` | own classes; decide own-class enrollments |
| Content / assignments | published assignments of approved classes and their versions | all content; manage own-class assignments |
| Attempts / responses | own rows; insert/update drafts only while open and approved | read own-class rows; write reviews only |
| Teams / project | own active team's team, roster, proposals, milestones, reviews | manage own-class teams; review |
| Contributions | own only (teammates cannot read) | own-class |
| Scores | own individual + own team's team scores | own-class read/write |
| Invites / audit | none | own-class metadata |

RPCs: `rotate_class_code` (invoker; returns plaintext once), `redeem_class_code` (definer; student-only, 10 tries/15 min, generic boolean, pending enrollment only), `class_roster_names`, `team_roster`, `log_export` (30/hour). Execute revoked from `public`/`anon`.

## Localization

`next-intl` without locale routing: locale comes from an httpOnly cookie synced to `profiles.locale`; default `id` regardless of browser language. Switching calls `router.refresh()`, so client drafts and the current page are preserved. Content is bilingual data; Godot identifiers are kept verbatim (a test compares backticked identifiers across languages). Times are stored as `timestamptz` and shown in the class timezone (default `Asia/Jakarta`); `datetime-local` input is converted with `lib/time.ts`, independent of the host timezone.

## Security notes

- CSP (self + Supabase API; `'unsafe-inline'` scripts required by Next without nonces — documented limitation), `frame-ancestors 'none'`, `nosniff`, strict referrer, permissions policy.
- No raw HTML or Markdown rendering: lesson text is structured data rendered as escaped React text; backticks become `<code>`.
- Links (milestones) must be `https:` without credentials; never fetched or embedded server-side; rendered with `rel="noopener noreferrer nofollow"` showing the host.
- CSV: formula neutralization for `= + - @ \t \r`, no emails, private survey questions excluded, `no-store`, POST + same-origin + rate-limited + audited.
- Local draft cache: `sessionStorage`, user-scoped, 6 h expiry, 64 KB cap, cleared on sign-in/sign-out; never contains tokens.
- `SUPABASE_SECRET_KEY` is used only by operator scripts; the web app needs only the publishable key.

## Assumptions and adaptations (documented per brief)

- `attempt status` is `draft|submitted`; review results live in review tables and the current result is derived (instead of a mutable `reviewed` status) — keeps submitted rows truly immutable.
- `class_sessions` table added to record supervised school-computer sessions (P11 and proposals).
- Text/step mode is the accessible equivalent for spatial activities; Scene Composer is natively button/select-based.
- Rubric uses the context's criteria and weights; intermediate (0.5) points allowed with notes.
- Content edits after release must add a new `version` (never edit an assigned version); regenerating `004_content_v1.sql` was only done before any deployment.

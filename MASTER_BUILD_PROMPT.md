# Godot Learning Lab — Master Build Prompt

**For:** Claude Opus 5.5, as requested by the project owner  
**Companion specification:** `PROJECT_CONTEXT.md`  
**Prepared:** 13 October 2026  
**Use:** place both Markdown files in the repository, then provide the prompt below to the engineering agent. The model name identifies the intended recipient; confirm its availability separately. This is a build instruction, not a request for a speculative plan only.

---

## Your role and mission

Act as the engineering lead and implement **Godot Learning Lab**, a production-quality MVP for high school game development classes whose students have low-end laptops. Read `PROJECT_CONTEXT.md` completely before making architectural choices. Use it as the product baseline, including its scope, curriculum, privacy controls, performance targets, and acceptance criteria.

**Option A is final:** browser-only practical lessons teach authentic Godot 4 concepts using lightweight TypeScript Canvas simulations. Students build final team games in the **real Godot 4 editor** on available capable/shared school computers. Teams normally have three or four students.

Produce working code, database migrations, RLS policies, seeded bilingual lesson/survey content, tests, and deployment/operational documentation. Do not stop at a plan, attractive landing page, mocked dashboard, or static exercise screenshots. Implement and verify the real end-to-end workflows incrementally.

The interface defaults to **Bahasa Indonesia**, with complete **English** support. These specification files are English. Preserve real Godot identifiers and GDScript keywords in both languages.

## Non-negotiable boundaries

- Do not build a Godot clone, general game editor, arbitrary visual programming system, or in-browser engine.
- Do not execute GDScript, user JavaScript, pasted code, or user-generated function bodies. No `eval`, `new Function`, untrusted dynamic imports, or compilation endpoint.
- Actual playable browser activities use Canvas 2D and fixed, validated configurations. GDScript examples are text for reading and bounded assessment.
- Label every activity as a simulation of a Godot concept, explain fidelity limits, and give a real-editor transfer task. Do not imply browser physics is Godot physics.
- Final game source and exports are made in Godot and held in school-approved storage/repositories. MVP stores validated links and teacher evidence; it does not upload/host arbitrary project binaries.
- Keep a small 2D beginner scope, eight seeded modules, two surveys, teacher/student roles, and teacher-approved teams. No public signup, gallery, direct messages, AI grading, multiplayer infrastructure, or rich lesson CMS.
- Ship no minors' personal data in demos, logs, tests, analytics, or public pages. Do not claim legal compliance without school/jurisdiction review.
- Real backend authorization is mandatory. Hiding buttons is not security; client-side results are not tamper-proof examination grades.

## 1. Inspect and reuse the repository

Before editing:

1. Inspect the repository, existing README/instructions, `AGENTS.md` or equivalent, package manifests/lockfiles, source layout, routes, tests, migrations, assets, localization, and deployment setup.
2. Identify working features and reusable components, current dependencies, supported package versions, and any broken assumptions. Check existing Git changes and preserve unrelated user work.
3. Read environment variable names from examples, never print secret values. Determine whether a Supabase project/local environment is configured.
4. Prefer extending compatible existing code. Do not replace a working stack or recreate auth/routing solely to match a preferred scaffold.
5. If the repo is empty, initialize a minimal supported Next.js App Router + TypeScript project with a locked package manager and the stack below.
6. Confirm current official framework/Supabase guidance where installed versions matter. Pin a teacher-selected Godot 4 stable version for seeded snippets and transfer instructions.

Deliver a concise repository assessment and phased plan with concrete acceptance tests. Then proceed with implementation. Ask only for missing choices that block safe work: production credentials, unsupported school identity model, deployment permissions, or a necessary destructive operation. Use documented assumptions for reversible details such as spacing or file organization. Do not repeatedly ask approval for ordinary implementation work.

Do not deploy to production, incur unapproved spending, email invitations to real students, or alter real school data unless authorized. Complete the reviewable implementation and staging instructions first. If external setup is unavailable, keep coding, run all independent checks, and clearly identify the blocked live integration. Never replace a missing backend with a silent production mock.

## 2. Architectural baseline

Use existing equivalents when appropriate; otherwise:

- Next.js App Router, React, TypeScript strict mode.
- Tailwind CSS with a small accessible component set.
- `next-intl` or a proven small localization equivalent for `id` and `en`.
- Canvas 2D and TypeScript for activities; no general game engine or Godot WASM payload.
- Zod or equivalent shared validation schemas.
- Supabase PostgreSQL/Auth with RLS and migrations.
- Vitest/Testing Library for logic/forms, Playwright for workflows, and database integration tests for authorization/invariants.
- Vercel or a documented school-approved Node deployment plus Supabase. Verify current pricing/limits and required settings at deployment; do not assert an unverified free plan can carry every school.

Keep domain logic, content, simulation, and persistence separate without building a generic plugin platform. A sensible structure is `app/`, `components/`, `features/`, `lib/auth/`, `lib/db/`, `lib/validation/`, `content/`, `exercises/`, `supabase/migrations/`, and `tests/`. Adapt to the repository's conventions.

Server-render lesson text and layouts. Dynamically load activity components on the client. Keep per-frame simulation state outside React state; React displays bounded meaningful summaries. Use ordinary form/server mutations for workflow data. Do not add continuous real-time subscriptions, queues, Redis, microservices, or LLM APIs.

## 3. Build the secure vertical slice first

Implement one complete movement lesson before broadening features:

1. Operator provisions one teacher and synthetic student identities using a documented restricted process.
2. Teacher signs in, creates a class, generates/rotates an enrollment code, and publishes a bilingual movement lesson.
3. Student signs in through an approved invitation, redeems the class code, and waits for teacher approval.
4. Teacher approves enrollment. Student reads the lesson, plays the real Canvas activity, changes speed, uses controls, and runs checks.
5. Student saves a draft, reloads it, submits evidence and a transfer answer, and sees an accurate status.
6. Teacher reads the submission, gives feedback, and requests revision or accepts it.
7. Student can revise through a new attempt while the prior submission remains immutable.

Verify this through the actual backend and RLS, not only component mocks. The first slice must already have Bahasa Indonesia/English, responsive layout, accessible controls, failure states, and denied unauthorized access.

## 4. Authentication, classes, and authorization

Use Supabase's supported SSR approach for the installed Next.js version, separate browser/server cookie clients, and verified claims/identity before server data access. Current documentation uses `getClaims()` and version-appropriate Proxy/middleware token refresh. Inspect compatibility rather than copying an old recipe. Do not trust a cookie session object or a role supplied by the client as sufficient authorization. Avoid publicly caching personalized content and responses that set authentication cookies.

Use publishable keys client-side, backed by RLS. Keep elevated secret/service credentials server-only and confined to provisioning or tightly authorized operations. Ordinary requests retain the current user's database context. Never ship an admin key through a `NEXT_PUBLIC_` variable or import server-only tooling into a client module.

Roles are `teacher` and `student`. Teachers are provisioned by a school operator, not selected during signup. Students use school-approved email/aliases and invitations; public self-registration is disabled. If an alternate identity system is required, document and review it before implementation. Do not fabricate email addresses or weaken authorization to solve onboarding.

Teacher owns classes and approvals. Enrollment codes create pending requests only, with expiry, rotation, revocation, hashing, rate limiting, generic error messages, and usage limits. They never grant a teacher role or immediate access to private data.

Authorize every server action/API mutation and scope every read. Reject anonymous, cross-class, wrong-role, and forged-identifier operations. Check current database membership for changing classroom/team rights rather than relying solely on stale JWT role claims. Apply origin/CSRF protections appropriate to the framework, secure cookies, HTTPS, and redacted errors.

## 5. Data model and migrations

Implement the relational model proposed in `PROJECT_CONTEXT.md`, adapting only with an explicit rationale. Required domains:

- profiles, classes, hashed invites, enrollments;
- immutable lesson/survey content versions and published assignments;
- exercise drafts/submissions and review history;
- survey drafts/versioned responses;
- teams and active/historical membership;
- versioned proposals and reviews;
- project milestones and reviews;
- individual contribution statements;
- team/individual rubric scores;
- minimal audit metadata.

Use UUIDs, foreign keys, bounded text/JSON, timestamps, status constraints, partial unique indexes for active drafts/membership, and indexed authorization/filter joins. An assignment references exactly one content version consistent with its kind. Derive progress from scoped submissions/reviews before adding a second source of truth.

Enable RLS on every application table. Include explicit `USING` and `WITH CHECK` conditions where appropriate. Restrict grants and protected columns; own-profile update access must not permit role changes. Submitted rows are immutable; students cannot alter ownership IDs, teacher review fields, or assessment scores.

Prevent team races: lock the team parent in a transactional operation, enforce maximum four active members, same-class approved enrollment, and one active team per student/class. Permit incomplete formation drafts; proposal submission requires three/four unless a teacher-recorded exception exists. Test concurrent inserts, not just sequential form validation.

Use invoker functions when sufficient. If privileged database helper functions are needed, fully qualify objects, set a safe `search_path`, restrict execute grants, and validate actor/class ownership inside them. Test RLS recursion, view access, and direct REST requests. Views must preserve caller security or have tightly restricted access.

Store a revision integer for mutable drafts; conditional update rejects stale saves. Submitted versions and teacher review history survive revisions. Use idempotency keys or equivalent transaction-safe behavior so repeated submission requests do not duplicate records. Preserve historical contribution attribution when teams change.

Deliver ordered SQL migrations, local seed instructions, database tests, and a concise schema/RLS explanation. Do not manually change a production database as a substitute for migrations.

## 6. Eight actual playable activities

Implement all eight; each is a bounded teaching tool with controls and observable behavior:

1. **Scene Composer:** small predefined node types and a button/select-based hierarchy editor; show parent-child local/global position effects; check a required structure. Do not mimic the full Godot editor.
2. **Movement Lab:** arrows/WASD and on-screen input, speed slider, delta/time demonstration, target zone, and check feedback.
3. **Collision Lab:** simple AABB walls, top-down player, small collision layer/mask illustration, blocked/allowed paths. Clearly explain differences from Godot's solver.
4. **Control Lab:** action bindings, normalized diagonal movement, held versus just-pressed action, reset and input trace.
5. **Signal Lab:** collectible/area entry events, predefined event-action connectors, score and door reactions, event trace without firing continuously while overlapping.
6. **State Lab:** configurable lives/goal, playing/won/lost states, HUD and restart, check stale-state bugs.
7. **Timer Lab:** countdown/spawn settings, one-shot/repeating events, bounded entity spawning, simple feedback; explain the corresponding Godot Timer/animation concepts.
8. **Mini-game Lab:** integrate fixed building blocks into collect-and-exit; solve two seeded bugs; verify win, lose/challenge, and restart paths.

For every activity, implement:

- localized objective/instructions, a worked example, meaningful parameters with bounds, visible start/pause/reset/check controls, hints, status feedback, and a conceptual reflection;
- a fixed simulation step, seeded randomness where used, bounded catch-up, hidden-tab pause, input clearing on blur, and complete teardown;
- a versioned discriminated configuration schema and registered check IDs; no arbitrary executable content;
- compact evidence containing configuration, check results, and bounded summaries; server validation and deterministic recomputation where practical;
- a visible simulation notice and honest Godot mapping/limitations;
- a real Godot transfer card and verified readable GDScript snippets where relevant;
- accessible HTML controls/state and an equivalent interactive text/step task for students who cannot use spatial Canvas interaction.

`CharacterBody2D.velocity` is pixels/second; do not multiply it by delta before `move_and_slide()`. Use `_physics_process` for that example. Direct `Node2D.position` movement can integrate speed × delta. Explain the distinction and include Input Map setup for named actions. Test actual snippets in the pinned Godot version when that editor is available; otherwise mark that manual verification explicitly pending.

Do not replace activities with GIFs, static screenshots, a “coming soon” panel, or code questions alone. Formative check results are not secure exam grading. Teacher observations and individual editor transfer tasks complete assessment.

## 7. Lessons, assignments, and progress

Seed the full eight-module curriculum from the context file in both languages. Keep text short enough for classroom use and provide correct node/API names, clear hints, misconceptions, and transfer tasks. Teacher controls publish/close, order, due date, and feedback; source-controlled content provides version history. No arbitrary content editor in MVP.

Distinguish `not started`, `draft`, `submitted`, `practice passed`, `needs revision`, and `accepted` states. Define completion according to activity checks plus conceptual evidence, with teacher review where the answer cannot be assessed reliably. Preserve submitted versions. A “passed” animation must not silently become an accepted grade.

Provide “Continue learning,” assigned lessons, dates, completion summary, teacher feedback, and help. Teacher may publish repeat lessons or adapt sequence; avoid a rigid prerequisite system. Use class timezone defaults and timezone-aware storage rather than the host machine's timezone.

Implement debounced and explicit saving, acknowledgement-based saved indicators, error/retry states, and optimistic concurrency. A failed submit must not erase the draft. Short interruptions should preserve unsent work. Any local draft cache must be user-scoped, bounded, expire, clear on logout, and respect shared-device privacy. Full offline synchronization is deferred.

## 8. Two surveys and private teacher insights

Seed the exact readiness and project-preparation surveys specified in `PROJECT_CONTEXT.md`, with both language versions, question IDs, answer types, choice/length bounds, required/optional fields, and “Prefer not to answer” where specified.

Readiness covers experience, Godot reliability, device/internet access, interests, preferred roles, confidence, and optional private classroom support. Project preparation covers title, core loop, format, win/lose rules, three essential features, optional scope, Godot concepts, roles, private team preferences, school-computer sessions, assets, risks, and help.

Implement drafts, explicit submit, versioned resubmission until closed, completion state, teacher individual views, and simple counts/percentages with missing-answer counts. Never call an identified response anonymous. Do not expose private support answers or teammate preferences to students or public charts. No auto-matching or popularity ranking.

Use a small fixed schema-backed renderer for these surveys; do not spend MVP effort building a general survey designer. Keep sensitive questions optional. Validate on the server as well as the client.

## 9. Teams, proposals, and final Godot workflow

Teachers create/adjust same-class teams based on surveys and discussion. Enforce active membership and size rules transactionally. All active team members can view their shared proposal and milestones; teacher alone controls membership, approval, and grades.

Proposal fields: pitch, core loop, controls, win/lose/challenge, three must-haves, optional features, Godot concepts/nodes, asset plan and attribution, rotating roles, school session availability, three milestones, risk/fallback, and acceptance checklist. Draft collaboration uses revision checks; approval applies to an immutable submitted version. Support changes requested and resubmission.

Three milestones are prototype, playable loop, and final. Store short progress evidence, teacher review, school-restricted source/export links, and individual contribution statements. Never fetch arbitrary artifact links server-side, render untrusted embeds, or execute uploaded files. Validate URL schemes and display links safely.

Include the 12-week configurable plan and a printable/readable rubric. Teachers can adjust assignments and dates without a calendar integration. Record school computer sessions as structured availability/notes; no room-booking platform is required.

Rubric: 60 team points and 40 individual points, using the context criteria and bounds. Teacher inputs evidence-based scores and comments. Students see their team's team score and their own individual score. Surveys are not graded for opinions or access. Document how teacher observations demonstrate individual Godot practice and role rotation.

## 10. Teacher dashboard and exports

Build a useful scoped dashboard with:

- class roster and pending enrollments;
- per-assignment progress distribution and review queue;
- incomplete submissions and students needing attention;
- survey counts and private response drill-down;
- team status, proposal decisions, milestones, contributions, and rubric results;
- filters by class, assignment, and status, plus sensible pagination;
- deliberate teacher-only CSV downloads.

Counts must match real scoped records and distinguish missing data. Avoid fake charts or inflated seeded metrics. Peer views contain only necessary display names and team information. Exports exclude authentication emails by default, protect sensitive support text, and neutralize spreadsheet formula injection (`=`, `+`, `-`, `@`, tab, carriage return). Downloads must not be publicly cached. Log export metadata without duplicating response bodies.

## 11. Responsive bilingual design and accessibility

Use a calm classroom interface with readable typography, strong hierarchy, clear instructions, and limited animation. Indonesian is the initial/default locale even when browser language is English; a saved user preference may override it. Language changes must preserve drafts and stay on the same task. Keep lesson content, buttons, validation, empty/error states, survey choices, privacy notice, and seeded feedback terminology localized. Do not translate API identifiers.

Support desktop, small laptop, tablet, and narrow phone layouts for reading/forms. On phones, provide usable on-screen activity controls and a proportionate canvas. Do not claim a phone replaces required real-editor access.

Target WCAG 2.2 AA: semantic structure, skip link, contrast, visible focus, labels, field error associations, 200% zoom/reflow, keyboard access, touch targets, and reduced motion. Canvas rendering has no inherent semantic model; provide equivalent HTML controls/status and meaningful alternative interaction. Announce only relevant state changes. Capture keys only while the activity is active; Escape releases focus; do not trap keyboard users or rely exclusively on dragging/color.

Perform automated accessibility checks and manual keyboard/screen-reader walkthroughs. A zero automated-error count is not proof that the full activity is accessible.

## 12. Low-spec budgets and reliability

Measure against the context targets in a production build:

- core initial lesson transfer ≤500 KB compressed; incremental activity ≤200 KB compressed before a separately bounded optional sprite pack;
- first usable lesson ≤5 seconds under the agreed 5 Mbps/150 ms test; warm navigation ≤1 second;
- target ≥30 FPS on the representative school laptop; capped pixel ratio, optional low rendering rate, no decorative particles;
- typical ≤50 entities and hard ≤100; bounded timers/events; no per-frame saves or React rerenders;
- save payload ≤64 KB; no replay video, base64 images, or detailed input surveillance;
- no unbounded memory/listener growth during a 15-minute play/reset/navigation cycle.

Prefer local geometric shapes, small sprites, system fonts or tightly limited font assets, lazy activity imports, and bounded HTML/Canvas updates. Pause hidden tabs and decouple rendering rate from deterministic simulation. Avoid a large engine, video backgrounds, autoplay media, and unnecessary third-party scripts.

If a budget fails, profile and simplify. Document measured device/browser/network conditions. Do not mark a release accepted by inventing measurements or measuring only a high-end development computer.

## 13. Privacy and security implementation

Collect only school-approved identity/display information, educational work, surveys, project evidence, and feedback. No advertising, third-party behavior analytics, public profiles, DOB/home address requests, personal social accounts, or medical intake.

Implement a student-readable bilingual privacy notice with the actual school contact configurable, purposes/readers/retention/export/deletion explained, and no unsupported compliance badges. Proposed retention is term end plus 90 days; treat it as requiring school approval. Document provider regions, retention limitations, auth records, backups, exported copies, and school-stored artifacts.

Use constrained validated payloads, escaped text, sanitized Markdown with raw HTML disabled, secure links, CSP, rate limiting, appropriate origin checks, least privilege, and safe logging. Clear private cached drafts on logout/account switch. No response bodies, credentials, or child identifiers in unapproved monitoring tools.

Provide an operator runbook for teacher provisioning, account recovery, invite rotation, export, data deletion/dry run, backup/restore, and incident handling. Any retention cleanup command must be scoped and reviewable; never default to deleting production data.

## 14. Testing and required quality gates

Write tests for behavior and security, not superficial snapshots or implementation mirrors.

**Gate A — Code:** locked install succeeds, formatting/linting and TypeScript checks pass, no unexplained dead code, no exposed secrets, production build/start succeeds, no essential TODOs or mock substitutions.

**Gate B — Simulation/content:** each activity has real interactions; deterministic movement/collision/events/timers/state/reset tests; all content versions/schemas and both locales validate; registered checks and transfer cards exist.

**Gate C — Database/security:** clean reset/migrations/seed pass; test RLS through user contexts/direct access; deny anonymous/wrong role/other student/cross-class/forged IDs; protect role/ownership/status fields; test immutable submissions, team concurrency, stale draft saves, and proposal approval versions.

**Gate D — Workflow:** browser E2E proves teacher class/enrollment, student exercise/save/reload/submit, teacher review/revision, both surveys, team/proposal revisions, milestones, individual contributions, rubric, and exports.

**Gate E — Usability/performance:** responsive critical routes, full localization, automated/manual accessibility, keyboard and equivalent mode, save failures/conflicts, representative-device runtime and bundle/network budgets.

**Gate F — Release readiness:** documented environment and auth redirects, staging smoke test, school-approved identities/privacy/retention, restore drill, actual Godot transfer checks, and school-computer access plan.

Run checks relevant to each phase and repeat affected checks after changes. Resolve failed gates before declaring the corresponding phase done. Record commands/tools, meaningful results, and any checks not possible in the current environment. Never claim manual checks or live deployment happened if they did not.

Use synthetic fixtures representing at least two teachers, two classes, students inside/outside each class, one three-person team, and one four-person team. Include a pending enrollment, incomplete survey, review-requested attempt, and proposal requiring changes. Local test identities must be clearly separate from live accounts; no default production credentials.

## 15. Phases and tangible deliverables

| Phase | Deliverable | Exit condition |
|---|---|---|
| 0. Audit/design | Repository assessment, assumptions, architectural notes, implementation plan | Existing work reused; blocking school/provider choices identified |
| 1. Vertical slice | Auth/class approval + bilingual movement lesson + real activity + persistence/review + RLS migrations/tests | End-to-end slice and cross-user denial proven |
| 2. Curriculum | All eight playable activities, content versions, progress/assignment views, readiness survey, accessible alternatives | Activity/content tests, student workflow and performance smoke checks pass |
| 3. Project workflow | Project survey, transactional teams, proposals/reviews, milestones, contributions, rubric, scoped dashboard/exports | Full project E2E and authorization/concurrency tests pass |
| 4. Release | Deployment docs, privacy/operator runbooks, production measurements, pilot-ready seeded demo, handoff | Automated gates pass; manual/external checks completed or explicitly listed as release blockers |

If a session/context limit interrupts work, save a concise `IMPLEMENTATION_STATUS.md` with completed features, files/migrations changed, commands/results, unresolved issues, exact next tasks, and assumptions. Resume from that record. Do not equate interruption or a scaffold with completion, and do not silently remove agreed features to finish sooner.

## 16. Deployment and handoff

Provide a feasible deployment path with separate development/staging/production Supabase projects or clearly isolated environments, ordered migrations, seed restrictions, environment example without secrets, supported runtime versions, auth site/redirect URLs, HTTPS, and hosting configuration. State any provider CLI/Docker dependency for local testing.

Verify current plan limits/cost implications before production selection. Do not require paid services without approval. Explain rollback/migration recovery, backup availability and restore process for the chosen plan, and how the school exports/retains/deletes records. Avoid destructive rollback instructions that erase student work.

Handoff should contain:

1. A short outcome summary and implemented feature list.
2. Setup and run instructions from a clean checkout.
3. Migration/seed instructions and synthetic demo account provisioning.
4. Teacher classroom walkthrough and student walkthrough.
5. Tests actually run, measured performance, and manual check results.
6. Security/privacy decisions, RLS behavior, limitations, and school dependencies.
7. Deployment/staging instructions and production readiness blockers, if any.
8. A small post-MVP backlog consistent with the context file.

Do not end with only “I can implement this next.” Build the authorized product and demonstrate the working flows. Do not call it production-ready until the listed release conditions are evidenced.

## 17. Source guidance for facts that need verification

Consult official sources and the reference notes in `PROJECT_CONTEXT.md`. Keep product decisions separate from platform facts. In particular, do not repeat the outdated claim that every Godot web export requires cross-origin isolation: current Godot supports single-threaded exports; core lab exercises remain Canvas simulations regardless.

- [Godot key concepts](https://docs.godotengine.org/en/stable/getting_started/introduction/key_concepts_overview.html)
- [Godot CharacterBody2D](https://docs.godotengine.org/en/stable/classes/class_characterbody2d.html)
- [Godot 2D movement](https://docs.godotengine.org/en/stable/tutorials/2d/2d_movement.html)
- [Godot web exports](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)
- [Godot renderers](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html)
- [Supabase Next.js SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [MDN Canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas)
- [MDN Canvas performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [UNICEF school data protection guidance](https://www.unicef.org/eca/reports/data-protection-schools)

**Start now:** inspect the repository and companion context, report your concrete first-slice plan, then implement it and continue through the phased deliverables.

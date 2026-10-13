# Tests and measurements

Environment: Windows 11, Node 24.12, Docker Desktop 29.1, Supabase CLI 2.120 local stack (Postgres 17), Chromium (Playwright 1.64), production build (`next start`). Final full run: 13 Oct 2026.

## Commands

```bash
npx supabase db reset      # clean migrations + content seed (4 migrations applied)
npm run lint               # 0 problems
npm run typecheck          # clean
npm run build              # succeeds
npm test                   # 47 passed  (tests/unit)
npm run test:db            # 30 passed  (tests/db, real user sessions against local Supabase)
npx playwright test        # 7 passed, 1 skipped (soak is opt-in)
SOAK=1 npx playwright test soak   # 1 passed (15.3 min)
```

## What the suites prove

**Unit (`tests/unit`)** — fixed-step movement independent of step count; delta 30/60 FPS comparison; AABB blocking and layer/mask path; one hit per contact; diagonal ratio 1.41 vs ≤1.01 normalized; held vs just-pressed dash; single `body_entered` vs repeated bug; correct signal order; stale vs clean restart; one-shot vs repeating timers; entity cap and hard limit 100; seeded determinism; mini-game bugs and fixes; scene cycle prevention and global positions; every initial config fails a check; checks reject other kinds; all 8 lessons and both surveys validate; IDs R1–R12/P1–P14 and required flags match spec; identifiers identical across languages; generated migration matches content; `id`/`en` message keys identical; exact notice text; 12 weeks and 60/40 rubric; survey bounds, roster/session references, unknown keys dropped; private questions excluded from aggregates; https-only link validation; forged config check overridden by recomputation; content version/kind/bounds rejected; summary size bounded; class-timezone conversion incl. DST; progress states; CSV formula neutralization.

**Database (`tests/db`)** — anonymous reads nothing and cannot call RPCs; students cannot change role or other profiles; profile visibility scoped; students cannot create classes; cross-teacher reads/updates denied; students cannot read invites; wrong codes fail generically; teachers cannot redeem codes; rotation revokes old codes; redemption only creates pending enrollment and pending students see no assignments; code-guessing rate limit; unpublished/other-class assignments hidden; one draft per attempt; stale revision update matches nothing; unregistered check IDs and wrong content versions rejected on submit; submitted attempts immutable; other students/teachers cannot read; students and other teachers cannot review; revision creates attempt 2 and preserves attempt 1; forged ownership and cross-student linking rejected; closed assignments refuse work; assignment content immutable; survey privacy; kind/content mismatch rejected; submitted responses immutable and resubmission is version 2; audit rows metadata-only and owner-only; export logging owner-only; private schema unreachable; **6 concurrent adds → exactly 4 members**; concurrent double-team insert → 1 succeeds; cross-class and forged class IDs rejected; students/other teachers cannot manage membership; proposal needs 3–4 members; teammate stale save rejected; only owner teacher reviews; no new draft while awaiting review; changes requested → v2; old version cannot be reviewed; approval locks further versions; milestones blocked before approval; contributions private from teammates; rubric maxima, team/individual subject rules, former-member rule; students see only own individual + team scores and cannot write; removal keeps history and revokes access.

**E2E (`tests/e2e`)** — slice: teacher creates class/code/publishes lesson, student redeems, teacher approves, student plays Movement Lab in text/step mode, checks pass, saves, reloads draft, stranger gets 404, submits, teacher reviews with recomputed checks and requests revision, student sees feedback and starts revision with prior attempt preserved. Project: both surveys incl. classmates/sessions questions, teacher summary counts, private text hidden from aggregates but visible individually, team formation, proposal submit → changes requested → teammate v2 → approval, milestone rejects `javascript:` link then accepts https link, private contribution hidden from teammate, observation + rubric, student sees own scores only, CSV download without emails or private text. Quality: axe 0 violations across 15 routes × 2 viewports, no horizontal scroll at 375 px, keyboard capture only on focus + Escape + skip link, all 8 activities load/step/check without page errors, language switch keeps draft text.

## Measurements (dev machine with emulation — NOT the representative laptop)

| Metric | Budget | Measured |
|---|---|---|
| Lesson page cold transfer (HTML, CSS, JS, RSC, activity chunk) | ≤500 KB core + ≤200 KB activity | **240 KB total** |
| First readable (5 Mbps / 150 ms / 4× CPU) | — | 0.8 s |
| First usable (activity Start button ready) | ≤5 s | **1.8 s** |
| Warm navigation class → lesson (same throttling) | ≤1 s (unthrottled) | 1.1 s throttled — re-measure on target |
| Frame rate during Movement Lab, 4× CPU | ≥30 FPS | 60 rAF/s |
| JS heap after load | — | ~16 MB |
| 15-min play/reset/navigation soak (7 sims) | no unbounded growth | heap 9.5 MB at minutes 0–14 (after GC); window+document listeners constant at 159 |
| Save payload | ≤64 KB | enforced by DB CHECK (`pg_column_size(evidence) ≤ 65536`) and bounded schemas |

Raw output: `.local-logs/perf.json`, `.local-logs/soak.json` (not committed).

## Not done in this environment (release blockers)

- Representative low-spec laptop runs (FPS, load, memory) on Chrome/Edge/Firefox.
- Manual keyboard-only and screen-reader walkthroughs, 200% zoom, reduced-motion review.
- Real network (school Wi-Fi) cold-load test; classroom load with ~40 synthetic accounts.
- Staging deployment smoke test and backup restore drill.
- Godot editor manual transfer checks (see `GODOT_VERIFICATION.md`).

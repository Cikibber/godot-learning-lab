# Operator runbook

Operators are school staff with access to the Supabase project and the operator environment (`SUPABASE_SECRET_KEY`). There is no in-app admin role. Keep the secret key out of the web host's environment, chat, tickets, and logs.

All commands below read `.env.local` (or export the variables in a shell): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Provision a teacher

```bash
npm run provision -- --role teacher --email guru@sekolah.sch.id --name "Bu Sari"
```
Sends a Supabase invitation (template `supabase/templates/invite.html` → `/auth/confirm` → set password). Role is written to `app_metadata`, which users cannot edit. To promote/demote an existing account: add `--set-role`.

## Provision students

Use only school-issued emails or school-controlled aliases (approved by the school). One command per student, or loop over a school-supplied CSV you keep outside the repository:

```bash
npm run provision -- --role student --email s01@sekolah.sch.id --name "Siswa 01"
```
Display names should be school-approved and may be pseudonymous. Then the teacher shares the class code in person; students redeem it and the teacher approves each request. Public sign-up is disabled (`[auth] enable_signup = false`).

`--password` creates a confirmed account directly and is **refused against non-local URLs**.

## Account recovery

Student/teacher contacts the teacher or operator. Verify identity through normal school channels, then in Supabase Dashboard → Authentication → Users → *Send password recovery* (uses `recovery.html` → `/auth/confirm?type=recovery` → set password). Never read or share passwords; never create guessable credentials.

## Class codes

Teachers rotate or revoke codes on the class overview. Rotation revokes all previous codes. Codes expire (1–90 days), have a use limit, are stored only as SHA-256, and only ever create *pending* requests. Redemption is rate-limited (10 attempts / 15 min / user). If a code leaks: rotate it and reject unexpected pending requests.

## Exports

Teacher-only CSVs on the class overview (progress, surveys, teams, scores). No emails; private survey questions (R11, P9, P10, P14) excluded; spreadsheet formulas neutralized; each export is audited (`audit_events.action = export.*`) and limited to 30/hour. Exported files become school records: store them in approved school storage and include them in retention/deletion.

## Retention and deletion (proposed: term end + 90 days, requires school approval)

1. Teacher archives the class at term end (blocks new enrollment and work; nothing is deleted).
2. Review (dry run, default):
   ```bash
   npm run retention -- --days 90
   ```
3. After written school approval, delete one class at a time:
   ```bash
   npm run retention -- --class <class-uuid> --execute --confirm "<exact class name>"
   ```
   This cascades to that class's enrollments, assignments, attempts, reviews, survey responses, teams, proposals, milestones, contributions, scores, and audit rows. It refuses non-archived classes.
4. Remove auth accounts of students with no remaining classes in Supabase Dashboard → Authentication (manual, deliberate).
5. Record the deletion in the school's data log. Backups and previously exported CSVs are **not** affected; they expire per the provider's backup retention and the school's file policy — disclose this accurately.

Individual deletion requests: remove the student from the class (teacher: *Withdraw*), then delete their auth user (cascades their profile and all their rows). Team-level records authored by others remain.

## Backup and restore

- Backups depend on the Supabase plan chosen; check the current plan's backup frequency, retention, and point-in-time options before go-live (do not assume free-tier coverage).
- Before term start, perform a **restore drill** into a separate staging project: restore the latest backup, run `npm run test:db` against it (read-only checks) or sign in with a test teacher, confirm counts match, then delete the staging copy.
- Schema changes are migrations only (`supabase/migrations`). Never hand-edit production. For rollback, write a new forward migration; do not run destructive down-migrations that erase student work.

## Incident handling

1. **Contain:** rotate class codes, revoke sessions (Dashboard → Users → sign out user), and if a key leaked, rotate the Supabase secret key / API keys.
2. **Preserve:** export redacted evidence (audit_events, timestamps); do not copy survey bodies into tickets.
3. **Notify:** the school contact on `/privacy` (`SCHOOL_CONTACT_*`); the school decides required notifications.
4. **Fix and verify:** patch, add a regression test (`tests/db` for authorization issues), redeploy, re-run Gate C.
5. **Review:** short written summary for the school.

## Monitoring and logs

The app sends no analytics and no error telemetry. Server logs from the host should not include request bodies. If the school adds an error-monitoring tool, configure it to drop request bodies, survey answers, and identifiers, and get approval first.

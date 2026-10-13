// Operator tool: retention review and scoped deletion. DRY RUN BY DEFAULT.
//
//   npm run retention                                   # list archived classes past retention
//   npm run retention -- --days 90                      # custom window after archive
//   npm run retention -- --class <uuid> --execute --confirm "<class name>"
//
// Deleting a class removes its enrollments, assignments, attempts, reviews,
// survey responses, teams, proposals, milestones, contributions, scores, and
// audit rows (FK cascade). It never deletes auth accounts; remove those
// separately in Supabase Auth once a student has no remaining classes.
// Backups and exported CSVs are NOT affected; see docs/OPERATIONS.md.
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    days: { type: "string", default: "90" },
    class: { type: "string" },
    execute: { type: "boolean", default: false },
    confirm: { type: "string" },
  },
});
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("retention: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
  process.exit(1);
}
const admin = createClient(url, secret, { auth: { persistSession: false } });
const days = Number(values.days);
const cutoff = new Date(Date.now() - days * 86400000).toISOString();

async function counts(classId: string) {
  const tables = ["enrollments", "assignments", "teams", "audit_events"] as const;
  const out: Record<string, number> = {};
  for (const t of tables) {
    const { count } = await admin.from(t).select("*", { count: "exact", head: true }).eq("class_id", classId);
    out[t] = count ?? 0;
  }
  return out;
}

async function main() {
  if (!values.class) {
    const { data, error } = await admin.from("classes").select("id, name, term, archived_at").not("archived_at", "is", null).lt("archived_at", cutoff);
    if (error) throw error;
    console.log(`DRY RUN — archived more than ${days} days ago (before ${cutoff}):`);
    if (!data.length) console.log("  none");
    for (const c of data) console.log(`  ${c.id}  ${c.name} (${c.term}) archived ${c.archived_at}`, await counts(c.id));
    console.log("Nothing was deleted. Re-run with --class <id> --execute --confirm \"<class name>\" after school approval.");
    return;
  }

  const { data: cls } = await admin.from("classes").select("id, name, archived_at").eq("id", values.class).maybeSingle();
  if (!cls) {
    console.error("retention: class not found");
    process.exitCode = 1;
    return;
  }
  console.log(`Class ${cls.name} (${cls.id}) archived_at=${cls.archived_at}`, await counts(cls.id));
  if (!cls.archived_at) {
    console.error("retention: refusing to delete a class that is not archived.");
    process.exitCode = 1;
    return;
  }
  if (!values.execute || values.confirm !== cls.name) {
    console.log("DRY RUN. To delete, add --execute --confirm with the exact class name.");
    return;
  }
  const { error } = await admin.from("classes").delete().eq("id", cls.id);
  if (error) {
    console.error("retention: delete failed:", error.message);
    process.exitCode = 1;
    return;
  }
  console.log("Deleted class and its dependent records. Record this action in the school's data log.");
}

await main();

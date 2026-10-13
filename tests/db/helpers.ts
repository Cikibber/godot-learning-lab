// Test harness for the local Supabase stack. Creates synthetic identities with
// the service key (operator path), then acts through ordinary user sessions so
// RLS and grants are exercised exactly as the app and direct REST calls are.
import { execSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Status = { API_URL: string; PUBLISHABLE_KEY: string; SECRET_KEY: string };
let cached: Status | null = null;

export function local(): Status {
  if (!cached) {
    const out = execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    cached = JSON.parse(out.slice(out.indexOf("{"))) as Status;
  }
  return cached;
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export const admin = () => createClient(local().API_URL, local().SECRET_KEY, opts);
export const anon = () => createClient(local().API_URL, local().PUBLISHABLE_KEY, opts);

const run = Math.random().toString(36).slice(2, 8);
const PASSWORD = "local-test-only-Pa55!";

export type Actor = { id: string; client: SupabaseClient; name: string };

export async function makeUser(name: string, role: "teacher" | "student"): Promise<Actor> {
  const email = `${name}.${run}@example.test`;
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role, display_name: name },
  });
  if (error) throw error;
  const client = createClient(local().API_URL, local().PUBLISHABLE_KEY, opts);
  const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, client, name };
}

export async function must<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(JSON.stringify(error));
  return data;
}

/** Teacher creates a class; returns its id. */
export async function makeClass(teacher: Actor, name = "Kelas Uji"): Promise<string> {
  const row = await must(teacher.client.from("classes").insert({ name, teacher_id: teacher.id }).select("id").single());
  return (row as { id: string }).id;
}

/** Full enrollment path: rotate code → student redeems → teacher approves. */
export async function enroll(teacher: Actor, classId: string, student: Actor, approve = true) {
  const code = await must(teacher.client.rpc("rotate_class_code", { p_class_id: classId }));
  const ok = await must(student.client.rpc("redeem_class_code", { p_code: code as string }));
  if (!ok) throw new Error("redeem failed");
  if (approve) {
    await must(
      teacher.client.from("enrollments").update({ status: "approved" }).eq("class_id", classId).eq("student_id", student.id),
    );
  }
}

export async function lessonVersionId(key: string): Promise<string> {
  const row = await must(admin().from("lesson_versions").select("id").eq("lesson_key", key).eq("version", 1).single());
  return (row as { id: string }).id;
}

export async function surveyVersionId(key: string): Promise<string> {
  const row = await must(admin().from("survey_versions").select("id").eq("survey_key", key).eq("version", 1).single());
  return (row as { id: string }).id;
}

export async function publishLesson(teacher: Actor, classId: string, key = "movement", published = true) {
  const row = await must(
    teacher.client
      .from("assignments")
      .insert({
        class_id: classId,
        kind: "lesson",
        lesson_version_id: await lessonVersionId(key),
        published_at: published ? new Date(Date.now() - 1000).toISOString() : null,
      })
      .select("id")
      .single(),
  );
  return (row as { id: string }).id;
}

export const movementEvidence = (overrides: Record<string, unknown> = {}) => ({
  contentVersion: 1,
  config: { kind: "movement", v: 1, speed: 200, useDelta: true },
  checkResults: [
    { id: "movement.reach_target", passed: true },
    { id: "movement.speed_changed", passed: true },
  ],
  summary: { reachedTarget: true, comparedWithoutDelta: true },
  ...overrides,
});

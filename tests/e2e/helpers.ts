import { expect, type Browser, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { local } from "../db/helpers";

export const PASSWORD = "e2e-local-only-Pa55!";
const run = Date.now().toString(36);

export async function provision(name: string, role: "teacher" | "student") {
  const admin = createClient(local().API_URL, local().SECRET_KEY, { auth: { persistSession: false } });
  const email = `${name}.${run}@example.test`;
  const { error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, app_metadata: { role, display_name: `${name} ${run}` } });
  if (error) throw error;
  return { email, name: `${name} ${run}` };
}

/** Separate browser context per person, like separate devices. */
export async function signIn(browser: Browser, email: string): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror ${email}]`, e.message));
  await page.goto("/sign-in");
  await page.getByLabel("Email sekolah").fill(email);
  await page.getByLabel("Kata sandi").fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/(teacher|student)$/);
  return page;
}

/** Operator-side fixture: a class with all eight lessons and the readiness survey published. */
export async function fixtureClass() {
  const admin = createClient(local().API_URL, local().SECRET_KEY, { auth: { persistSession: false } });
  const teacher = await provision("guruqa", "teacher");
  const student = await provision("siswaqa", "student");
  const ids = async (email: string) => (await admin.auth.admin.listUsers({ perPage: 1000 })).data.users.find((u) => u.email === email)!.id;
  const [tid, sid] = [await ids(teacher.email), await ids(student.email)];
  const { data: cls } = await admin.from("classes").insert({ teacher_id: tid, name: "Kelas QA" }).select("id").single();
  await admin.from("enrollments").insert({ class_id: cls!.id, student_id: sid, status: "approved" });
  const { data: lessons } = await admin.from("lesson_versions").select("id, module_no").eq("version", 1).order("module_no");
  const { data: survey } = await admin.from("survey_versions").select("id").eq("survey_key", "readiness").single();
  const past = new Date(Date.now() - 60_000).toISOString();
  const { data: rows } = await admin
    .from("assignments")
    .insert([
      ...lessons!.map((l) => ({ class_id: cls!.id, kind: "lesson" as const, lesson_version_id: l.id, position: l.module_no * 10, published_at: past })),
      { class_id: cls!.id, kind: "survey" as const, survey_version_id: survey!.id, position: 0, published_at: past },
    ])
    .select("id, lesson_version_id, survey_version_id");
  const lessonAssignments = lessons!.map((l) => rows!.find((r) => r.lesson_version_id === l.id)!.id);
  const surveyAssignment = rows!.find((r) => r.survey_version_id)!.id;
  return { teacher, student, classId: cls!.id, lessonAssignments, surveyAssignment };
}

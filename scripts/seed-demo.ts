// Synthetic, LOCAL-ONLY demo data. Fictional names, example.test addresses,
// one shared local password printed at the end. Refuses non-local targets.
//
//   npm run db:reset && npm run seed:demo
//
// Fixtures: 2 teachers, 2 classes, students inside/outside each class, a
// 3-person and a 4-person team, a pending enrollment, an incomplete survey,
// a revision-requested attempt, and a proposal requiring changes.
import { createClient } from "@supabase/supabase-js";
import { LESSONS } from "../content";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secret = process.env.SUPABASE_SECRET_KEY ?? "";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url) || !secret) {
  console.error("seed-demo: refuses to run without a LOCAL Supabase URL and secret key.");
  process.exit(1);
}
const PASSWORD = process.env.DEMO_PASSWORD ?? "demo-lokal-2026";
const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

async function must<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(JSON.stringify(error));
  return data;
}

async function user(email: string, name: string, role: "teacher" | "student") {
  const existing = (await admin.auth.admin.listUsers({ perPage: 1000 })).data.users.find((u) => u.email === email);
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, app_metadata: { role, display_name: name } });
  if (error) throw error;
  return data.user.id;
}

const days = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

const guru1 = await user("guru.sari@example.test", "Bu Sari (demo)", "teacher");
const guru2 = await user("guru.budi@example.test", "Pak Budi (demo)", "teacher");
const names = ["Andi", "Bunga", "Citra", "Dimas", "Eka", "Fajar", "Gita", "Hana", "Indra"];
const students = await Promise.all(names.map((n, i) => user(`siswa${i + 1}@example.test`, `${n} (demo)`, "student")));
const outsider = await user("siswa.lain@example.test", "Joko (demo, kelas lain)", "student");
const pendingStudent = await user("siswa.baru@example.test", "Kiki (demo, menunggu)", "student");

const cls1 = (await must(admin.from("classes").insert({ teacher_id: guru1, name: "XI RPL 1 — Pengembangan Game", term: "2026/2027 Ganjil" }).select("id").single())) as { id: string };
const cls2 = (await must(admin.from("classes").insert({ teacher_id: guru2, name: "XI RPL 2 — Pengembangan Game", term: "2026/2027 Ganjil" }).select("id").single())) as { id: string };

await must(admin.from("enrollments").insert([
  ...students.map((s) => ({ class_id: cls1.id, student_id: s, status: "approved" as const })),
  { class_id: cls1.id, student_id: pendingStudent, status: "pending" as const },
  { class_id: cls2.id, student_id: outsider, status: "approved" as const },
]));
await must(admin.from("class_sessions").insert([
  { class_id: cls1.id, label: "Selasa 13.00–14.30, Lab 2", notes: "12 komputer" },
  { class_id: cls1.id, label: "Kamis 10.00–11.30, Lab 1", notes: "8 komputer" },
]));

const lessonIds = (await must(admin.from("lesson_versions").select("id, lesson_key").eq("version", 1))) as { id: string; lesson_key: string }[];
const surveyIds = (await must(admin.from("survey_versions").select("id, survey_key").eq("version", 1))) as { id: string; survey_key: string }[];
const assignments = (await must(
  admin.from("assignments").insert([
    { class_id: cls1.id, kind: "survey" as const, survey_version_id: surveyIds.find((s) => s.survey_key === "readiness")!.id, position: 0, published_at: days(-14), due_at: days(-7) },
    ...LESSONS.map((l, i) => ({
      class_id: cls1.id, kind: "lesson" as const, lesson_version_id: lessonIds.find((x) => x.lesson_key === l.key)!.id,
      position: (i + 1) * 10, published_at: i < 3 ? days(-10 + i * 3) : null, due_at: days(-3 + i * 7),
    })),
    { class_id: cls1.id, kind: "survey" as const, survey_version_id: surveyIds.find((s) => s.survey_key === "project")!.id, position: 95, published_at: days(-1), due_at: days(7) },
    { class_id: cls2.id, kind: "lesson" as const, lesson_version_id: lessonIds.find((x) => x.lesson_key === "movement")!.id, position: 0, published_at: days(-2) },
  ]).select("id, kind, lesson_version_id, survey_version_id"),
)) as { id: string; kind: string; lesson_version_id: string | null; survey_version_id: string | null }[];
const movement = assignments.find((a) => a.lesson_version_id === lessonIds.find((x) => x.lesson_key === "movement")!.id)!;
const readiness = assignments.find((a) => a.survey_version_id === surveyIds.find((s) => s.survey_key === "readiness")!.id)!;

// A submitted movement attempt with a revision request, and one accepted.
const evidence = {
  contentVersion: 1,
  config: { kind: "movement", v: 1, speed: 200, useDelta: true },
  checkResults: [{ id: "movement.reach_target", passed: true }, { id: "movement.speed_changed", passed: true }, { id: "movement.delta_compared", passed: true }],
  summary: { reachedTarget: true, secondsToTarget: 3.2, comparedWithoutDelta: true, speed: 200 },
};
const answers = { quiz: 1, reflection: "Tanpa delta kotak 60 FPS bergerak dua kali lebih jauh.", transfer: "Delta adalah detik sejak frame sebelumnya." };
for (const [i, s] of students.slice(0, 2).entries()) {
  const a = (await must(admin.from("exercise_attempts").insert({ assignment_id: movement.id, student_id: s, evidence: {}, answers: {} }).select("id").single())) as { id: string };
  await must(admin.from("exercise_attempts").update({ status: "submitted", evidence, answers }).eq("id", a.id));
  await must(admin.from("attempt_reviews").insert({ attempt_id: a.id, teacher_id: guru1, result: i === 0 ? "needs_revision" : "accepted", feedback: i === 0 ? "Jelaskan juga mengapa CharacterBody2D tidak memakai delta." : "Penjelasan delta sudah tepat." }));
}

// Readiness survey: several submitted, one left as an incomplete draft.
const readinessAnswers = (i: number) => ({
  R1: { choice: ["none", "tutorial", "small_game"][i % 3] }, R2: { choice: ["never", "opened", "tutorial"][i % 3] },
  R3: { value: (i % 5) + 1 }, R6: { choice: ["personal_laptop", "shared_laptop", "school_only"][i % 3] },
  R7: { choice: ["slow", "crashes", "works_well", "not_tried"][i % 4] }, R9: { choices: [["programming", "art"], ["game_design"], ["testing", "audio"]][i % 3] },
});
for (const [i, s] of students.slice(0, 6).entries()) {
  const r = (await must(admin.from("survey_responses").insert({ assignment_id: readiness.id, student_id: s, answers: readinessAnswers(i) }).select("id").single())) as { id: string };
  await must(admin.from("survey_responses").update({ status: "submitted" }).eq("id", r.id));
}
await must(admin.from("survey_responses").insert({ assignment_id: readiness.id, student_id: students[6], answers: { R1: { choice: "none" } } }));

// Teams: one of three, one of four; the four-person team has a proposal with changes requested.
const teamA = (await must(admin.from("teams").insert({ class_id: cls1.id, name: "Tim Komet" }).select("id").single())) as { id: string };
const teamB = (await must(admin.from("teams").insert({ class_id: cls1.id, name: "Tim Pelangi" }).select("id").single())) as { id: string };
for (const s of students.slice(0, 3)) await must(admin.from("team_members").insert({ team_id: teamA.id, class_id: cls1.id, student_id: s }));
for (const s of students.slice(3, 7)) await must(admin.from("team_members").insert({ team_id: teamB.id, class_id: cls1.id, student_id: s }));
const prop = (await must(admin.from("project_proposals").insert({
  team_id: teamB.id,
  body: { title: "Kebun Koin", pitch: "Kumpulkan koin di kebun lalu keluar sebelum waktu habis.", coreLoop: "Bergerak, ambil koin, hindari lebah.", controls: "Panah/WASD", winLose: "Menang: semua koin lalu keluar. Kalah: tiga kali tersengat.", mustHaves: ["Gerak", "Koin", "Pintu keluar"], optional: ["Musik"], concepts: "CharacterBody2D, Area2D, Timer", assets: "Paket aset guru", roles: "Bergiliran tiap minggu", sessions: "Selasa Lab 2", milestones: ["Gerak", "Loop", "Final"], risk: "Lebah terlalu sulit → lebah diam", checklist: "Menang, kalah, restart" },
}).select("id").single())) as { id: string };
await must(admin.from("project_proposals").update({ status: "submitted" }).eq("id", prop.id));
await must(admin.from("proposal_reviews").insert({ proposal_id: prop.id, teacher_id: guru1, result: "changes_requested", feedback: "Kurangi fitur lebah menjadi satu jenis musuh." }));

console.log("Demo data created (LOCAL ONLY). Shared local password:", PASSWORD);
console.log("Teachers: guru.sari@example.test (XI RPL 1), guru.budi@example.test (XI RPL 2)");
console.log("Students: siswa1..siswa9@example.test (XI RPL 1), siswa.lain@example.test (XI RPL 2), siswa.baru@example.test (pending)");

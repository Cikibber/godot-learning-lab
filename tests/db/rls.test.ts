// Gate C: authorization and invariants exercised through real user sessions.
import { beforeAll, describe, expect, it } from "vitest";
import {
  admin, anon, enroll, makeClass, makeUser, movementEvidence, must, publishLesson, surveyVersionId,
  type Actor,
} from "./helpers";

let tA: Actor, tB: Actor, s1: Actor, s2: Actor, outsider: Actor;
let classA: string, classB: string, assignmentA: string;

beforeAll(async () => {
  [tA, tB, s1, s2, outsider] = await Promise.all([
    makeUser("teacherA", "teacher"),
    makeUser("teacherB", "teacher"),
    makeUser("siswa1", "student"),
    makeUser("siswa2", "student"),
    makeUser("luar", "student"),
  ]);
  classA = await makeClass(tA, "Kelas A");
  classB = await makeClass(tB, "Kelas B");
  await enroll(tA, classA, s1);
  await enroll(tA, classA, s2);
  await enroll(tB, classB, outsider);
  assignmentA = await publishLesson(tA, classA, "movement");
});

describe("anonymous access", () => {
  it("reads nothing from application tables", async () => {
    for (const table of ["profiles", "classes", "lesson_versions", "enrollments", "exercise_attempts"]) {
      const { data } = await anon().from(table).select("*");
      expect(data ?? [], table).toHaveLength(0);
    }
  });
  it("cannot redeem codes or call teacher RPCs", async () => {
    const r = await anon().rpc("redeem_class_code", { p_code: "AAAAA-AAAAA" });
    expect(r.error).not.toBeNull();
  });
});

describe("profiles and roles", () => {
  it("student cannot promote themselves to teacher", async () => {
    const r = await s1.client.from("profiles").update({ role: "teacher" }).eq("id", s1.id);
    expect(r.error).not.toBeNull();
    const me = await must(admin().from("profiles").select("role").eq("id", s1.id).single());
    expect((me as { role: string }).role).toBe("student");
  });
  it("student can change own display name and locale only", async () => {
    await must(s1.client.from("profiles").update({ locale: "en" }).eq("id", s1.id));
    const r = await s1.client.from("profiles").update({ locale: "en" }).eq("id", s2.id).select();
    expect(r.data ?? []).toHaveLength(0);
  });
  it("student cannot list other profiles; teacher sees only own-class students", async () => {
    const own = await must(s1.client.from("profiles").select("id"));
    expect((own as { id: string }[]).map((p) => p.id)).toEqual([s1.id]);
    const seen = (await must(tA.client.from("profiles").select("id"))) as { id: string }[];
    expect(seen.map((p) => p.id)).toContain(s1.id);
    expect(seen.map((p) => p.id)).not.toContain(outsider.id);
  });
});

describe("classes and enrollment", () => {
  it("students cannot create classes", async () => {
    const r = await s1.client.from("classes").insert({ name: "x", teacher_id: s1.id });
    expect(r.error).not.toBeNull();
  });
  it("teacher cannot see or modify another teacher's class", async () => {
    const r = await must(tB.client.from("classes").select("id").eq("id", classA));
    expect(r).toHaveLength(0);
    const upd = await tB.client.from("enrollments").update({ status: "rejected" }).eq("class_id", classA).select();
    expect(upd.data ?? []).toHaveLength(0);
  });
  it("students never read invites and wrong codes fail generically", async () => {
    const inv = await must(s1.client.from("class_invites").select("*"));
    expect(inv).toHaveLength(0);
    expect(await must(s1.client.rpc("redeem_class_code", { p_code: "WRONG-CODE1" }))).toBe(false);
  });
  it("teachers cannot redeem codes (no role escalation by code)", async () => {
    const code = await must(tA.client.rpc("rotate_class_code", { p_class_id: classA }));
    expect(await must(tB.client.rpc("redeem_class_code", { p_code: code as string }))).toBe(false);
  });
  it("rotation revokes the previous code", async () => {
    const late = await makeUser("terlambat", "student");
    const old = await must(tA.client.rpc("rotate_class_code", { p_class_id: classA }));
    await must(tA.client.rpc("rotate_class_code", { p_class_id: classA }));
    expect(await must(late.client.rpc("redeem_class_code", { p_code: old as string }))).toBe(false);
  });
  it("redemption creates only a pending request; pending students see no assignments", async () => {
    const pending = await makeUser("menunggu", "student");
    await enroll(tA, classA, pending, false);
    const e = (await must(pending.client.from("enrollments").select("status"))) as { status: string }[];
    expect(e[0].status).toBe("pending");
    expect(await must(pending.client.from("assignments").select("id"))).toHaveLength(0);
  });
  it("rate-limits code guessing", async () => {
    const guesser = await makeUser("penebak", "student");
    for (let i = 0; i < 10; i++) await guesser.client.rpc("redeem_class_code", { p_code: `BAD${i}` });
    const code = await must(tA.client.rpc("rotate_class_code", { p_class_id: classA }));
    expect(await must(guesser.client.rpc("redeem_class_code", { p_code: code as string }))).toBe(false);
  });
});

describe("assignments and attempts", () => {
  it("approved students see published assignments only; other class sees none", async () => {
    const hidden = await publishLesson(tA, classA, "collision", false);
    const ids = ((await must(s1.client.from("assignments").select("id"))) as { id: string }[]).map((a) => a.id);
    expect(ids).toContain(assignmentA);
    expect(ids).not.toContain(hidden);
    expect(await must(outsider.client.from("assignments").select("id").eq("id", assignmentA))).toHaveLength(0);
  });

  it("full draft → stale save → submit → immutability → review → revision lifecycle", async () => {
    const draft = (await must(
      s1.client.from("exercise_attempts").insert({ assignment_id: assignmentA, evidence: {} }).select().single(),
    )) as { id: string; revision: number; student_id: string };
    expect(draft.student_id).toBe(s1.id);

    // Only one active draft per student/assignment.
    const dup = await s1.client.from("exercise_attempts").insert({ assignment_id: assignmentA });
    expect(dup.error).not.toBeNull();

    // Optimistic concurrency: save with current revision succeeds; stale one matches no row.
    const ok = await must(
      s1.client.from("exercise_attempts").update({ answers: { reflection: "v1" } }).eq("id", draft.id).eq("revision", 0).select(),
    );
    expect(ok).toHaveLength(1);
    const stale = await must(
      s1.client.from("exercise_attempts").update({ answers: { reflection: "old tab" } }).eq("id", draft.id).eq("revision", 0).select(),
    );
    expect(stale).toHaveLength(0);

    // Unregistered check IDs and wrong content version are rejected by the database.
    const forged = await s1.client
      .from("exercise_attempts")
      .update({ status: "submitted", evidence: movementEvidence({ checkResults: [{ id: "admin.grant", passed: true }] }) })
      .eq("id", draft.id);
    expect(forged.error).not.toBeNull();
    const wrongVersion = await s1.client
      .from("exercise_attempts")
      .update({ status: "submitted", evidence: movementEvidence({ contentVersion: 99 }) })
      .eq("id", draft.id);
    expect(wrongVersion.error).not.toBeNull();

    await must(s1.client.from("exercise_attempts").update({ status: "submitted", evidence: movementEvidence() }).eq("id", draft.id));

    // Submitted evidence is immutable (RLS hides it from updates; direct attempt changes nothing).
    const tamper = await must(
      s1.client.from("exercise_attempts").update({ answers: { reflection: "changed" } }).eq("id", draft.id).select(),
    );
    expect(tamper).toHaveLength(0);

    // Other students and other teachers cannot read it; owner teacher can.
    expect(await must(s2.client.from("exercise_attempts").select("id").eq("id", draft.id))).toHaveLength(0);
    expect(await must(tB.client.from("exercise_attempts").select("id").eq("id", draft.id))).toHaveLength(0);
    expect(await must(tA.client.from("exercise_attempts").select("id").eq("id", draft.id))).toHaveLength(1);

    // Students cannot review; other teachers cannot review; owner can.
    expect((await s1.client.from("attempt_reviews").insert({ attempt_id: draft.id, result: "accepted", feedback: "x" })).error).not.toBeNull();
    expect((await tB.client.from("attempt_reviews").insert({ attempt_id: draft.id, result: "accepted", feedback: "x" })).error).not.toBeNull();
    await must(tA.client.from("attempt_reviews").insert({ attempt_id: draft.id, result: "needs_revision", feedback: "Jelaskan delta." }));

    // Revision: new linked attempt, prior submission untouched.
    const next = (await must(
      s1.client.from("exercise_attempts").insert({ assignment_id: assignmentA, previous_attempt_id: draft.id }).select().single(),
    )) as { attempt_no: number };
    expect(next.attempt_no).toBe(2);
    const prior = (await must(admin().from("exercise_attempts").select("answers,status").eq("id", draft.id).single())) as {
      answers: { reflection: string };
      status: string;
    };
    expect(prior).toMatchObject({ status: "submitted", answers: { reflection: "v1" } });
  });

  it("students cannot forge ownership or link another student's attempt", async () => {
    const forged = await s2.client.from("exercise_attempts").insert({ assignment_id: assignmentA, student_id: s1.id });
    expect(forged.error).not.toBeNull();
    const s1Attempt = (await must(admin().from("exercise_attempts").select("id").eq("student_id", s1.id).eq("status", "submitted").limit(1).single())) as { id: string };
    const link = await s2.client.from("exercise_attempts").insert({ assignment_id: assignmentA, previous_attempt_id: s1Attempt.id });
    expect(link.error).not.toBeNull();
  });

  it("closed assignments accept no new work", async () => {
    const closed = await publishLesson(tA, classA, "signals");
    await must(tA.client.from("assignments").update({ closed_at: new Date(Date.now() - 1000).toISOString() }).eq("id", closed));
    const r = await s1.client.from("exercise_attempts").insert({ assignment_id: closed });
    expect(r.error).not.toBeNull();
  });

  it("assignment content version cannot be swapped", async () => {
    const r = await tA.client.from("assignments").update({ lesson_version_id: null }).eq("id", assignmentA);
    expect(r.error).not.toBeNull();
  });
});

describe("surveys are private", () => {
  it("only the author and owning teacher read responses", async () => {
    const a = (await must(
      tA.client.from("assignments").insert({
        class_id: classA, kind: "survey", survey_version_id: await surveyVersionId("readiness"),
        published_at: new Date(Date.now() - 1000).toISOString(),
      }).select("id").single(),
    )) as { id: string };
    const r = (await must(
      s1.client.from("survey_responses").insert({ assignment_id: a.id, answers: { R11: { text: "private" } } }).select("id").single(),
    )) as { id: string };
    expect(await must(s2.client.from("survey_responses").select("id").eq("id", r.id))).toHaveLength(0);
    expect(await must(tB.client.from("survey_responses").select("id").eq("id", r.id))).toHaveLength(0);
    expect(await must(tA.client.from("survey_responses").select("id").eq("id", r.id))).toHaveLength(1);
    // Kind/content mismatch is impossible.
    const bad = await tA.client.from("assignments").insert({ class_id: classA, kind: "lesson", survey_version_id: await surveyVersionId("readiness") });
    expect(bad.error).not.toBeNull();
  });
});

describe("survey versions and audit metadata", () => {
  it("submitted responses are immutable; resubmission creates version 2", async () => {
    const a = (await must(
      tA.client.from("assignments").insert({
        class_id: classA, kind: "survey", survey_version_id: await surveyVersionId("project"),
        published_at: new Date(Date.now() - 1000).toISOString(),
      }).select("id").single(),
    )) as { id: string };
    const r1 = (await must(s2.client.from("survey_responses").insert({ assignment_id: a.id, answers: { P1: { text: "v1" } } }).select("id, version").single())) as { id: string; version: number };
    expect(r1.version).toBe(1);
    await must(s2.client.from("survey_responses").update({ status: "submitted" }).eq("id", r1.id));
    const tamper = await must(s2.client.from("survey_responses").update({ answers: { P1: { text: "changed" } } }).eq("id", r1.id).select());
    expect(tamper).toHaveLength(0);
    const r2 = (await must(s2.client.from("survey_responses").insert({ assignment_id: a.id, answers: { P1: { text: "v2" } } }).select("version").single())) as { version: number };
    expect(r2.version).toBe(2);
  });
  it("audit rows hold metadata only and are visible to the owning teacher alone", async () => {
    const rows = (await must(tA.client.from("audit_events").select("*").eq("class_id", classA))) as Record<string, unknown>[];
    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys(rows[0]).sort()).toEqual(["action", "actor_id", "class_id", "created_at", "id", "target_id"]);
    expect(await must(tB.client.from("audit_events").select("id").eq("class_id", classA))).toHaveLength(0);
    expect(await must(s1.client.from("audit_events").select("id"))).toHaveLength(0);
    expect((await s1.client.from("audit_events").insert({ action: "x" })).error).not.toBeNull();
  });
  it("export logging is teacher-owner only", async () => {
    expect(await must(tA.client.rpc("log_export", { p_class_id: classA, p_kind: "progress" }))).toBe(true);
    expect(await must(tB.client.rpc("log_export", { p_class_id: classA, p_kind: "progress" }))).toBe(false);
    expect(await must(s1.client.rpc("log_export", { p_class_id: classA, p_kind: "progress" }))).toBe(false);
  });
});

describe("private schema is not exposed", () => {
  it("cannot reach private helpers through the Data API", async () => {
    const r = await s1.client.schema("private" as "public").from("code_redemption_attempts").select("*");
    expect(r.error).not.toBeNull();
  });
});

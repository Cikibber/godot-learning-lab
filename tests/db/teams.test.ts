// Gate C: team capacity under concurrency, proposal versions, milestones,
// contributions, and rubric visibility.
import { beforeAll, describe, expect, it } from "vitest";
import { admin, enroll, makeClass, makeUser, must, type Actor } from "./helpers";

let teacher: Actor, other: Actor;
let classId: string, otherClass: string;
let students: Actor[];
let foreign: Actor;

beforeAll(async () => {
  [teacher, other] = await Promise.all([makeUser("guruTim", "teacher"), makeUser("guruLain", "teacher")]);
  classId = await makeClass(teacher, "Kelas Tim");
  otherClass = await makeClass(other, "Kelas Lain");
  students = await Promise.all(Array.from({ length: 8 }, (_, i) => makeUser(`anggota${i}`, "student")));
  for (const s of students) await enroll(teacher, classId, s);
  foreign = await makeUser("asing", "student");
  await enroll(other, otherClass, foreign);
});

const newTeam = async (name: string) =>
  ((await must(teacher.client.from("teams").insert({ class_id: classId, name }).select("id").single())) as { id: string }).id;

const add = (teamId: string, s: Actor) =>
  teacher.client.from("team_members").insert({ team_id: teamId, class_id: classId, student_id: s.id });

describe("team membership", () => {
  it("concurrent adds never exceed four active members", async () => {
    const team = await newTeam("Balapan");
    const results = await Promise.all(students.slice(0, 6).map((s) => add(team, s)));
    expect(results.filter((r) => !r.error)).toHaveLength(4);
    const { count } = await admin().from("team_members").select("*", { count: "exact", head: true }).eq("team_id", team).is("left_at", null);
    expect(count).toBe(4);
    // Free them for later tests (history is kept, rows become inactive).
    await must(teacher.client.from("team_members").update({ left_at: new Date().toISOString() }).eq("team_id", team).is("left_at", null));
  });

  it("a student has at most one active team per class, even under concurrency", async () => {
    const [t1, t2] = await Promise.all([newTeam("Satu"), newTeam("Dua")]);
    const results = await Promise.all([add(t1, students[7]), add(t2, students[7])]);
    expect(results.filter((r) => !r.error)).toHaveLength(1);
    await must(teacher.client.from("team_members").update({ left_at: new Date().toISOString() }).eq("student_id", students[7].id).is("left_at", null));
  });

  it("rejects cross-class students and forged class ids; students cannot manage teams", async () => {
    const team = await newTeam("Aman");
    expect((await add(team, foreign)).error).not.toBeNull();
    const forged = await teacher.client.from("team_members").insert({ team_id: team, class_id: otherClass, student_id: students[0].id });
    expect(forged.error).not.toBeNull();
    expect((await students[0].client.from("team_members").insert({ team_id: team, class_id: classId, student_id: students[0].id })).error).not.toBeNull();
    expect((await other.client.from("team_members").insert({ team_id: team, class_id: classId, student_id: students[0].id })).error).not.toBeNull();
  });
});

describe("proposal → milestones → contributions → rubric", () => {
  let team: string;
  let members: Actor[];

  beforeAll(async () => {
    team = await newTeam("Proyek");
    members = students.slice(0, 3);
    await must(add(team, members[0]));
    await must(add(team, members[1]));
  });

  it("submission requires three or four members unless the teacher records an exception", async () => {
    const draft = (await must(
      members[0].client.from("project_proposals").insert({ team_id: team, body: { pitch: "Kumpulkan koin" } }).select().single(),
    )) as { id: string };
    const early = await members[0].client.from("project_proposals").update({ status: "submitted" }).eq("id", draft.id);
    expect(early.error?.message).toMatch(/three or four/);
    await must(add(team, members[2]));
    // Teammate edits with the right revision; a stale save matches nothing.
    await must(members[1].client.from("project_proposals").update({ body: { pitch: "v2" } }).eq("id", draft.id).eq("revision", 0));
    const stale = await must(members[0].client.from("project_proposals").update({ body: { pitch: "old" } }).eq("id", draft.id).eq("revision", 0).select());
    expect(stale).toHaveLength(0);
    await must(members[0].client.from("project_proposals").update({ status: "submitted" }).eq("id", draft.id));
  });

  it("changes requested → new version → approval binds to that version", async () => {
    const v1 = (await must(admin().from("project_proposals").select("id").eq("team_id", team).eq("version", 1).single())) as { id: string };
    expect((await members[0].client.from("proposal_reviews").insert({ proposal_id: v1.id, result: "approved", feedback: "x" })).error).not.toBeNull();
    expect((await other.client.from("proposal_reviews").insert({ proposal_id: v1.id, result: "approved", feedback: "x" })).error).not.toBeNull();
    // No new draft while awaiting review.
    expect((await members[0].client.from("project_proposals").insert({ team_id: team, body: {} })).error).not.toBeNull();
    await must(teacher.client.from("proposal_reviews").insert({ proposal_id: v1.id, result: "changes_requested", feedback: "Kecilkan ruang lingkup." }));
    // Milestones are blocked until approval.
    expect((await members[0].client.from("project_milestones").insert({ team_id: team, kind: "prototype", body: {} })).error).not.toBeNull();

    const v2 = (await must(members[1].client.from("project_proposals").insert({ team_id: team, body: { pitch: "lebih kecil" } }).select().single())) as { id: string; version: number };
    expect(v2.version).toBe(2);
    await must(members[1].client.from("project_proposals").update({ status: "submitted" }).eq("id", v2.id));
    // Reviewing an old version is refused.
    expect((await teacher.client.from("proposal_reviews").insert({ proposal_id: v1.id, result: "approved", feedback: "x" })).error).not.toBeNull();
    await must(teacher.client.from("proposal_reviews").insert({ proposal_id: v2.id, result: "approved", feedback: "Disetujui." }));
    expect((await members[0].client.from("project_proposals").insert({ team_id: team, body: {} })).error).not.toBeNull();
  });

  it("milestones version and review; contributions stay private", async () => {
    const m = (await must(members[0].client.from("project_milestones").insert({ team_id: team, kind: "prototype", body: { progress: "jalan" } }).select().single())) as { id: string };
    await must(members[0].client.from("project_milestones").update({ status: "submitted" }).eq("id", m.id));
    await must(teacher.client.from("milestone_reviews").insert({ milestone_id: m.id, result: "accepted", feedback: "Bagus", observation: "Membuat instance scene" }));

    await must(members[0].client.from("contribution_statements").insert({ team_id: team, milestone_kind: "prototype", body: "Saya membuat Player." }));
    const peers = await must(members[1].client.from("contribution_statements").select("id"));
    expect(peers).toHaveLength(0);
    expect(await must(teacher.client.from("contribution_statements").select("id").eq("team_id", team))).toHaveLength(1);
    // Non-members cannot read the team's proposal or milestones.
    expect(await must(students[5].client.from("project_proposals").select("id").eq("team_id", team))).toHaveLength(0);
  });

  it("rubric bounds and visibility", async () => {
    expect((await teacher.client.from("rubric_scores").insert({ class_id: classId, team_id: team, criterion: "core_loop", points: 21 })).error).not.toBeNull();
    expect((await teacher.client.from("rubric_scores").insert({ class_id: classId, team_id: team, criterion: "contribution", points: 10 })).error).not.toBeNull();
    expect((await teacher.client.from("rubric_scores").insert({ class_id: classId, team_id: team, student_id: foreign.id, criterion: "contribution", points: 10 })).error).not.toBeNull();
    await must(teacher.client.from("rubric_scores").insert([
      { class_id: classId, team_id: team, criterion: "core_loop", points: 18 },
      { class_id: classId, team_id: team, student_id: members[0].id, criterion: "contribution", points: 12 },
      { class_id: classId, team_id: team, student_id: members[1].id, criterion: "contribution", points: 9 },
    ]));
    const seen = (await must(members[0].client.from("rubric_scores").select("criterion,student_id"))) as { student_id: string | null }[];
    expect(seen).toHaveLength(2);
    expect(seen.every((r) => r.student_id === null || r.student_id === members[0].id)).toBe(true);
    expect((await members[0].client.from("rubric_scores").update({ points: 20 }).eq("team_id", team).select()).data ?? []).toHaveLength(0);
  });

  it("removing a member keeps history and blocks their access", async () => {
    await must(teacher.client.from("team_members").update({ left_at: new Date().toISOString() }).eq("team_id", team).eq("student_id", members[2].id).is("left_at", null));
    expect(await must(members[2].client.from("project_proposals").select("id").eq("team_id", team))).toHaveLength(0);
    const hist = await must(admin().from("team_members").select("id").eq("team_id", team).eq("student_id", members[2].id));
    expect(hist).toHaveLength(1);
    const roster = (await must(members[0].client.rpc("team_roster", { p_team_id: team }))) as { student_id: string }[];
    expect(roster.map((r) => r.student_id)).not.toContain(members[2].id);
    expect(await must(foreign.client.rpc("team_roster", { p_team_id: team }))).toHaveLength(0);
  });
});

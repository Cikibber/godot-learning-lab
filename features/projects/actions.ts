"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actorFor } from "@/lib/auth/session";
import type { Json } from "@/lib/db/types";
import type { SaveOutcome } from "@/lib/useAutosave";
import { MILESTONE_FIELDS, PROPOSAL_FIELDS, contributionSchema, validateBody } from "./schema";

const uuid = z.uuid();
const KINDS = ["prototype", "playable_loop", "final"] as const;
type Kind = (typeof KINDS)[number];
const isRls = (e: { code?: string; message: string } | null) => !!e && (e.code === "42501" || e.message.includes("row-level"));
const studentPath = (classId: string) => `/student/classes/${classId}/project`;
type JsonObject = Exclude<Json, null>;

// --- Student: proposals --------------------------------------------------------

export async function startProposal(classId: string, teamId: string) {
  const actor = await actorFor("student");
  if (!actor || !uuid.safeParse(teamId).success) return;
  // New version copies the latest body (the DB decides whether a new version is allowed).
  const { data: last } = await actor.supabase.from("project_proposals").select("body").eq("team_id", teamId).order("version", { ascending: false }).limit(1).maybeSingle();
  await actor.supabase.from("project_proposals").insert({ team_id: teamId, body: last?.body ?? {} });
  revalidatePath(studentPath(classId));
}

type SaveInput = { id: string | null; revision: number; body: unknown };

export async function saveProposal(input: SaveInput): Promise<SaveOutcome> {
  const actor = await actorFor("student");
  if (!actor || !input.id || !uuid.safeParse(input.id).success) return { ok: false, error: "unauthorized" };
  const v = validateBody(PROPOSAL_FIELDS, input.body, false);
  if (!v.ok) return { ok: false, error: "invalid" };
  const { data, error } = await actor.supabase
    .from("project_proposals")
    .update({ body: v.body as JsonObject })
    .eq("id", input.id)
    .eq("revision", input.revision)
    .eq("status", "draft")
    .select("id, revision");
  if (error) return { ok: false, error: isRls(error) ? "closed" : "generic" };
  if (!data.length) return { ok: false, error: "conflict" };
  return { ok: true, id: data[0].id, revision: data[0].revision };
}

export type SubmitResult = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

export async function submitProposal(classId: string, input: SaveInput): Promise<SubmitResult> {
  const actor = await actorFor("student");
  if (!actor || !input.id || !uuid.safeParse(input.id).success) return { ok: false, error: "unauthorized" };
  const v = validateBody(PROPOSAL_FIELDS, input.body, true);
  if (!v.ok) return { ok: false, error: "invalid", fields: v.errors };
  const { data, error } = await actor.supabase
    .from("project_proposals")
    .update({ body: v.body as JsonObject, status: "submitted" })
    .eq("id", input.id)
    .eq("revision", input.revision)
    .eq("status", "draft")
    .select("id");
  if (error?.code === "23514") return { ok: false, error: "teamSize" };
  if (error) return { ok: false, error: isRls(error) ? "closed" : "generic" };
  if (!data.length) {
    const { data: row } = await actor.supabase.from("project_proposals").select("status").eq("id", input.id).single();
    if (row?.status !== "submitted") return { ok: false, error: "conflict" };
  }
  revalidatePath(studentPath(classId));
  return { ok: true };
}

// --- Student: milestones -------------------------------------------------------

export async function startMilestone(classId: string, teamId: string, kind: string) {
  const actor = await actorFor("student");
  if (!actor || !uuid.safeParse(teamId).success || !KINDS.includes(kind as Kind)) return;
  const { data: last } = await actor.supabase.from("project_milestones").select("body").eq("team_id", teamId).eq("kind", kind as Kind).order("version", { ascending: false }).limit(1).maybeSingle();
  await actor.supabase.from("project_milestones").insert({ team_id: teamId, kind: kind as Kind, body: last?.body ?? {} });
  revalidatePath(studentPath(classId));
}

export async function saveMilestone(input: SaveInput): Promise<SaveOutcome> {
  const actor = await actorFor("student");
  if (!actor || !input.id || !uuid.safeParse(input.id).success) return { ok: false, error: "unauthorized" };
  const v = validateBody(MILESTONE_FIELDS, input.body, false);
  if (!v.ok) return { ok: false, error: "invalid" };
  const { data, error } = await actor.supabase
    .from("project_milestones")
    .update({ body: v.body as JsonObject })
    .eq("id", input.id)
    .eq("revision", input.revision)
    .eq("status", "draft")
    .select("id, revision");
  if (error) return { ok: false, error: isRls(error) ? "closed" : "generic" };
  if (!data.length) return { ok: false, error: "conflict" };
  return { ok: true, id: data[0].id, revision: data[0].revision };
}

export async function submitMilestone(classId: string, input: SaveInput): Promise<SubmitResult> {
  const actor = await actorFor("student");
  if (!actor || !input.id || !uuid.safeParse(input.id).success) return { ok: false, error: "unauthorized" };
  const v = validateBody(MILESTONE_FIELDS, input.body, true);
  if (!v.ok) return { ok: false, error: "invalid", fields: v.errors };
  const { data, error } = await actor.supabase
    .from("project_milestones")
    .update({ body: v.body as JsonObject, status: "submitted" })
    .eq("id", input.id)
    .eq("revision", input.revision)
    .eq("status", "draft")
    .select("id");
  if (error) return { ok: false, error: isRls(error) ? "closed" : "generic" };
  if (!data.length) {
    const { data: row } = await actor.supabase.from("project_milestones").select("status").eq("id", input.id).single();
    if (row?.status !== "submitted") return { ok: false, error: "conflict" };
  }
  revalidatePath(studentPath(classId));
  return { ok: true };
}

export async function saveContribution(classId: string, teamId: string, kind: string, fd: FormData) {
  const actor = await actorFor("student");
  const parsed = contributionSchema.safeParse({ body: fd.get("body") });
  if (!actor || !parsed.success || !uuid.safeParse(teamId).success || !KINDS.includes(kind as Kind)) {
    redirect(`${studentPath(classId)}?error=contribution`);
  }
  const { data: existing } = await actor.supabase
    .from("contribution_statements")
    .select("id")
    .eq("team_id", teamId)
    .eq("student_id", actor.id)
    .eq("milestone_kind", kind as Kind)
    .maybeSingle();
  const { error } = existing
    ? await actor.supabase.from("contribution_statements").update({ body: parsed.data.body }).eq("id", existing.id)
    : await actor.supabase.from("contribution_statements").insert({ team_id: teamId, milestone_kind: kind as Kind, body: parsed.data.body });
  revalidatePath(studentPath(classId));
  redirect(`${studentPath(classId)}?${error ? "error=contribution" : "saved=contribution"}`);
}

// --- Teacher: decisions and rubric ----------------------------------------------

const projectsPath = (classId: string) => `/teacher/classes/${classId}/projects`;
const feedback = z.string().trim().min(1).max(2000);

export async function reviewProposal(classId: string, proposalId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  const result = z.enum(["approved", "changes_requested"]).safeParse(fd.get("result"));
  const fb = feedback.safeParse(fd.get("feedback"));
  if (!actor || !result.success || !fb.success || !uuid.safeParse(proposalId).success) redirect(`${projectsPath(classId)}?error=review`);
  const { error } = await actor.supabase.from("proposal_reviews").insert({ proposal_id: proposalId, result: result.data, feedback: fb.data });
  revalidatePath(projectsPath(classId));
  redirect(`${projectsPath(classId)}?${error ? "error=review" : "saved=review"}`);
}

export async function reviewMilestone(classId: string, milestoneId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  const result = z.enum(["accepted", "needs_revision"]).safeParse(fd.get("result"));
  const fb = feedback.safeParse(fd.get("feedback"));
  const obs = z.string().trim().max(1000).safeParse(fd.get("observation") ?? "");
  if (!actor || !result.success || !fb.success || !obs.success || !uuid.safeParse(milestoneId).success) redirect(`${projectsPath(classId)}?error=review`);
  const { error } = await actor.supabase.from("milestone_reviews").insert({ milestone_id: milestoneId, result: result.data, feedback: fb.data, observation: obs.data });
  revalidatePath(projectsPath(classId));
  redirect(`${projectsPath(classId)}?${error ? "error=review" : "saved=review"}`);
}

/**
 * Saves every rubric field present in the form. Blank points are skipped
 * (not scored yet); the DB enforces maxima and team membership.
 */
export async function saveScores(classId: string, teamId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  if (!actor || !uuid.safeParse(teamId).success) redirect(`${projectsPath(classId)}?error=scores`);
  const { data: existing } = await actor.supabase.from("rubric_scores").select("id, student_id, criterion").eq("team_id", teamId);
  let failed = false;
  for (const [name, value] of fd.entries()) {
    const m = /^pts:([a-z_]+):(team|[0-9a-f-]{36})$/.exec(name);
    if (!m || typeof value !== "string" || value.trim() === "") continue;
    const points = Number(value);
    const studentId = m[2] === "team" ? null : m[2];
    const note = String(fd.get(`note:${m[1]}:${m[2]}`) ?? "").slice(0, 1000);
    if (!Number.isFinite(points) || points < 0) {
      failed = true;
      continue;
    }
    const row = existing?.find((r) => r.criterion === m[1] && r.student_id === studentId);
    const { error } = row
      ? await actor.supabase.from("rubric_scores").update({ points, feedback: note }).eq("id", row.id)
      : await actor.supabase.from("rubric_scores").insert({ class_id: classId, team_id: teamId, student_id: studentId, criterion: m[1], points, feedback: note });
    if (error) failed = true;
  }
  revalidatePath(projectsPath(classId));
  redirect(`${projectsPath(classId)}?team=${teamId}&${failed ? "error=scores" : "saved=scores"}#rubric`);
}

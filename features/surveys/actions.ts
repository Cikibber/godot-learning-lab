"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorFor } from "@/lib/auth/session";
import { surveyContext } from "@/lib/db/surveys";
import { validateAnswers, type FieldError } from "@/lib/validation/survey";
import type { Json } from "@/lib/db/types";
import type { SaveOutcome } from "@/lib/useAutosave";

const ids = z.object({ assignmentId: z.uuid(), id: z.uuid().nullable(), revision: z.number().int().min(0) });
const isRls = (e: { code?: string; message: string } | null) => !!e && (e.code === "42501" || e.message.includes("row-level"));

type Input = { assignmentId: string; id: string | null; revision: number; answers: unknown };

export async function saveSurveyDraft(input: Input): Promise<SaveOutcome> {
  const actor = await actorFor("student");
  if (!actor || !ids.safeParse(input).success) return { ok: false, error: "unauthorized" };
  const sc = await surveyContext(actor, input.assignmentId);
  if (!sc) return { ok: false, error: "unauthorized" };
  const v = validateAnswers(sc.survey, input.answers, sc.ctx, "draft");
  if (!v.ok) return { ok: false, error: "invalid" };
  const answers = v.clean as unknown as Exclude<Json, null>;
  if (!input.id) {
    const { data, error } = await actor.supabase.from("survey_responses").insert({ assignment_id: input.assignmentId, answers }).select("id, revision").single();
    if (error?.code === "23505") return { ok: false, error: "conflict" };
    if (error || !data) return { ok: false, error: isRls(error) ? "closed" : "generic" };
    return { ok: true, id: data.id, revision: data.revision };
  }
  const { data, error } = await actor.supabase
    .from("survey_responses")
    .update({ answers })
    .eq("id", input.id)
    .eq("revision", input.revision)
    .eq("status", "draft")
    .select("id, revision");
  if (error) return { ok: false, error: isRls(error) ? "closed" : "generic" };
  if (!data.length) return { ok: false, error: "conflict" };
  return { ok: true, id: data[0].id, revision: data[0].revision };
}

export type SubmitSurveyResult = { ok: true } | { ok: false; error: string; fields?: Record<string, FieldError> };

export async function submitSurvey(input: Input): Promise<SubmitSurveyResult> {
  const actor = await actorFor("student");
  if (!actor || !ids.safeParse(input).success) return { ok: false, error: "unauthorized" };
  const sc = await surveyContext(actor, input.assignmentId);
  if (!sc) return { ok: false, error: "unauthorized" };
  const v = validateAnswers(sc.survey, input.answers, sc.ctx, "submit");
  if (!v.ok) return { ok: false, error: "invalid", fields: v.errors };
  let id = input.id;
  let revision = input.revision;
  if (!id) {
    const saved = await saveSurveyDraft(input);
    if (!saved.ok) return { ok: false, error: saved.error };
    id = saved.id;
    revision = saved.revision;
  }
  const { data, error } = await actor.supabase
    .from("survey_responses")
    .update({ answers: v.clean as unknown as Exclude<Json, null>, status: "submitted" })
    .eq("id", id)
    .eq("revision", revision)
    .eq("status", "draft")
    .select("id");
  if (error) return { ok: false, error: isRls(error) ? "closed" : "generic" };
  if (!data.length) {
    const { data: row } = await actor.supabase.from("survey_responses").select("status").eq("id", id).single();
    if (row?.status !== "submitted") return { ok: false, error: "conflict" };
  }
  revalidatePath(`/student/surveys/${input.assignmentId}`);
  return { ok: true };
}

/** Versioned resubmission: a new draft copied from the latest submission. */
export async function startResubmission(assignmentId: string) {
  const actor = await actorFor("student");
  if (!actor || !z.uuid().safeParse(assignmentId).success) return;
  const { data: last } = await actor.supabase
    .from("survey_responses")
    .select("answers")
    .eq("assignment_id", assignmentId)
    .eq("student_id", actor.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  await actor.supabase.from("survey_responses").insert({ assignment_id: assignmentId, answers: last?.answers ?? {} });
  revalidatePath(`/student/surveys/${assignmentId}`);
}

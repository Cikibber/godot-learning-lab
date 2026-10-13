"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actorFor, type Actor } from "@/lib/auth/session";
import { parseLesson } from "@/lib/db/queries";
import type { Json } from "@/lib/db/types";

type JsonObject = Exclude<Json, null>;
import { validateDraft, validateSubmission, type SubmissionError } from "./validate";

export type SaveResult =
  | { ok: true; attemptId: string; revision: number; status: "draft" | "submitted" }
  | { ok: false; error: "conflict" | "closed" | "invalid" | "unauthorized" | "generic"; fields?: SubmissionError[] };

type Input = { assignmentId: string; attemptId: string | null; revision: number; mode: "canvas" | "step"; evidence: unknown; answers: unknown };

const ids = z.object({ assignmentId: z.uuid(), attemptId: z.uuid().nullable(), revision: z.number().int().min(0) });

async function loadLesson(actor: Actor, assignmentId: string) {
  const { data } = await actor.supabase
    .from("assignments")
    .select("id, lesson_versions(content)")
    .eq("id", assignmentId)
    .eq("kind", "lesson")
    .maybeSingle();
  const content = (data?.lesson_versions as { content: unknown } | null)?.content;
  return content ? parseLesson(content) : null;
}

// RLS refusals on insert/update surface as 42501; on this table they mean the
// assignment is closed/unpublished or the class is archived.
const isRls = (e: { code?: string; message: string } | null) => !!e && (e.code === "42501" || e.message.includes("row-level"));

export async function saveDraft(input: Input): Promise<SaveResult> {
  const actor = await actorFor("student");
  if (!actor || !ids.safeParse(input).success) return { ok: false, error: "unauthorized" };
  const lesson = await loadLesson(actor, input.assignmentId);
  if (!lesson) return { ok: false, error: "unauthorized" };
  const v = validateDraft(lesson, input.evidence, input.answers);
  if (!v.ok) return { ok: false, error: "invalid" };
  const mode = input.mode === "step" ? "step" : "canvas";

  if (!input.attemptId) {
    const { data, error } = await actor.supabase
      .from("exercise_attempts")
      .insert({ assignment_id: input.assignmentId, mode, evidence: v.evidence as JsonObject, answers: v.answers as JsonObject })
      .select("id, revision")
      .single();
    if (error?.code === "23505") return { ok: false, error: "conflict" }; // another tab created the draft
    if (error || !data) return { ok: false, error: isRls(error) ? "closed" : "generic" };
    return { ok: true, attemptId: data.id, revision: data.revision, status: "draft" };
  }

  // Optimistic concurrency: only the revision this tab last saw may be updated.
  const { data, error } = await actor.supabase
    .from("exercise_attempts")
    .update({ mode, evidence: v.evidence as JsonObject, answers: v.answers as JsonObject })
    .eq("id", input.attemptId)
    .eq("revision", input.revision)
    .eq("status", "draft")
    .select("id, revision");
  if (error) return { ok: false, error: isRls(error) ? "closed" : "generic" };
  if (!data.length) return { ok: false, error: "conflict" };
  return { ok: true, attemptId: data[0].id, revision: data[0].revision, status: "draft" };
}

export async function submitAttempt(input: Input): Promise<SaveResult> {
  const actor = await actorFor("student");
  if (!actor || !ids.safeParse(input).success) return { ok: false, error: "unauthorized" };
  const lesson = await loadLesson(actor, input.assignmentId);
  if (!lesson) return { ok: false, error: "unauthorized" };
  const v = validateSubmission(lesson, input.evidence, input.answers);
  if (!v.ok) return { ok: false, error: "invalid", fields: v.errors };

  let attemptId = input.attemptId;
  let revision = input.revision;
  if (!attemptId) {
    const saved = await saveDraft(input);
    if (!saved.ok) return saved;
    attemptId = saved.attemptId;
    revision = saved.revision;
  }
  const { data, error } = await actor.supabase
    .from("exercise_attempts")
    .update({ status: "submitted", mode: input.mode === "step" ? "step" : "canvas", evidence: v.evidence as JsonObject, answers: v.answers as JsonObject })
    .eq("id", attemptId)
    .eq("revision", revision)
    .eq("status", "draft")
    .select("id, revision");
  if (error) return { ok: false, error: isRls(error) ? "closed" : "generic" };
  if (!data.length) {
    // Idempotent retry: a repeated request for an already-submitted attempt succeeds.
    const { data: row } = await actor.supabase.from("exercise_attempts").select("id, revision, status").eq("id", attemptId).single();
    if (row?.status === "submitted") return { ok: true, attemptId: row.id, revision: row.revision, status: "submitted" };
    return { ok: false, error: "conflict" };
  }
  revalidatePath(`/student/lessons/${input.assignmentId}`);
  return { ok: true, attemptId: data[0].id, revision: data[0].revision, status: "submitted" };
}

/** A revision is a new draft linked to the previous (immutable) submission. */
export async function startRevision(assignmentId: string, previousAttemptId: string) {
  const actor = await actorFor("student");
  if (!actor || !z.uuid().safeParse(previousAttemptId).success) return;
  const { data: prev } = await actor.supabase.from("exercise_attempts").select("evidence, answers, mode").eq("id", previousAttemptId).single();
  if (!prev) return;
  await actor.supabase.from("exercise_attempts").insert({
    assignment_id: assignmentId,
    previous_attempt_id: previousAttemptId,
    evidence: prev.evidence,
    answers: prev.answers,
    mode: prev.mode,
  });
  revalidatePath(`/student/lessons/${assignmentId}`);
}

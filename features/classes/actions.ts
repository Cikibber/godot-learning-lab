"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actorFor } from "@/lib/auth/session";
import { isValidTimeZone, localToUtc } from "@/lib/time";

export type ActionResult = { ok: boolean; error?: string; code?: string } | null;

const uuid = z.uuid();
const fail = (error = "generic"): ActionResult => ({ ok: false, error });

const classSchema = z.object({
  name: z.string().trim().min(1).max(80),
  term: z.string().trim().max(40),
  timezone: z.string().refine(isValidTimeZone),
});

export async function createClass(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const actor = await actorFor("teacher");
  if (!actor) return fail("unauthorized");
  const parsed = classSchema.safeParse({ name: fd.get("name"), term: fd.get("term") ?? "", timezone: fd.get("timezone") });
  if (!parsed.success) return fail("invalid");
  const { data, error } = await actor.supabase
    .from("classes")
    .insert({ ...parsed.data, teacher_id: actor.id })
    .select("id")
    .single();
  if (error || !data) return fail();
  redirect(`/teacher/classes/${data.id}`);
}

export async function archiveClass(classId: string, archived: boolean) {
  const actor = await actorFor("teacher");
  if (!actor || !uuid.safeParse(classId).success) return fail("unauthorized");
  const { error, data } = await actor.supabase
    .from("classes")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", classId)
    .select("id");
  if (error || !data?.length) return fail();
  revalidatePath(`/teacher/classes/${classId}`);
  return { ok: true };
}

const inviteSchema = z.object({ days: z.coerce.number().int().min(1).max(90), maxUses: z.coerce.number().int().min(1).max(200) });

/** Returns the plaintext code exactly once; only its hash is stored. */
export async function rotateInvite(classId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const actor = await actorFor("teacher");
  if (!actor || !uuid.safeParse(classId).success) return fail("unauthorized");
  const parsed = inviteSchema.safeParse({ days: fd.get("days"), maxUses: fd.get("maxUses") });
  if (!parsed.success) return fail("invalid");
  const { data, error } = await actor.supabase.rpc("rotate_class_code", {
    p_class_id: classId,
    p_days: parsed.data.days,
    p_max_uses: parsed.data.maxUses,
  });
  if (error || !data) return fail();
  revalidatePath(`/teacher/classes/${classId}`);
  return { ok: true, code: data };
}

export async function revokeInvites(classId: string) {
  const actor = await actorFor("teacher");
  if (!actor || !uuid.safeParse(classId).success) return;
  await actor.supabase.from("class_invites").update({ revoked_at: new Date().toISOString() }).eq("class_id", classId).is("revoked_at", null);
  revalidatePath(`/teacher/classes/${classId}`);
}

const decision = z.enum(["approved", "rejected", "withdrawn"]);

export async function decideEnrollment(classId: string, enrollmentId: string, status: string) {
  const actor = await actorFor("teacher");
  const s = decision.safeParse(status);
  if (!actor || !s.success || !uuid.safeParse(enrollmentId).success) return;
  await actor.supabase.from("enrollments").update({ status: s.data }).eq("id", enrollmentId).eq("class_id", classId);
  revalidatePath(`/teacher/classes/${classId}`);
}

const sessionSchema = z.object({ label: z.string().trim().min(1).max(80), notes: z.string().trim().max(300) });

export async function addSession(classId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  const parsed = sessionSchema.safeParse({ label: fd.get("label"), notes: fd.get("notes") ?? "" });
  if (!actor || !parsed.success || !uuid.safeParse(classId).success) return;
  await actor.supabase.from("class_sessions").insert({ class_id: classId, ...parsed.data });
  revalidatePath(`/teacher/classes/${classId}`);
}

export async function removeSession(classId: string, sessionId: string) {
  const actor = await actorFor("teacher");
  if (!actor || !uuid.safeParse(sessionId).success) return;
  await actor.supabase.from("class_sessions").delete().eq("id", sessionId).eq("class_id", classId);
  revalidatePath(`/teacher/classes/${classId}`);
}

// --- Assignments ---------------------------------------------------------------

export async function addAssignment(classId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  if (!actor || !uuid.safeParse(classId).success) return;
  const ref = String(fd.get("content") ?? "");
  const [kind, id] = ref.split(":");
  if (!uuid.safeParse(id).success || (kind !== "lesson" && kind !== "survey")) return;
  const { count } = await actor.supabase.from("assignments").select("*", { count: "exact", head: true }).eq("class_id", classId);
  await actor.supabase.from("assignments").insert({
    class_id: classId,
    kind,
    lesson_version_id: kind === "lesson" ? id : null,
    survey_version_id: kind === "survey" ? id : null,
    position: (count ?? 0) * 10,
  });
  revalidatePath(`/teacher/classes/${classId}/assignments`);
}

const scheduleSchema = z.object({
  due: z.string().max(16),
  published: z.enum(["yes", "no"]),
  closed: z.enum(["yes", "no"]),
  position: z.coerce.number().int().min(0).max(1000),
});

export async function updateAssignment(classId: string, assignmentId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  if (!actor || !uuid.safeParse(assignmentId).success) return;
  const parsed = scheduleSchema.safeParse({
    due: fd.get("due") ?? "",
    published: fd.get("published") ? "yes" : "no",
    closed: fd.get("closed") ? "yes" : "no",
    position: fd.get("position"),
  });
  if (!parsed.success) return;
  const { data: cls } = await actor.supabase.from("classes").select("timezone").eq("id", classId).single();
  const { data: current } = await actor.supabase.from("assignments").select("published_at, closed_at").eq("id", assignmentId).single();
  if (!cls || !current) return;
  const due = parsed.data.due ? localToUtc(parsed.data.due, cls.timezone) : null;
  if (parsed.data.due && !due) return;
  const now = new Date().toISOString();
  await actor.supabase
    .from("assignments")
    .update({
      due_at: due?.toISOString() ?? null,
      position: parsed.data.position,
      published_at: parsed.data.published === "yes" ? current.published_at ?? now : null,
      closed_at: parsed.data.closed === "yes" ? current.closed_at ?? now : null,
    })
    .eq("id", assignmentId)
    .eq("class_id", classId);
  revalidatePath(`/teacher/classes/${classId}/assignments`);
}

// --- Student side ----------------------------------------------------------

export async function redeemCode(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const actor = await actorFor("student");
  if (!actor) return fail("unauthorized");
  const code = String(fd.get("code") ?? "").trim();
  if (!code || code.length > 20) return fail("codeInvalid");
  const { data, error } = await actor.supabase.rpc("redeem_class_code", { p_code: code });
  // Generic outcome: never confirm whether a code or class exists.
  if (error || !data) return fail("codeInvalid");
  revalidatePath("/student");
  return { ok: true };
}

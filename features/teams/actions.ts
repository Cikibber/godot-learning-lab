"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actorFor } from "@/lib/auth/session";

const uuid = z.uuid();
const path = (classId: string) => `/teacher/classes/${classId}/teams`;
const back = (classId: string, error?: string): never => redirect(`${path(classId)}${error ? `?error=${error}` : ""}`);

export async function createTeam(classId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  const name = z.string().trim().min(1).max(60).safeParse(fd.get("name"));
  if (!actor || !name.success || !uuid.safeParse(classId).success) return back(classId, "invalid");
  const { error } = await actor.supabase.from("teams").insert({ class_id: classId, name: name.data });
  revalidatePath(path(classId));
  if (error) back(classId, "generic");
}

/** Capacity, same-class, and one-active-team rules are enforced in the DB under a row lock. */
export async function addMember(classId: string, teamId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  const student = uuid.safeParse(fd.get("student"));
  if (!actor || !student.success || !uuid.safeParse(teamId).success) return back(classId, "invalid");
  const { error } = await actor.supabase.from("team_members").insert({ team_id: teamId, class_id: classId, student_id: student.data });
  revalidatePath(path(classId));
  if (error) back(classId, error.code === "23514" ? "full" : error.code === "23505" ? "hasTeam" : "generic");
}

export async function removeMember(classId: string, memberId: string) {
  const actor = await actorFor("teacher");
  if (!actor || !uuid.safeParse(memberId).success) return;
  await actor.supabase.from("team_members").update({ left_at: new Date().toISOString() }).eq("id", memberId).eq("class_id", classId).is("left_at", null);
  revalidatePath(path(classId));
}

export async function setException(classId: string, teamId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  const reason = z.string().trim().max(300).safeParse(fd.get("reason") ?? "");
  if (!actor || !reason.success || !uuid.safeParse(teamId).success) return back(classId, "invalid");
  await actor.supabase.from("teams").update({ size_exception_reason: reason.data || null }).eq("id", teamId).eq("class_id", classId);
  revalidatePath(path(classId));
}

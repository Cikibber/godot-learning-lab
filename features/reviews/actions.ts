"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actorFor } from "@/lib/auth/session";

const schema = z.object({
  result: z.enum(["accepted", "needs_revision"]),
  feedback: z.string().trim().min(1).max(2000),
});

export async function reviewAttempt(classId: string, attemptId: string, fd: FormData) {
  const actor = await actorFor("teacher");
  const parsed = schema.safeParse({ result: fd.get("result"), feedback: fd.get("feedback") });
  if (!actor || !parsed.success || !z.uuid().safeParse(attemptId).success) {
    redirect(`/teacher/classes/${classId}/reviews/${attemptId}?error=1`);
  }
  // RLS + trigger guarantee: owning teacher only, submitted attempts only.
  const { error } = await actor.supabase.from("attempt_reviews").insert({ attempt_id: attemptId, ...parsed.data });
  if (error) redirect(`/teacher/classes/${classId}/reviews/${attemptId}?error=1`);
  revalidatePath(`/teacher/classes/${classId}/reviews`);
  redirect(`/teacher/classes/${classId}/reviews?done=1`);
}

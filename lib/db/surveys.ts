import "server-only";
import type { Actor } from "@/lib/auth/session";
import { parseSurvey } from "./queries";

/** Survey content plus the server-side validation context for this student. */
export async function surveyContext(actor: Actor, assignmentId: string) {
  const { data } = await actor.supabase
    .from("assignments")
    .select("id, class_id, survey_versions(content)")
    .eq("id", assignmentId)
    .eq("kind", "survey")
    .maybeSingle();
  const content = (data?.survey_versions as { content: unknown } | null)?.content;
  if (!data || !content) return null;
  const [{ data: roster }, { data: sessions }] = await Promise.all([
    actor.supabase.rpc("class_roster_names", { p_class_id: data.class_id }),
    actor.supabase.from("class_sessions").select("id, label").eq("class_id", data.class_id).order("created_at"),
  ]);
  const classmates = (roster ?? []).filter((r) => r.student_id !== actor.id);
  return {
    classId: data.class_id,
    survey: parseSurvey(content),
    classmates,
    sessions: sessions ?? [],
    ctx: { classmateIds: classmates.map((c) => c.student_id), sessionIds: (sessions ?? []).map((s) => s.id) },
  };
}


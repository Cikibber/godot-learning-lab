import "server-only";
import type { Actor } from "@/lib/auth/session";
import { classAssignments, type AssignmentView } from "./queries";
import { deriveProgress, type ProgressStatus } from "@/lib/progress";

export type StudentItem = AssignmentView & { status: ProgressStatus | "not_started" | "draft" | "submitted" };

/** Published assignments of one approved class with this student's status. */
export async function studentClassItems(actor: Actor, classId: string): Promise<StudentItem[]> {
  const assignments = (await classAssignments(actor, classId)).filter((a) => a.publishedAt);
  const ids = assignments.map((a) => a.id);
  if (!ids.length) return [];
  const [{ data: attempts }, { data: responses }] = await Promise.all([
    actor.supabase.from("exercise_attempts").select("id, assignment_id, attempt_no, status, checks:evidence->checkResults").eq("student_id", actor.id).in("assignment_id", ids),
    actor.supabase.from("survey_responses").select("assignment_id, status").eq("student_id", actor.id).in("assignment_id", ids),
  ]);
  const attemptIds = (attempts ?? []).map((a) => a.id);
  const { data: reviews } = attemptIds.length
    ? await actor.supabase.from("attempt_reviews").select("attempt_id, result, created_at").in("attempt_id", attemptIds)
    : { data: [] };
  return assignments.map((a) => {
    if (a.kind === "survey") {
      const rs = (responses ?? []).filter((r) => r.assignment_id === a.id);
      const status = rs.some((r) => r.status === "submitted") ? "submitted" : rs.length ? "draft" : "not_started";
      return { ...a, status };
    }
    const mine = (attempts ?? []).filter((x) => x.assignment_id === a.id).map((x) => ({ ...x, evidence: { checkResults: x.checks } }));
    return { ...a, status: deriveProgress(mine, reviews ?? []) };
  });
}

export async function myEnrollments(actor: Actor) {
  const { data } = await actor.supabase
    .from("enrollments")
    .select("id, class_id, status, classes(name, term, timezone)")
    .eq("student_id", actor.id)
    .order("requested_at");
  return (data ?? []).map((e) => ({ ...e, cls: e.classes as { name: string; term: string; timezone: string } | null }));
}

export const itemHref = (i: StudentItem) => (i.kind === "lesson" ? `/student/lessons/${i.id}` : `/student/surveys/${i.id}`);
export const itemTitle = (i: StudentItem, locale: "id" | "en") =>
  i.lesson ? `${i.lesson.module}. ${i.lesson.title[locale]}` : (i.survey?.title[locale] ?? "");

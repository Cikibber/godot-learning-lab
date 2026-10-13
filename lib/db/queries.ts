import "server-only";
import { notFound } from "next/navigation";
import type { Actor } from "@/lib/auth/session";
import { lessonContent, surveyContent, type LessonContent, type SurveyContent } from "@/lib/validation/content";
import { progressByStudent, type ProgressStatus } from "@/lib/progress";

/** Owned class or 404 (RLS returns nothing for other teachers' classes). */
export async function teacherClass(actor: Actor, classId: string) {
  const { data } = await actor.supabase.from("classes").select("*").eq("id", classId).maybeSingle();
  if (!data || data.teacher_id !== actor.id) notFound();
  return data;
}

export async function roster(actor: Actor, classId: string) {
  const { data } = await actor.supabase
    .from("enrollments")
    .select("id, student_id, status, requested_at, profiles!enrollments_student_id_fkey(display_name)")
    .eq("class_id", classId)
    .order("requested_at");
  return (data ?? []).map((e) => ({
    id: e.id,
    studentId: e.student_id,
    status: e.status,
    requestedAt: e.requested_at,
    name: (e.profiles as { display_name: string } | null)?.display_name ?? "?",
  }));
}

export function parseLesson(content: unknown): LessonContent {
  return lessonContent.parse(content);
}
export function parseSurvey(content: unknown): SurveyContent {
  return surveyContent.parse(content);
}

export async function classAssignments(actor: Actor, classId: string) {
  const { data } = await actor.supabase
    .from("assignments")
    .select("id, kind, position, published_at, due_at, closed_at, lesson_versions(lesson_key, version, module_no, content), survey_versions(survey_key, version, content)")
    .eq("class_id", classId)
    .order("position")
    .order("created_at");
  return (data ?? []).map((a) => {
    const lv = a.lesson_versions as { content: unknown; version: number } | null;
    const sv = a.survey_versions as { content: unknown; version: number } | null;
    return {
      id: a.id,
      kind: a.kind,
      position: a.position,
      publishedAt: a.published_at,
      dueAt: a.due_at,
      closedAt: a.closed_at,
      lesson: lv ? parseLesson(lv.content) : null,
      survey: sv ? parseSurvey(sv.content) : null,
    };
  });
}
export type AssignmentView = Awaited<ReturnType<typeof classAssignments>>[number];

/** Per assignment → per student lesson status, from scoped attempts/reviews. */
export async function lessonProgress(actor: Actor, assignmentIds: string[]) {
  const result = new Map<string, Map<string, ProgressStatus>>();
  if (!assignmentIds.length) return result;
  const { data: attempts } = await actor.supabase
    .from("exercise_attempts")
    .select("id, assignment_id, student_id, attempt_no, status, checks:evidence->checkResults")
    .in("assignment_id", assignmentIds)
    .limit(5000);
  const ids = (attempts ?? []).map((a) => a.id);
  const reviews: { attempt_id: string; result: "accepted" | "needs_revision"; created_at: string }[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await actor.supabase.from("attempt_reviews").select("attempt_id, result, created_at").in("attempt_id", ids.slice(i, i + 200));
    reviews.push(...(data ?? []));
  }
  for (const aid of assignmentIds) {
    const rows = (attempts ?? [])
      .filter((a) => a.assignment_id === aid)
      .map((a) => ({ ...a, evidence: { checkResults: a.checks } }));
    result.set(aid, progressByStudent(rows, reviews));
  }
  return result;
}

/** Latest response status per student for survey assignments. */
export async function surveyCompletion(actor: Actor, assignmentIds: string[]) {
  const result = new Map<string, Map<string, "draft" | "submitted">>();
  if (!assignmentIds.length) return result;
  const { data } = await actor.supabase
    .from("survey_responses")
    .select("assignment_id, student_id, status")
    .in("assignment_id", assignmentIds)
    .limit(5000);
  for (const aid of assignmentIds) result.set(aid, new Map());
  for (const r of data ?? []) {
    const m = result.get(r.assignment_id)!;
    if (r.status === "submitted" || !m.has(r.student_id)) m.set(r.student_id, r.status);
  }
  return result;
}

// Progress is derived from scoped attempts and reviews; there is no separate
// progress table to drift out of sync.
export type ProgressStatus = "not_started" | "draft" | "submitted" | "practice_passed" | "needs_revision" | "accepted";

export type AttemptLite = {
  id: string;
  attempt_no: number;
  status: "draft" | "submitted";
  evidence: unknown;
};
export type ReviewLite = { attempt_id: string; result: "accepted" | "needs_revision"; created_at: string };

function allChecksPassed(evidence: unknown): boolean {
  const results = (evidence as { checkResults?: { passed: boolean }[] } | null)?.checkResults;
  return Array.isArray(results) && results.length > 0 && results.every((r) => r.passed === true);
}

/** Status for one student on one lesson assignment. */
export function deriveProgress(attempts: AttemptLite[], reviews: ReviewLite[]): ProgressStatus {
  const hasDraft = attempts.some((a) => a.status === "draft");
  const submitted = attempts.filter((a) => a.status === "submitted").sort((a, b) => b.attempt_no - a.attempt_no)[0];
  if (!submitted) return hasDraft ? "draft" : "not_started";
  const latestReview = reviews
    .filter((r) => r.attempt_id === submitted.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (latestReview?.result === "accepted") return "accepted";
  if (latestReview?.result === "needs_revision") return hasDraft ? "draft" : "needs_revision";
  // Passing checks is practice evidence awaiting review, never a grade.
  return allChecksPassed(submitted.evidence) ? "practice_passed" : "submitted";
}

/** Groups rows by student and returns a status per student. */
export function progressByStudent(attempts: (AttemptLite & { student_id: string })[], reviews: ReviewLite[]) {
  const byStudent = new Map<string, (AttemptLite & { student_id: string })[]>();
  for (const a of attempts) byStudent.set(a.student_id, [...(byStudent.get(a.student_id) ?? []), a]);
  const out = new Map<string, ProgressStatus>();
  for (const [sid, list] of byStudent) out.set(sid, deriveProgress(list, reviews));
  return out;
}

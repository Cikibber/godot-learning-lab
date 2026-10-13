// Server-side validation of lesson work. Every registered check is recomputed
// here from the saved config + summary, so a tampered client cannot claim a
// config check it did not meet. Play-summary checks remain student-supplied
// formative evidence (documented limitation).
import { z } from "zod";
import { evidenceSchema, type Evidence } from "@/exercises/schema";
import { runChecks } from "@/exercises/checks";
import type { LessonContent } from "@/lib/validation/content";

export const answersSchema = z.object({
  quiz: z.number().int().min(0).max(4).nullable(),
  reflection: z.string().max(1500),
  transfer: z.string().max(1500),
});
export type LessonAnswers = z.infer<typeof answersSchema>;
export const emptyAnswers: LessonAnswers = { quiz: null, reflection: "", transfer: "" };

export type SubmissionError = "invalid" | "reflection" | "transfer" | "quiz";

export function recompute(lesson: LessonContent, evidence: Evidence): Evidence {
  const results = runChecks(lesson.checks, evidence.config, evidence.summary);
  return { ...evidence, checkResults: results.map(({ id, passed }) => ({ id, passed })) };
}

export function validateDraft(lesson: LessonContent, evidence: unknown, answers: unknown) {
  const a = answersSchema.safeParse(answers);
  if (!a.success) return { ok: false as const };
  if (evidence == null || (typeof evidence === "object" && Object.keys(evidence).length === 0)) {
    return { ok: true as const, evidence: {}, answers: a.data };
  }
  const e = evidenceSchema.safeParse(evidence);
  if (!e.success || e.data.config.kind !== lesson.kind || e.data.contentVersion !== lesson.version) return { ok: false as const };
  return { ok: true as const, evidence: recompute(lesson, e.data), answers: a.data };
}

export function validateSubmission(lesson: LessonContent, evidence: unknown, answers: unknown) {
  const e = evidenceSchema.safeParse(evidence);
  const a = answersSchema.safeParse(answers);
  if (!e.success || !a.success || e.data.config.kind !== lesson.kind || e.data.contentVersion !== lesson.version) {
    return { ok: false as const, errors: ["invalid"] as SubmissionError[] };
  }
  const errors: SubmissionError[] = [];
  if (a.data.quiz === null) errors.push("quiz");
  if (a.data.reflection.trim().length < 10) errors.push("reflection");
  if (a.data.transfer.trim().length < 10) errors.push("transfer");
  if (errors.length) return { ok: false as const, errors };
  return { ok: true as const, evidence: recompute(lesson, e.data), answers: a.data };
}

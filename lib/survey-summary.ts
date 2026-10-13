// Teacher-only aggregates from identified responses. Free text, private
// support (R11), teammate preferences (P9) and private-discussion requests
// (P10) are never aggregated; they appear only in individual views.
import type { SurveyContent, Locale } from "@/lib/validation/content";
import type { Answers } from "@/lib/validation/survey";

export const PRIVATE_QUESTIONS = new Set(["R11", "P9", "P10", "P14"]);

export type QuestionSummary = {
  id: string;
  prompt: string;
  answered: number;
  missing: number;
  rows: { label: string; count: number; pct: number }[];
};

/** `responses`: the latest submitted response per student. */
export function summarize(
  survey: SurveyContent,
  responses: Answers[],
  locale: Locale,
  labels: { sessions: Map<string, string>; unsure: string },
): QuestionSummary[] {
  const out: QuestionSummary[] = [];
  for (const q of survey.questions) {
    if (PRIVATE_QUESTIONS.has(q.id) || !["single", "multi", "scale", "sessions"].includes(q.type)) continue;
    const counts = new Map<string, number>();
    let answered = 0;
    for (const r of responses) {
      const a = r[q.id] as Record<string, unknown> | undefined;
      if (!a) continue;
      const values = "choice" in a ? [a.choice] : "choices" in a ? (a.choices as string[]) : "value" in a ? [a.value] : [];
      if (!values.length) continue;
      answered++;
      for (const v of values) counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
    }
    const keys =
      q.type === "scale" ? ["1", "2", "3", "4", "5", ...(q.scale?.extra ?? []).map((o) => o.value)]
      : q.type === "sessions" ? [...labels.sessions.keys(), "unsure"]
      : (q.options ?? []).map((o) => o.value);
    const label = (k: string) =>
      q.type === "sessions" ? (k === "unsure" ? labels.unsure : labels.sessions.get(k) ?? k)
      : q.options?.find((o) => o.value === k)?.label[locale] ?? q.scale?.extra.find((o) => o.value === k)?.label[locale] ?? k;
    out.push({
      id: q.id,
      prompt: q.prompt[locale],
      answered,
      missing: responses.length - answered,
      // Percent of respondents who answered this question (multi-select can exceed 100% in total).
      rows: keys.map((k) => ({ label: label(k), count: counts.get(k) ?? 0, pct: answered ? Math.round(((counts.get(k) ?? 0) / answered) * 100) : 0 })),
    });
  }
  return out;
}

/** Latest submitted response per student. */
export function latestSubmitted<T extends { student_id: string; version: number; status: string }>(rows: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) {
    if (r.status !== "submitted") continue;
    const cur = m.get(r.student_id);
    if (!cur || r.version > cur.version) m.set(r.student_id, r);
  }
  return m;
}

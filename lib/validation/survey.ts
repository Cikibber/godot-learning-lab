// Fixed, schema-backed validation for the two surveys. Runs in the browser for
// feedback and again on the server before any write.
import type { Question, SurveyContent } from "./content";

export type Answer =
  | { choice: string; text?: string }
  | { choices: string[]; text?: string }
  | { value: number | string }
  | { text: string }
  | { items: string[] }
  | { a: string; b: string };
export type Answers = Record<string, Answer>;

export type SurveyContext = {
  /** Allowed classmate IDs for "classmates" questions (excluding self). */
  classmateIds: string[];
  /** Allowed school session IDs for "sessions" questions. */
  sessionIds: string[];
};

/** Error codes map to localized messages in the UI. */
export type FieldError = "required" | "too_long" | "too_many" | "too_few" | "invalid";

const str = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;

function isEmpty(a: unknown): boolean {
  if (a == null || typeof a !== "object") return true;
  const o = a as Record<string, unknown>;
  if ("choice" in o) return !o.choice;
  if ("choices" in o) return !Array.isArray(o.choices) || o.choices.length === 0;
  if ("value" in o) return o.value === "" || o.value == null;
  if ("items" in o) return !Array.isArray(o.items) || o.items.every((i) => !String(i).trim());
  if ("a" in o) return !String(o.a ?? "").trim() && !String(o.b ?? "").trim();
  if ("text" in o) return !String(o.text ?? "").trim();
  return true;
}

function checkOne(q: Question, raw: unknown, ctx: SurveyContext, submit: boolean): FieldError | null {
  if (isEmpty(raw)) return submit && q.required ? "required" : null;
  const a = raw as Record<string, unknown>;
  const values = new Set((q.options ?? []).map((o) => o.value));
  const follow = q.followUp;
  if (follow && a.text !== undefined && !str(a.text, follow.maxLength)) return "too_long";

  switch (q.type) {
    case "single":
      return typeof a.choice === "string" && values.has(a.choice) ? null : "invalid";
    case "multi":
    case "sessions":
    case "classmates": {
      if (!Array.isArray(a.choices) || !a.choices.every((c) => typeof c === "string")) return "invalid";
      const choices = a.choices as string[];
      if (new Set(choices).size !== choices.length) return "invalid";
      const allowed =
        q.type === "multi" ? values : q.type === "sessions" ? new Set([...ctx.sessionIds, "unsure"]) : new Set(ctx.classmateIds);
      if (!choices.every((c) => allowed.has(c))) return "invalid";
      if (q.max && choices.length > q.max) return "too_many";
      if (submit && q.min && choices.length < q.min) return "too_few";
      return null;
    }
    case "scale": {
      const extra = new Set((q.scale?.extra ?? []).map((o) => o.value));
      const v = a.value;
      if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5) return null;
      return typeof v === "string" && extra.has(v) ? null : "invalid";
    }
    case "text":
      return str(a.text, q.max ?? 300) ? null : "too_long";
    case "textlist": {
      if (!Array.isArray(a.items)) return "invalid";
      if (a.items.length > (q.max ?? 3)) return "too_many";
      if (!a.items.every((i) => str(i, q.itemMaxLength ?? 120))) return "too_long";
      if (submit && q.required && a.items.filter((i) => String(i).trim()).length < (q.min ?? 1)) return "too_few";
      return null;
    }
    case "pair": {
      const max = q.pair?.maxLength ?? 200;
      if (!str(a.a ?? "", max) || !str(a.b ?? "", max)) return "too_long";
      if (submit && q.required && (!String(a.a ?? "").trim() || !String(a.b ?? "").trim())) return "required";
      return null;
    }
  }
}

export function validateAnswers(
  survey: SurveyContent,
  answers: unknown,
  ctx: SurveyContext,
  mode: "draft" | "submit",
): { ok: boolean; errors: Record<string, FieldError>; clean: Answers } {
  const errors: Record<string, FieldError> = {};
  const clean: Answers = {};
  const input = answers && typeof answers === "object" ? (answers as Record<string, unknown>) : {};
  for (const q of survey.questions) {
    const err = checkOne(q, input[q.id], ctx, mode === "submit");
    if (err) errors[q.id] = err;
    else if (!isEmpty(input[q.id])) clean[q.id] = input[q.id] as Answer;
  }
  // Unknown keys are dropped rather than stored.
  return { ok: Object.keys(errors).length === 0, errors, clean };
}

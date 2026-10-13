// Schemas for source-controlled lesson and survey content. Content is data:
// localized text blocks, a bounded activity config, and registered check IDs.
import { z } from "zod";
import { activityConfig, ACTIVITY_KINDS } from "@/exercises/schema";
import { CHECKS, isCheckId } from "@/exercises/checks";

export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const localized = z.object({
  id: z.string().min(1).max(2400),
  en: z.string().min(1).max(2400),
});
export type Localized = z.infer<typeof localized>;

export const block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: localized }),
  z.object({ type: z.literal("list"), items: z.array(localized).min(1).max(12) }),
  z.object({ type: z.literal("code"), code: z.string().min(1).max(1500), caption: localized }),
  z.object({ type: z.literal("callout"), tone: z.enum(["tip", "warning"]), text: localized }),
]);
export type Block = z.infer<typeof block>;

export const lessonContent = z
  .object({
    key: z.string().regex(/^[a-z0-9-]{1,40}$/),
    version: z.number().int().positive(),
    module: z.number().int().min(1).max(8),
    kind: z.enum(ACTIVITY_KINDS),
    godotVersion: z.string().regex(/^4\.\d+(\.\d+)?$/),
    title: localized,
    summary: localized,
    minutes: z.object({ explain: z.number().int().min(1).max(15), practice: z.number().int().min(1).max(30) }),
    objective: localized,
    whyGodot: localized,
    explanation: z.array(block).min(1).max(12),
    workedExample: z.array(block).min(1).max(8),
    activity: z.object({
      name: localized,
      instructions: z.array(localized).min(1).max(8),
      hints: z.array(localized).min(1).max(6),
      initialConfig: activityConfig,
      limits: z.object({ maxEntities: z.number().int().min(1).max(100), maxSeconds: z.number().int().min(10).max(1200) }),
    }),
    checks: z.array(z.string()).min(1).max(8),
    checkLabels: z.record(z.string(), localized),
    fidelity: z.object({ teaches: localized, differs: z.array(localized).min(1).max(5) }),
    misconceptions: z.array(localized).min(1).max(5),
    quiz: z.object({
      prompt: localized,
      code: z.string().max(800).nullable(),
      options: z.array(localized).min(2).max(5),
      answer: z.number().int().min(0).max(4),
      explanation: localized,
    }),
    reflection: localized,
    transfer: z.object({
      steps: z.array(localized).min(2).max(8),
      snippet: z.string().max(1500).nullable(),
      question: localized,
    }),
  })
  .superRefine((c, ctx) => {
    if (c.activity.initialConfig.kind !== c.kind) {
      ctx.addIssue({ code: "custom", message: "initialConfig kind mismatch" });
    }
    if (c.quiz.answer >= c.quiz.options.length) {
      ctx.addIssue({ code: "custom", message: "quiz answer out of range" });
    }
    for (const id of c.checks) {
      if (!isCheckId(id) || CHECKS[id].kind !== c.kind) {
        ctx.addIssue({ code: "custom", message: `unregistered check ${id}` });
      }
      if (!c.checkLabels[id]) ctx.addIssue({ code: "custom", message: `missing label for ${id}` });
    }
  });
export type LessonContent = z.infer<typeof lessonContent>;

// --- Surveys ----------------------------------------------------------------
const option = z.object({ value: z.string().regex(/^[a-z0-9_]{1,30}$/), label: localized });

export const question = z.object({
  id: z.string().regex(/^[RP][0-9]{1,2}$/),
  type: z.enum(["single", "multi", "scale", "text", "textlist", "pair", "sessions", "classmates"]),
  required: z.boolean(),
  prompt: localized,
  help: localized.optional(),
  options: z.array(option).max(10).optional(),
  /** multi: max selections; text: max chars; textlist: max items. */
  max: z.number().int().min(1).max(400).optional(),
  /** multi: exact/minimum number of selections when answered. */
  min: z.number().int().min(1).max(10).optional(),
  /** Optional free-text follow-up (e.g. "other" description, source, explanation). */
  followUp: z
    .object({ label: localized, maxLength: z.number().int().min(1).max(300), forOption: z.string().optional() })
    .optional(),
  /** scale: endpoint labels and extra non-numeric choices. */
  scale: z
    .object({ low: localized, high: localized, extra: z.array(option).max(2) })
    .optional(),
  /** pair: labels for the two fields and per-field max length. */
  pair: z.object({ a: localized, b: localized, maxLength: z.number().int().min(1).max(400) }).optional(),
  itemMaxLength: z.number().int().min(1).max(200).optional(),
});
export type Question = z.infer<typeof question>;

export const surveyContent = z.object({
  key: z.enum(["readiness", "project"]),
  version: z.number().int().positive(),
  title: localized,
  intro: localized,
  privacy: localized,
  minutes: z.number().int().min(1).max(20),
  questions: z.array(question).min(1).max(20),
});
export type SurveyContent = z.infer<typeof surveyContent>;

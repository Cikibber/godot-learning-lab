// Proposal and milestone bodies: bounded fields, strict link validation.
// Drafts may be incomplete; submission requires the essential fields.
import { z } from "zod";

/** https only, no credentials, bounded; never fetched by the server. */
export const safeUrl = z
  .string()
  .max(300)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password && u.hostname.includes(".");
    } catch {
      return false;
    }
  }, "url");

export const PROPOSAL_FIELDS = [
  { key: "title", type: "text", max: 80, required: true },
  { key: "pitch", type: "textarea", max: 250, required: true },
  { key: "coreLoop", type: "textarea", max: 250, required: true },
  { key: "controls", type: "text", max: 200, required: true },
  { key: "winLose", type: "textarea", max: 300, required: true },
  { key: "mustHaves", type: "list", max: 120, count: 3, required: true },
  { key: "optional", type: "list", max: 120, count: 2, required: false },
  { key: "concepts", type: "textarea", max: 300, required: true },
  { key: "assets", type: "textarea", max: 300, required: true },
  { key: "roles", type: "textarea", max: 300, required: true },
  { key: "sessions", type: "textarea", max: 300, required: true },
  { key: "milestones", type: "list", max: 200, count: 3, required: true },
  { key: "risk", type: "textarea", max: 400, required: true },
  { key: "checklist", type: "textarea", max: 400, required: true },
] as const;

export const MILESTONE_FIELDS = [
  { key: "progress", type: "textarea", max: 1000, required: true },
  { key: "tests", type: "textarea", max: 600, required: false },
  { key: "issues", type: "textarea", max: 600, required: false },
  { key: "links", type: "links", max: 300, count: 3, required: false },
] as const;

export type FieldSpec = (typeof PROPOSAL_FIELDS)[number] | (typeof MILESTONE_FIELDS)[number];
export type Body = Record<string, string | string[]>;

/** Validates a body against field specs. Returns cleaned body and field errors. */
export function validateBody(fields: readonly FieldSpec[], raw: unknown, submit: boolean): { ok: boolean; body: Body; errors: Record<string, string> } {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const body: Body = {};
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = input[f.key];
    if (f.type === "list" || f.type === "links") {
      const arr = (Array.isArray(v) ? v : []).map((x) => (typeof x === "string" ? x.trim() : "")).slice(0, f.count);
      if (arr.some((x) => x.length > f.max)) errors[f.key] = "too_long";
      if (f.type === "links" && arr.some((x) => x && !safeUrl.safeParse(x).success)) errors[f.key] = "url";
      if (submit && f.required && arr.filter(Boolean).length < f.count) errors[f.key] = "required";
      body[f.key] = arr;
    } else {
      const s = typeof v === "string" ? v : "";
      if (s.length > f.max) errors[f.key] = "too_long";
      if (submit && f.required && !s.trim()) errors[f.key] = "required";
      body[f.key] = s;
    }
  }
  return { ok: Object.keys(errors).length === 0, body, errors };
}

export const contributionSchema = z.object({ body: z.string().trim().min(1).max(1500) });

// Rubric: 60 team points + 40 individual points (enforced again by the DB).
export const TEAM_CRITERIA = [
  { key: "core_loop", max: 20 },
  { key: "godot_concepts", max: 15 },
  { key: "scope_testing", max: 15 },
  { key: "usability_assets", max: 10 },
] as const;
export const INDIVIDUAL_CRITERIA = [
  { key: "individual_understanding", max: 15 },
  { key: "contribution", max: 15 },
  { key: "browser_practice", max: 10 },
] as const;


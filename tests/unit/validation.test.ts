// Gate B/C: server-side validation of surveys, project bodies, and lesson evidence.
import { describe, expect, it } from "vitest";
import { readiness } from "@/content/surveys/readiness";
import { project } from "@/content/surveys/project";
import { validateAnswers } from "@/lib/validation/survey";
import { MILESTONE_FIELDS, PROPOSAL_FIELDS, safeUrl, validateBody } from "@/features/projects/schema";
import { validateSubmission, validateDraft } from "@/features/lessons/validate";
import { LESSONS } from "@/content";
import { summarize } from "@/lib/survey-summary";

const ctx = { classmateIds: ["c1", "c2", "c3", "c4"], sessionIds: ["s1", "s2"] };

describe("survey validation", () => {
  it("drafts may be partial; submit enforces required questions", () => {
    expect(validateAnswers(readiness, { R1: { choice: "none" } }, ctx, "draft").ok).toBe(true);
    const r = validateAnswers(readiness, { R1: { choice: "none" } }, ctx, "submit");
    expect(Object.keys(r.errors).sort()).toEqual(["R2", "R3", "R6", "R7"]);
  });
  it("enforces choice limits, lengths, and allowed values", () => {
    expect(validateAnswers(readiness, { R4: { choices: ["puzzle", "arcade", "story", "simulation"] } }, ctx, "draft").errors.R4).toBe("too_many");
    expect(validateAnswers(readiness, { R11: { text: "x".repeat(301) } }, ctx, "draft").errors.R11).toBe("too_long");
    expect(validateAnswers(readiness, { R1: { choice: "hacker" } }, ctx, "draft").errors.R1).toBe("invalid");
    expect(validateAnswers(readiness, { R3: { value: 9 } }, ctx, "draft").errors.R3).toBe("invalid");
    expect(validateAnswers(readiness, { R3: { value: "not_sure" } }, ctx, "draft").ok).toBe(true);
    expect(validateAnswers(project, { P8: { choices: ["art"] } }, ctx, "submit").errors.P8).toBe("too_few");
  });
  it("classmate and session answers must reference real roster entries", () => {
    expect(validateAnswers(project, { P9: { choices: ["someone-else"] } }, ctx, "draft").errors.P9).toBe("invalid");
    expect(validateAnswers(project, { P9: { choices: ["c1", "c2", "c3", "c4"] } }, ctx, "draft").errors.P9).toBe("too_many");
    expect(validateAnswers(project, { P11: { choices: ["s1", "unsure"] } }, ctx, "draft").ok).toBe(true);
  });
  it("drops unknown keys instead of storing them", () => {
    const r = validateAnswers(readiness, { R1: { choice: "none" }, evil: { text: "x" } }, ctx, "draft");
    expect(Object.keys(r.clean)).toEqual(["R1"]);
  });
  it("aggregates exclude private questions and count missing answers", () => {
    const s = summarize(readiness, [{ R1: { choice: "none" }, R11: { text: "secret" } }, { R2: { choice: "never" } }], "en", { sessions: new Map(), unsure: "Unsure" });
    expect(s.find((q) => q.id === "R11")).toBeUndefined();
    expect(s.find((q) => q.id === "R1")).toMatchObject({ answered: 1, missing: 1 });
  });
});

describe("project bodies and links", () => {
  it("accepts only https links without credentials", () => {
    expect(safeUrl.safeParse("https://drive.school.sch.id/x").success).toBe(true);
    for (const bad of ["javascript:alert(1)", "http://x.example", "https://user:pw@x.example", "data:text/html,hi", "https://localhost"]) {
      expect(safeUrl.safeParse(bad).success, bad).toBe(false);
    }
    expect(validateBody(MILESTONE_FIELDS, { progress: "ok", links: ["javascript:alert(1)"] }, false).errors.links).toBe("url");
  });
  it("proposal submit needs all essentials incl. three must-haves", () => {
    const r = validateBody(PROPOSAL_FIELDS, { title: "x", mustHaves: ["a", "b"] }, true);
    expect(r.errors.mustHaves).toBe("required");
    expect(r.errors.optional).toBeUndefined();
    expect(validateBody(PROPOSAL_FIELDS, { title: "x" }, false).ok).toBe(true);
  });
});

describe("lesson evidence recomputation", () => {
  const movement = LESSONS.find((l) => l.kind === "movement")!;
  const base = {
    contentVersion: 1,
    config: { kind: "movement", v: 1, speed: 120, useDelta: true },
    summary: { reachedTarget: true, comparedWithoutDelta: true },
  };
  const answers = { quiz: 1, reflection: "Penjelasan cukup panjang.", transfer: "Delta adalah detik per frame." };
  it("overrides a forged config check claim", () => {
    const r = validateSubmission(movement, { ...base, checkResults: [{ id: "movement.speed_changed", passed: true }] }, answers);
    expect(r.ok && r.evidence.checkResults.find((c) => c.id === "movement.speed_changed")?.passed).toBe(false);
  });
  it("rejects wrong kinds, wrong versions, out-of-bounds configs, and missing answers", () => {
    expect(validateSubmission(movement, { ...base, contentVersion: 2, checkResults: [] }, answers).ok).toBe(false);
    expect(validateSubmission(movement, { ...base, config: { kind: "loop", v: 1, exitRule: "always", restartRule: "keep_coins", lives: 3 }, checkResults: [] }, answers).ok).toBe(false);
    expect(validateSubmission(movement, { ...base, config: { ...base.config, speed: 9999 }, checkResults: [] }, answers).ok).toBe(false);
    const missing = validateSubmission(movement, { ...base, checkResults: [] }, { quiz: null, reflection: "", transfer: "" });
    expect(!missing.ok && missing.errors).toEqual(["quiz", "reflection", "transfer"]);
    expect(validateDraft(movement, {}, { quiz: null, reflection: "", transfer: "" }).ok).toBe(true);
  });
  it("bounds summary size", () => {
    const huge = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${String.fromCharCode(97 + (i % 26))}${i}`.replace(/\d/g, "x"), 1]));
    expect(validateSubmission(movement, { ...base, summary: huge, checkResults: [] }, answers).ok).toBe(false);
  });
});

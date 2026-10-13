// Gate B: content, localization, and generated-migration integrity.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LESSONS, SURVEYS } from "@/content";
import { RUBRIC, WEEKS } from "@/content/plan";
import { lessonContent, surveyContent } from "@/lib/validation/content";
import { CHECKS } from "@/exercises/checks";
import { contentSql, CONTENT_MIGRATION } from "@/lib/db/content-sql";
import id from "@/messages/id.json";
import en from "@/messages/en.json";

function walk(o: unknown, path = ""): string[] {
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  return [path];
}
function strings(o: unknown): string[] {
  if (typeof o === "string") return [o];
  if (o && typeof o === "object") return Object.values(o).flatMap(strings);
  return [];
}

describe("lessons", () => {
  it("eight modules, one per activity kind, all schema-valid", () => {
    expect(LESSONS.map((l) => l.module)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(LESSONS.map((l) => l.kind)).size).toBe(8);
    for (const l of LESSONS) expect(() => lessonContent.parse(l), l.key).not.toThrow();
  });
  it("every localized string exists in both languages and keeps Godot identifiers", () => {
    for (const l of LESSONS) {
      const pairs: { id: string; en: string }[] = [];
      const visit = (o: unknown) => {
        if (o && typeof o === "object") {
          if ("id" in o && "en" in o && typeof (o as { id: unknown }).id === "string" && Object.keys(o).length === 2) pairs.push(o as { id: string; en: string });
          else Object.values(o).forEach(visit);
        }
      };
      visit(l);
      expect(pairs.length).toBeGreaterThan(20);
      for (const p of pairs) {
        expect(p.id.trim().length && p.en.trim().length, l.key).toBeTruthy();
        // Identifiers in backticks must match across languages.
        const ids = (s: string) => (s.match(/`[^`]+`/g) ?? []).sort().join("|");
        expect(ids(p.id), `${l.key}: ${p.en}`).toBe(ids(p.en));
      }
    }
  });
  it("each lesson has checks, transfer steps, fidelity limits, and a quiz", () => {
    for (const l of LESSONS) {
      expect(l.checks.every((c) => CHECKS[c as keyof typeof CHECKS].kind === l.kind)).toBe(true);
      expect(l.transfer.steps.length).toBeGreaterThanOrEqual(2);
      expect(l.fidelity.differs.length).toBeGreaterThan(0);
      expect(l.quiz.answer).toBeLessThan(l.quiz.options.length);
    }
  });
  it("teaches the CharacterBody2D velocity rule correctly", () => {
    const collision = LESSONS.find((l) => l.kind === "collision")!;
    expect(collision.transfer.snippet).toContain("_physics_process");
    expect(collision.transfer.snippet).toMatch(/velocity = direction \* speed\n/);
    expect(collision.transfer.snippet).not.toMatch(/velocity = .*delta/);
    const movement = LESSONS.find((l) => l.kind === "movement")!;
    expect(movement.transfer.snippet).toContain("position += direction * speed * delta");
  });
});

describe("surveys", () => {
  it("match the specified question IDs and requirements", () => {
    const [r, p] = SURVEYS.map((s) => surveyContent.parse(s));
    expect(r.questions.map((q) => q.id)).toEqual(Array.from({ length: 12 }, (_, i) => `R${i + 1}`));
    expect(p.questions.map((q) => q.id)).toEqual(Array.from({ length: 14 }, (_, i) => `P${i + 1}`));
    expect(r.questions.filter((q) => q.required).map((q) => q.id)).toEqual(["R1", "R2", "R3", "R6", "R7"]);
    expect(p.questions.filter((q) => !q.required).map((q) => q.id)).toEqual(["P6", "P9", "P14"]);
    const prefer = (qid: string) => JSON.stringify(r.questions.find((q) => q.id === qid)).includes("prefer_not");
    expect(prefer("R8") && prefer("R10")).toBe(true);
    expect(r.questions.find((q) => q.id === "R11")!.max).toBe(300);
    expect(p.questions.find((q) => q.id === "P9")!.max).toBe(3);
  });
  it("never claims anonymity", () => {
    for (const s of SURVEYS) {
      expect(s.privacy.en).toMatch(/NOT anonymous|Only your teacher/);
      expect(s.privacy.en.toLowerCase()).not.toMatch(/\banonymous survey\b/);
    }
  });
});

describe("generated content migration", () => {
  it("matches the source content (regenerate with npm run content:sql)", () => {
    expect(readFileSync(CONTENT_MIGRATION, "utf8").replaceAll("\r\n", "\n")).toBe(contentSql());
  });
});

describe("UI messages", () => {
  it("Bahasa Indonesia and English have identical keys and no empty strings", () => {
    expect(walk(en).sort()).toEqual(walk(id).sort());
    expect(strings(id).every((s) => s.trim().length > 0)).toBe(true);
    expect(strings(en).every((s) => s.trim().length > 0)).toBe(true);
  });
  it("carries the exact simulation notice in both languages", () => {
    expect(id.lesson.notice).toBe("Simulasi browser untuk konsep Godot. GDScript tidak dijalankan di sini.");
    expect(en.lesson.notice).toBe("Browser simulation of a Godot concept. GDScript does not run here.");
  });
});

describe("plan and rubric", () => {
  it("has 12 weeks and a 60/40 rubric", () => {
    expect(WEEKS).toHaveLength(12);
    expect(RUBRIC.filter((r) => r.team).reduce((n, r) => n + r.max, 0)).toBe(60);
    expect(RUBRIC.filter((r) => !r.team).reduce((n, r) => n + r.max, 0)).toBe(40);
  });
});

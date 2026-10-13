import { describe, expect, it } from "vitest";
import { localToUtc, utcToLocalInput } from "@/lib/time";
import { deriveProgress } from "@/lib/progress";
import { csvCell, toCsv } from "@/lib/csv";

describe("class timezone conversion", () => {
  it("interprets local input in the class timezone, not the host's", () => {
    expect(localToUtc("2026-10-20T08:00", "Asia/Jakarta")!.toISOString()).toBe("2026-10-20T01:00:00.000Z");
    expect(localToUtc("2026-10-20T08:00", "Asia/Jayapura")!.toISOString()).toBe("2026-10-19T23:00:00.000Z");
    expect(utcToLocalInput("2026-10-20T01:00:00.000Z", "Asia/Jakarta")).toBe("2026-10-20T08:00");
  });
  it("handles DST zones and rejects bad input", () => {
    expect(localToUtc("2026-07-01T12:00", "Europe/London")!.toISOString()).toBe("2026-07-01T11:00:00.000Z");
    expect(localToUtc("2026-13-01T12:00", "Nope/Zone")).toBeNull();
    expect(localToUtc("tomorrow", "Asia/Jakarta")).toBeNull();
  });
});

describe("progress derivation", () => {
  const pass = { checkResults: [{ id: "a", passed: true }] };
  const fail = { checkResults: [{ id: "a", passed: false }] };
  it("covers every state without treating passed checks as acceptance", () => {
    expect(deriveProgress([], [])).toBe("not_started");
    expect(deriveProgress([{ id: "1", attempt_no: 1, status: "draft", evidence: {} }], [])).toBe("draft");
    expect(deriveProgress([{ id: "1", attempt_no: 1, status: "submitted", evidence: fail }], [])).toBe("submitted");
    expect(deriveProgress([{ id: "1", attempt_no: 1, status: "submitted", evidence: pass }], [])).toBe("practice_passed");
    const r = (result: "accepted" | "needs_revision") => [{ attempt_id: "1", result, created_at: "2026-10-01" }];
    expect(deriveProgress([{ id: "1", attempt_no: 1, status: "submitted", evidence: pass }], r("needs_revision"))).toBe("needs_revision");
    expect(deriveProgress([{ id: "1", attempt_no: 1, status: "submitted", evidence: fail }], r("accepted"))).toBe("accepted");
    expect(
      deriveProgress([{ id: "1", attempt_no: 1, status: "submitted", evidence: pass }, { id: "2", attempt_no: 2, status: "draft", evidence: {} }], r("needs_revision")),
    ).toBe("draft");
  });
});

describe("CSV export safety", () => {
  it("neutralizes spreadsheet formulas and quotes correctly", () => {
    for (const s of ["=1+1", "+cmd", "-2", "@SUM(A1)", "\tx", "\rx"]) expect(csvCell(s).startsWith(`"'`)).toBe(true);
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell(42)).toBe('"42"');
    expect(toCsv([["a", "b"], ["=x", null]])).toBe('"a","b"\r\n"\'=x",""\r\n');
  });
});

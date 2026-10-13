import { NextResponse, type NextRequest } from "next/server";
import { getActor } from "@/lib/auth/session";
import { classAssignments, lessonProgress, roster } from "@/lib/db/queries";
import { latestSubmitted, PRIVATE_QUESTIONS } from "@/lib/survey-summary";
import { formatAnswer } from "@/lib/survey-format";
import { toCsv } from "@/lib/csv";
import { INDIVIDUAL_CRITERIA, TEAM_CRITERIA } from "@/features/projects/schema";
import type { Answers } from "@/lib/validation/survey";

const KINDS = ["progress", "surveys", "teams", "scores"] as const;
type Kind = (typeof KINDS)[number];

// Deliberate teacher-only download. POST + same-origin check; no emails; private
// support text (R11) and teammate preferences are excluded; never cached.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return new NextResponse("Forbidden", { status: 403 });
  const actor = await getActor();
  if (!actor || actor.role !== "teacher") return new NextResponse("Not found", { status: 404 });
  const { data: cls } = await actor.supabase.from("classes").select("id, name, teacher_id").eq("id", id).maybeSingle();
  if (!cls || cls.teacher_id !== actor.id) return new NextResponse("Not found", { status: 404 });
  const kind = String((await request.formData()).get("kind")) as Kind;
  if (!KINDS.includes(kind)) return new NextResponse("Bad request", { status: 400 });
  const { data: allowed } = await actor.supabase.rpc("log_export", { p_class_id: id, p_kind: kind });
  if (!allowed) return new NextResponse("Too many exports; try again later.", { status: 429 });

  const people = await roster(actor, id);
  const approved = people.filter((p) => p.status === "approved");
  const names = new Map(people.map((p) => [p.studentId, p.name]));
  const assignments = await classAssignments(actor, id);
  let rows: unknown[][] = [];

  if (kind === "progress") {
    const lessons = assignments.filter((a) => a.kind === "lesson" && a.publishedAt);
    const progress = await lessonProgress(actor, lessons.map((l) => l.id));
    rows = [["student", ...lessons.map((l) => `M${l.lesson!.module} ${l.lesson!.key}`)]];
    for (const p of approved) rows.push([p.name, ...lessons.map((l) => progress.get(l.id)?.get(p.studentId) ?? "not_started")]);
  } else if (kind === "surveys") {
    const { data: sessionRows } = await actor.supabase.from("class_sessions").select("id, label").eq("class_id", id);
    const sessions = new Map((sessionRows ?? []).map((s) => [s.id, s.label]));
    for (const a of assignments.filter((x) => x.kind === "survey")) {
      const qs = a.survey!.questions.filter((q) => !PRIVATE_QUESTIONS.has(q.id));
      const { data } = await actor.supabase.from("survey_responses").select("student_id, version, status, answers").eq("assignment_id", a.id);
      const latest = latestSubmitted(data ?? []);
      rows.push([`survey:${a.survey!.key}`, "version", ...qs.map((q) => q.id)]);
      for (const p of approved) {
        const r = latest.get(p.studentId);
        rows.push([p.name, r ? r.version : "not_submitted", ...qs.map((q) => (r ? formatAnswer(q, (r.answers as Answers)[q.id], "en", names, sessions, "unsure") : ""))]);
      }
      rows.push([`excluded_private_questions: ${[...PRIVATE_QUESTIONS].join(" ")}`]);
      rows.push([]);
    }
  } else if (kind === "teams") {
    const { data: teams } = await actor.supabase.from("teams").select("id, name, size_exception_reason").eq("class_id", id);
    const { data: members } = await actor.supabase.from("team_members").select("team_id, student_id, joined_at, left_at").eq("class_id", id);
    rows = [["team", "student", "active", "joined_at", "left_at", "size_exception"]];
    for (const t of teams ?? []) for (const m of (members ?? []).filter((x) => x.team_id === t.id)) rows.push([t.name, names.get(m.student_id), m.left_at ? "no" : "yes", m.joined_at, m.left_at ?? "", t.size_exception_reason ?? ""]);
  } else {
    const { data: teams } = await actor.supabase.from("teams").select("id, name").eq("class_id", id);
    const { data: scores } = await actor.supabase.from("rubric_scores").select("team_id, student_id, criterion, points").eq("class_id", id);
    rows = [["team", "subject", ...TEAM_CRITERIA.map((c) => c.key), ...INDIVIDUAL_CRITERIA.map((c) => c.key)]];
    for (const t of teams ?? []) {
      const s = (scores ?? []).filter((x) => x.team_id === t.id);
      rows.push([t.name, "team", ...TEAM_CRITERIA.map((c) => s.find((x) => x.criterion === c.key && !x.student_id)?.points ?? ""), ...INDIVIDUAL_CRITERIA.map(() => "")]);
      for (const sid of [...new Set(s.filter((x) => x.student_id).map((x) => x.student_id!))]) {
        rows.push([t.name, names.get(sid), ...TEAM_CRITERIA.map(() => ""), ...INDIVIDUAL_CRITERIA.map((c) => s.find((x) => x.criterion === c.key && x.student_id === sid)?.points ?? "")]);
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="class-${kind}-${date}.csv"`,
      "Cache-Control": "no-store, private",
    },
  });
}

import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { parseLesson, teacherClass } from "@/lib/db/queries";
import { evidenceSchema } from "@/exercises/schema";
import { CHECKS, isCheckId, runChecks } from "@/exercises/checks";
import { reviewAttempt } from "@/features/reviews/actions";
import { Alert, PageHeader, StatusBadge, When } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import type { Locale } from "@/lib/validation/content";

export default async function ReviewDetail({ params, searchParams }: { params: Promise<{ id: string; attemptId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id, attemptId } = await params;
  const { error } = await searchParams;
  const actor = await requireRole("teacher");
  const cls = await teacherClass(actor, id);
  const t = await getTranslations("teacher.review");
  const locale = (await getLocale()) as Locale;

  const { data: attempt } = await actor.supabase
    .from("exercise_attempts")
    .select("id, assignment_id, student_id, attempt_no, status, mode, evidence, answers, submitted_at, assignments(class_id, lesson_versions(content))")
    .eq("id", attemptId)
    .maybeSingle();
  const asg = attempt?.assignments as { class_id: string; lesson_versions: { content: unknown } | null } | null;
  if (!attempt || asg?.class_id !== id || !asg.lesson_versions) notFound();
  const lesson = parseLesson(asg.lesson_versions.content);
  const { data: student } = await actor.supabase.from("profiles").select("display_name").eq("id", attempt.student_id).single();
  const { data: siblings } = await actor.supabase.from("exercise_attempts").select("id, attempt_no").eq("assignment_id", attempt.assignment_id).eq("student_id", attempt.student_id);
  const { data: reviews } = await actor.supabase
    .from("attempt_reviews")
    .select("attempt_id, result, feedback, created_at")
    .in("attempt_id", (siblings ?? []).map((s) => s.id))
    .order("created_at");
  const attemptNo = new Map((siblings ?? []).map((s) => [s.id, s.attempt_no]));

  const ev = evidenceSchema.safeParse(attempt.evidence);
  // Recompute at review time: config checks are verified here regardless of
  // what the browser reported; summary checks are labelled as reported.
  const recomputed = ev.success ? runChecks(lesson.checks, ev.data.config, ev.data.summary) : [];
  const claimed = new Map((ev.success ? ev.data.checkResults : []).map((c) => [c.id, c.passed]));
  const answers = (attempt.answers ?? {}) as { quiz?: number | null; reflection?: string; transfer?: string };

  return (
    <>
      <PageHeader title={t("title", { name: student?.display_name ?? "?" })} subtitle={`${lesson.module}. ${lesson.title[locale]} · ${t("attempt", { n: attempt.attempt_no })}`} back={{ href: `/teacher/classes/${id}/reviews`, label: t("back") }} />
      {error && <div className="mb-4"><Alert tone="bad">{t("error")}</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <section className="card space-y-2">
            <h2 className="h2">{t("checks")}</h2>
            <p className="hint">{t("checksHelp")}</p>
            <ul className="space-y-1">
              {recomputed.map((r) => (
                <li key={r.id}>
                  <span className={r.passed ? "text-ok" : "text-bad"}>{r.passed ? "✓" : "✕"}</span> {lesson.checkLabels[r.id]?.[locale] ?? r.id}
                  <span className="ml-2 text-xs text-muted">({isCheckId(r.id) && CHECKS[r.id].source === "config" ? t("verified") : t("reported")})</span>
                  {claimed.has(r.id) && claimed.get(r.id) !== r.passed && <span className="ml-2 text-xs font-semibold text-bad">{t("mismatch")}</span>}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">{t("mode")}: {attempt.mode === "step" ? t("modeStep") : t("modeCanvas")} · <When iso={attempt.submitted_at} tz={cls.timezone} locale={locale} /></p>
            {ev.success && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold">{t("evidence")}</summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-ink/5 p-2 text-xs">{JSON.stringify({ config: ev.data.config, summary: ev.data.summary }, null, 2)}</pre>
              </details>
            )}
          </section>
          <section className="card space-y-3">
            <h2 className="h2">{t("answers")}</h2>
            <div>
              <h3 className="h3">{lesson.quiz.prompt[locale]}</h3>
              <p>{answers.quiz != null ? lesson.quiz.options[answers.quiz]?.[locale] : "—"} <span className={answers.quiz === lesson.quiz.answer ? "text-ok" : "text-bad"}>({answers.quiz === lesson.quiz.answer ? t("correct") : t("incorrect")})</span></p>
            </div>
            <div>
              <h3 className="h3">{lesson.reflection[locale]}</h3>
              <p className="whitespace-pre-wrap">{answers.reflection || "—"}</p>
            </div>
            <div>
              <h3 className="h3">{lesson.transfer.question[locale]}</h3>
              <p className="whitespace-pre-wrap">{answers.transfer || "—"}</p>
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <form action={reviewAttempt.bind(null, id, attemptId)} className="card space-y-3">
            <h2 className="h2">{t("decision")}</h2>
            <fieldset className="space-y-1">
              <legend className="label">{t("result")}</legend>
              <label className="flex min-h-11 items-center gap-2"><input type="radio" name="result" value="accepted" required className="size-5" /> {t("accept")}</label>
              <label className="flex min-h-11 items-center gap-2"><input type="radio" name="result" value="needs_revision" className="size-5" /> {t("revise")}</label>
            </fieldset>
            <div>
              <label className="label" htmlFor="feedback">{t("feedback")}</label>
              <textarea id="feedback" name="feedback" className="field min-h-32" required maxLength={2000} aria-describedby="fb-help" />
              <p id="fb-help" className="hint">{t("feedbackHelp")}</p>
            </div>
            <SubmitButton>{t("save")}</SubmitButton>
          </form>
          <section className="card space-y-2">
            <h2 className="h2">{t("history")}</h2>
            {!reviews?.length && <p className="text-muted">{t("noHistory")}</p>}
            <ul className="space-y-2">
              {reviews?.map((r, i) => (
                <li key={i} className="rounded bg-ink/5 p-2 text-sm">
                  <StatusBadge status={r.result} /> {t("attempt", { n: attemptNo.get(r.attempt_id) ?? 0 })} · <When iso={r.created_at} tz={cls.timezone} locale={locale} />
                  <p className="mt-1 whitespace-pre-wrap">{r.feedback}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

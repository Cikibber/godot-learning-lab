import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { isPast } from "@/lib/time";
import { requireRole } from "@/lib/auth/session";
import { parseLesson } from "@/lib/db/queries";
import { deriveProgress } from "@/lib/progress";
import { Alert, Blocks, CodeBlock, PageHeader, RichText, StatusBadge, When } from "@/components/ui";
import { LessonWorkspace } from "@/features/lessons/LessonWorkspace";
import { startRevision } from "@/features/lessons/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { Locale } from "@/lib/validation/content";

export default async function LessonPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const actor = await requireRole("student");
  const t = await getTranslations("lesson");
  const locale = (await getLocale()) as Locale;

  const { data: a } = await actor.supabase
    .from("assignments")
    .select("id, class_id, due_at, closed_at, lesson_versions(content), classes(name, timezone, archived_at)")
    .eq("id", assignmentId)
    .eq("kind", "lesson")
    .maybeSingle();
  if (!a?.lesson_versions) notFound();
  const lesson = parseLesson((a.lesson_versions as { content: unknown }).content);
  const cls = a.classes as { name: string; timezone: string; archived_at: string | null };

  const { data: attempts } = await actor.supabase
    .from("exercise_attempts")
    .select("id, attempt_no, status, evidence, answers, mode, revision, submitted_at")
    .eq("assignment_id", assignmentId)
    .eq("student_id", actor.id)
    .order("attempt_no", { ascending: false });
  const list = attempts ?? [];
  const { data: reviews } = list.length
    ? await actor.supabase.from("attempt_reviews").select("attempt_id, result, feedback, created_at").in("attempt_id", list.map((x) => x.id)).order("created_at")
    : { data: [] };
  const status = deriveProgress(list, reviews ?? []);
  const draft = list.find((x) => x.status === "draft") ?? null;
  const latestSubmitted = list.find((x) => x.status === "submitted");
  const open = !isPast(a.closed_at);
  // Editable when the assignment is open and there is a draft or nothing yet.
  const canWork = open && !cls.archived_at && (!!draft || !latestSubmitted);
  const shown = draft ?? latestSubmitted ?? null;

  return (
    <article className="space-y-8">
      <PageHeader
        title={`${t("module", { n: lesson.module })} · ${lesson.title[locale]}`}
        subtitle={<>{cls.name}{a.due_at && <> · {t("due")} <When iso={a.due_at} tz={cls.timezone} locale={locale} /></>}</>}
        back={{ href: `/student/classes/${a.class_id}`, label: t("back") }}
      >
        <StatusBadge status={status} />
      </PageHeader>

      <p className="rounded-md border-2 border-warn bg-warn/10 p-3 font-semibold" role="note">
        <span aria-hidden="true">⚠ </span>{t("notice")}
      </p>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card"><h2 className="h3">{t("objective")}</h2><p><RichText text={lesson.objective[locale]} /></p></div>
        <div className="card"><h2 className="h3">{t("why")}</h2><p><RichText text={lesson.whyGodot[locale]} /></p></div>
      </section>

      <section aria-labelledby="explain-h" className="space-y-3">
        <h2 id="explain-h" className="h2">{t("explanation", { min: lesson.minutes.explain })}</h2>
        <Blocks blocks={lesson.explanation} locale={locale} />
        <h3 className="h3 pt-2">{t("workedExample")}</h3>
        <Blocks blocks={lesson.workedExample} locale={locale} />
      </section>

      <section aria-labelledby="activity-h" className="space-y-3">
        <h2 id="activity-h" className="h2">
          {lesson.activity.name[locale]} <span className="text-base font-normal text-muted">({t("practiceMinutes", { min: lesson.minutes.practice })})</span>
        </h2>
        <ol className="list-decimal space-y-1 pl-6">{lesson.activity.instructions.map((s, i) => <li key={i}><RichText text={s[locale]} /></li>)}</ol>
        {!open && <Alert tone="bad">{t("closedNote")}</Alert>}
        {latestSubmitted && !draft && (
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <p>{t("submittedNote")}</p>
            {open && !cls.archived_at && (
              <form action={startRevision.bind(null, assignmentId, latestSubmitted.id)}>
                <SubmitButton className="btn">{t("startRevision")}</SubmitButton>
              </form>
            )}
          </div>
        )}
        <LessonWorkspace
          key={shown?.id ?? "new"}
          userId={actor.id}
          assignmentId={assignmentId}
          lesson={lesson}
          draft={shown ? { id: shown.id, revision: shown.revision, evidence: shown.evidence, answers: shown.answers, mode: shown.mode === "step" ? "step" : "canvas" } : null}
          canWork={canWork}
        />
      </section>

      <section aria-labelledby="fidelity-h" className="card space-y-2">
        <h2 id="fidelity-h" className="h2">{t("fidelityTitle")}</h2>
        <p><span className="font-semibold">{t("teaches")}</span> {lesson.fidelity.teaches[locale]}</p>
        <p className="font-semibold">{t("differs")}</p>
        <ul className="list-disc space-y-1 pl-6">{lesson.fidelity.differs.map((d, i) => <li key={i}><RichText text={d[locale]} /></li>)}</ul>
        <h3 className="h3 pt-2">{t("misconceptions")}</h3>
        <ul className="list-disc space-y-1 pl-6">{lesson.misconceptions.map((m, i) => <li key={i}><RichText text={m[locale]} /></li>)}</ul>
      </section>

      <section aria-labelledby="transfer-h" className="card space-y-3 border-2 border-brand">
        <h2 id="transfer-h" className="h2"><span aria-hidden="true">🎮 </span>{t("transferTitle", { v: lesson.godotVersion })}</h2>
        <ol className="list-decimal space-y-1 pl-6">{lesson.transfer.steps.map((s, i) => <li key={i}><RichText text={s[locale]} /></li>)}</ol>
        {lesson.transfer.snippet && <CodeBlock code={lesson.transfer.snippet} caption={t("snippetCaption", { v: lesson.godotVersion })} />}
      </section>

      {list.some((x) => x.status === "submitted") && (
        <section aria-labelledby="history-h" className="space-y-3">
          <h2 id="history-h" className="h2">{t("history")}</h2>
          <ul className="space-y-3">
            {list.filter((x) => x.status === "submitted").map((x) => {
              const rs = (reviews ?? []).filter((r) => r.attempt_id === x.id);
              const quizOk = (x.answers as { quiz?: number } | null)?.quiz === lesson.quiz.answer;
              return (
                <li key={x.id} className="card space-y-2">
                  <p className="font-semibold">{t("attempt", { n: x.attempt_no })} · <When iso={x.submitted_at} tz={cls.timezone} locale={locale} /></p>
                  <p className="text-sm">{quizOk ? t("quizCorrect") : t("quizIncorrect")} — {lesson.quiz.explanation[locale]}</p>
                  {rs.length ? (
                    rs.map((r, i) => (
                      <div key={i} className="rounded-md bg-ink/5 p-3">
                        <StatusBadge status={r.result} /> <span className="text-sm text-muted"><When iso={r.created_at} tz={cls.timezone} locale={locale} /></span>
                        <p className="mt-1 whitespace-pre-wrap">{r.feedback}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">{t("awaitingReview")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}

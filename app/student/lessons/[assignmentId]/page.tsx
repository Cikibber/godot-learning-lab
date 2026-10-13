import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { isPast } from "@/lib/time";
import { requireRole } from "@/lib/auth/session";
import { parseLesson } from "@/lib/db/queries";
import { deriveProgress } from "@/lib/progress";
import Link from "next/link";
import { Alert, Blocks, CodeBlock, RichText, StatusBadge, When } from "@/components/ui";
import { Motif } from "@/components/Motif";
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

  const latestReview = latestSubmitted ? (reviews ?? []).filter((r) => r.attempt_id === latestSubmitted.id).at(-1) : undefined;
  const steps = [
    { id: "learn", label: t("nav.learn") },
    { id: "practice", label: t("nav.practice") },
    { id: "explain", label: t("nav.explain") },
    { id: "transfer", label: t("nav.transfer") },
  ];

  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <Link href={`/student/classes/${a.class_id}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <span aria-hidden="true">‹</span> {t("back")}
        </Link>
        <div className="flex flex-wrap items-start gap-5">
          <div className="recess hidden size-20 shrink-0 place-items-center text-brand sm:grid">
            <Motif kind={lesson.kind} size={52} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="flex flex-wrap items-center gap-3">
              <span className="plate">{t("module", { n: String(lesson.module).padStart(2, "0") })}</span>
              <StatusBadge status={status} />
            </p>
            <h1 className="h1">{lesson.title[locale]}</h1>
            <p className="meta">
              {cls.name}
              {a.due_at && <>{" — "}{t("due")} <When iso={a.due_at} tz={cls.timezone} locale={locale} /></>}
            </p>
          </div>
        </div>
        <p className="flex max-w-[80ch] gap-3 rounded-[3px] border border-warn/60 bg-warn/[0.07] p-3 text-sm" role="note">
          <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[2px] bg-warn font-mono text-xs font-bold text-on-brand">!</span>
          <span><strong className="font-semibold">{t("notice")}</strong> {t("noticeMore")}</span>
        </p>
        {latestReview && (
          <Alert tone={latestReview.result === "accepted" ? "ok" : "bad"}>
            <p className="font-semibold">{t("latestFeedback")}</p>
            <p className="mt-1 whitespace-pre-wrap">{latestReview.feedback}</p>
            <a className="link mt-1 inline-block text-sm" href="#history">{t("seeHistory")}</a>
          </Alert>
        )}
      </header>

      <nav aria-label={t("nav.label")} className="no-print sticky top-0 z-20 -mx-4 border-y border-line bg-bg px-4 py-2">
        <ol className="flex gap-1 overflow-x-auto text-sm">
          {steps.map((st, i) => (
            <li key={st.id} className="flex shrink-0 items-center">
              {i > 0 && <span aria-hidden="true" className="px-1 text-line-strong">›</span>}
              <a href={`#${st.id}`} className="flex items-center gap-2 rounded-[3px] px-2 py-1.5 text-muted hover:bg-raised hover:text-ink">
                <span className="font-mono text-xs text-warn">{i + 1}</span>
                {st.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="learn" aria-labelledby="learn-h" className="scroll-mt-16 space-y-6">
        <h2 id="learn-h" className="sr-only">{t("nav.learn")}</h2>
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm font-semibold text-brand">{t("objective")}</dt>
            <dd className="max-w-[60ch]"><RichText text={lesson.objective[locale]} /></dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-semibold text-brand">{t("why")}</dt>
            <dd className="max-w-[60ch] text-ink/90"><RichText text={lesson.whyGodot[locale]} /></dd>
          </div>
        </dl>
        <div className="space-y-3">
          <h3 className="h2">{t("explanation", { min: lesson.minutes.explain })}</h3>
          <Blocks blocks={lesson.explanation} locale={locale} />
        </div>
        <div className="space-y-3">
          <h3 className="h3">{t("workedExample")}</h3>
          <Blocks blocks={lesson.workedExample} locale={locale} />
        </div>
      </section>

      <section id="practice" aria-labelledby="activity-h" className="scroll-mt-16 space-y-4">
        <div className="space-y-2">
          <h2 id="activity-h" className="h2">
            {lesson.activity.name[locale]} <span className="meta font-normal">({t("practiceMinutes", { min: lesson.minutes.practice })})</span>
          </h2>
          <ol className="max-w-[72ch] space-y-1.5">
            {lesson.activity.instructions.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5 font-mono text-sm text-warn">{i + 1}.</span>
                <span><RichText text={s[locale]} /></span>
              </li>
            ))}
          </ol>
        </div>
        {!open && <Alert tone="bad">{t("closedNote")}</Alert>}
        {latestSubmitted && !draft && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-info/50 bg-info/[0.07] p-3">
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

      <section id="transfer" aria-labelledby="transfer-h" className="scroll-mt-16 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-3 rounded-[6px] border border-brand/60 bg-panel p-5">
          <h2 id="transfer-h" className="h2">{t("transferTitle", { v: lesson.godotVersion })}</h2>
          <p className="meta">{t("transferWhere")}</p>
          <ol className="space-y-1.5">
            {lesson.transfer.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5 font-mono text-sm text-brand">{i + 1}.</span>
                <span><RichText text={s[locale]} /></span>
              </li>
            ))}
          </ol>
          {lesson.transfer.snippet && <CodeBlock code={lesson.transfer.snippet} caption={t("snippetCaption", { v: lesson.godotVersion })} />}
        </div>
        <aside aria-labelledby="fidelity-h" className="space-y-3 text-sm">
          <h2 id="fidelity-h" className="h3">{t("fidelityTitle")}</h2>
          <p><span className="font-semibold text-brand">{t("teaches")}</span> {lesson.fidelity.teaches[locale]}</p>
          <p className="font-semibold text-warn">{t("differs")}</p>
          <ul className="list-disc space-y-1 pl-5 text-ink/90">{lesson.fidelity.differs.map((d, i) => <li key={i}><RichText text={d[locale]} /></li>)}</ul>
          <h3 className="h3 pt-2">{t("misconceptions")}</h3>
          <ul className="list-disc space-y-1 pl-5 text-ink/90">{lesson.misconceptions.map((m, i) => <li key={i}><RichText text={m[locale]} /></li>)}</ul>
        </aside>
      </section>

      {list.some((x) => x.status === "submitted") && (
        <section id="history" aria-labelledby="history-h" className="scroll-mt-16 space-y-3">
          <h2 id="history-h" className="h2">{t("history")}</h2>
          <ol className="space-y-3">
            {list.filter((x) => x.status === "submitted").map((x) => {
              const rs = (reviews ?? []).filter((r) => r.attempt_id === x.id);
              const quizOk = (x.answers as { quiz?: number } | null)?.quiz === lesson.quiz.answer;
              return (
                <li key={x.id} className="panel">
                  <p className="panel-head">
                    <span>{t("attempt", { n: x.attempt_no })}</span>
                    <span className="font-sans text-xs font-normal"><When iso={x.submitted_at} tz={cls.timezone} locale={locale} /></span>
                  </p>
                  <div className="panel-body space-y-2">
                    <p className="text-sm">
                      <span className={quizOk ? "text-ok" : "text-bad"}>{quizOk ? "✓ " : "✕ "}{quizOk ? t("quizCorrect") : t("quizIncorrect")}</span>
                      {" — "}{lesson.quiz.explanation[locale]}
                    </p>
                    {rs.length ? (
                      rs.map((r, i) => (
                        <div key={i} className="recess p-3">
                          <p className="flex flex-wrap items-center gap-2"><StatusBadge status={r.result} /> <span className="meta"><When iso={r.created_at} tz={cls.timezone} locale={locale} /></span></p>
                          <p className="mt-2 whitespace-pre-wrap">{r.feedback}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-info">{t("awaitingReview")}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </article>
  );
}

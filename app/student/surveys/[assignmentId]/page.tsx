import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { isPast } from "@/lib/time";
import { requireRole } from "@/lib/auth/session";
import { surveyContext } from "@/lib/db/surveys";
import { SurveyForm } from "@/features/surveys/SurveyForm";
import { startResubmission } from "@/features/surveys/actions";
import { Alert, PageHeader, StatusBadge, When } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import type { Answers } from "@/lib/validation/survey";
import type { Locale } from "@/lib/validation/content";

export default async function SurveyPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const actor = await requireRole("student");
  const t = await getTranslations("survey");
  const locale = (await getLocale()) as Locale;
  const sc = await surveyContext(actor, assignmentId);
  if (!sc) notFound();
  const [{ data: a }, { data: responses }] = await Promise.all([
    actor.supabase.from("assignments").select("due_at, closed_at, classes(timezone, archived_at)").eq("id", assignmentId).single(),
    actor.supabase.from("survey_responses").select("id, version, status, revision, answers, submitted_at").eq("assignment_id", assignmentId).eq("student_id", actor.id).order("version", { ascending: false }),
  ]);
  if (!a) notFound();
  const cls = a.classes as { timezone: string; archived_at: string | null };
  const open = !isPast(a.closed_at) && !cls.archived_at;
  const draft = responses?.find((r) => r.status === "draft") ?? null;
  const lastSubmitted = responses?.find((r) => r.status === "submitted") ?? null;
  const shown = draft ?? lastSubmitted;
  const canWork = open && (!!draft || !lastSubmitted);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={sc.survey.title[locale]} subtitle={<>{t("minutes", { min: sc.survey.minutes })}{a.due_at && <> · {t("due")} <When iso={a.due_at} tz={cls.timezone} locale={locale} /></>}</>} back={{ href: `/student/classes/${sc.classId}`, label: t("back") }}>
        <StatusBadge status={lastSubmitted ? "submitted" : draft ? "draft" : "not_started"} />
      </PageHeader>
      <p>{sc.survey.intro[locale]}</p>
      <p className="rounded-md border border-brand/40 bg-brand/5 p-3 font-semibold"><span aria-hidden="true">🔒 </span>{sc.survey.privacy[locale]}</p>
      {!open && <Alert tone="bad">{t("closed")}</Alert>}
      {lastSubmitted && !draft && (
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <p>{t("submittedAt", { v: lastSubmitted.version })} <When iso={lastSubmitted.submitted_at} tz={cls.timezone} locale={locale} /></p>
          {open && <form action={startResubmission.bind(null, assignmentId)}><SubmitButton className="btn">{t("revise")}</SubmitButton></form>}
        </div>
      )}
      <SurveyForm
        key={shown?.id ?? "new"}
        userId={actor.id}
        assignmentId={assignmentId}
        survey={sc.survey}
        classmates={sc.classmates}
        sessions={sc.sessions}
        draft={shown ? { id: shown.id, revision: shown.revision, answers: shown.answers as Answers } : null}
        canWork={canWork}
      />
    </div>
  );
}

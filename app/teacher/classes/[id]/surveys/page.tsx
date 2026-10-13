import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { classAssignments, roster, teacherClass } from "@/lib/db/queries";
import { ClassTabs } from "@/features/teacher/ClassTabs";
import { Empty, PageHeader, When } from "@/components/ui";
import { latestSubmitted, PRIVATE_QUESTIONS, summarize } from "@/lib/survey-summary";
import { formatAnswer } from "@/lib/survey-format";
import type { Answers } from "@/lib/validation/survey";
import type { Locale } from "@/lib/validation/content";

export default async function SurveysPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string; student?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const actor = await requireRole("teacher");
  const cls = await teacherClass(actor, id);
  const t = await getTranslations("teacher.surveys");
  const locale = (await getLocale()) as Locale;
  const surveys = (await classAssignments(actor, id)).filter((a) => a.kind === "survey");
  const current = surveys.find((s) => s.id === sp.s) ?? surveys[0];
  const base = `/teacher/classes/${id}/surveys`;

  if (!current) {
    return (
      <>
        <PageHeader title={t("title")} subtitle={cls.name} back={{ href: `/teacher/classes/${id}`, label: t("back") }} />
        <ClassTabs classId={id} active="surveys" />
        <Empty>{t("none")}</Empty>
      </>
    );
  }
  const survey = current.survey!;
  const [people, { data: rows }, { data: sessionRows }] = await Promise.all([
    roster(actor, id),
    actor.supabase.from("survey_responses").select("student_id, version, status, answers, submitted_at").eq("assignment_id", current.id).limit(2000),
    actor.supabase.from("class_sessions").select("id, label").eq("class_id", id),
  ]);
  const approved = people.filter((p) => p.status === "approved");
  const names = new Map(people.map((p) => [p.studentId, p.name]));
  const sessions = new Map((sessionRows ?? []).map((s) => [s.id, s.label]));
  const latest = latestSubmitted(rows ?? []);
  const drafts = new Set((rows ?? []).filter((r) => r.status === "draft").map((r) => r.student_id));
  const submittedIds = approved.filter((p) => latest.has(p.studentId));
  const notSubmitted = approved.filter((p) => !latest.has(p.studentId));
  const summary = summarize(survey, submittedIds.map((p) => latest.get(p.studentId)!.answers as Answers), locale, { sessions, unsure: t("unsure") });
  const selected = sp.student && latest.get(sp.student);
  const versions = sp.student ? (rows ?? []).filter((r) => r.student_id === sp.student && r.status === "submitted").length : 0;

  return (
    <>
      <PageHeader title={t("title")} subtitle={cls.name} back={{ href: `/teacher/classes/${id}`, label: t("back") }} />
      <ClassTabs classId={id} active="surveys" />
      <nav aria-label={t("pick")} className="mb-4 flex flex-wrap gap-2">
        {surveys.map((s) => (
          <Link key={s.id} href={`${base}?s=${s.id}`} aria-current={s.id === current.id ? "page" : undefined} className={`btn btn-sm ${s.id === current.id ? "btn-primary" : ""}`}>{s.survey!.title[locale]}</Link>
        ))}
      </nav>
      <p className="mb-4 rounded-md border border-warn/40 bg-warn/10 p-3 text-sm">{t("identified")}</p>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="sum-h" className="space-y-4">
          <h2 id="sum-h" className="h2">{t("summary")}</h2>
          <p className="text-sm">{t("completion", { submitted: submittedIds.length, total: approved.length, drafts: notSubmitted.filter((p) => drafts.has(p.studentId)).length })}</p>
          {summary.map((q) => (
            <div key={q.id} className="card space-y-2">
              <h3 className="h3">{q.id}. {q.prompt}</h3>
              <p className="text-xs text-muted">{t("answered", { answered: q.answered, missing: q.missing })}</p>
              <table className="w-full text-sm">
                <caption className="sr-only">{q.prompt}</caption>
                <tbody>
                  {q.rows.map((r) => (
                    <tr key={r.label}>
                      <th scope="row" className="w-2/5 py-0.5 pr-2 text-left font-normal">{r.label}</th>
                      <td className="py-0.5">
                        <div className="flex items-center gap-2">
                          <span aria-hidden="true" className="h-3 rounded-sm bg-brand" style={{ width: `${Math.max(r.pct, r.count ? 2 : 0)}%` }} />
                          <span className="whitespace-nowrap font-mono text-xs">{r.count} ({r.pct}%)</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <p className="hint">{t("privateNote", { ids: [...PRIVATE_QUESTIONS].filter((x) => survey.questions.some((q) => q.id === x)).join(", ") })}</p>
        </section>

        <aside className="space-y-4">
          <section className="card space-y-2" aria-labelledby="resp-h">
            <h2 id="resp-h" className="h2">{t("individual")}</h2>
            <ul className="space-y-1">
              {submittedIds.map((p) => (
                <li key={p.studentId}><Link className="link" href={`${base}?s=${current.id}&student=${p.studentId}`} aria-current={sp.student === p.studentId ? "true" : undefined}>{p.name}</Link></li>
              ))}
            </ul>
            {notSubmitted.length > 0 && (
              <>
                <h3 className="h3 pt-2">{t("notSubmitted", { count: notSubmitted.length })}</h3>
                <ul className="text-sm">{notSubmitted.map((p) => <li key={p.studentId}>{p.name}{drafts.has(p.studentId) ? ` (${t("draft")})` : ""}</li>)}</ul>
              </>
            )}
          </section>
        </aside>
      </div>

      {selected && (
        <section aria-labelledby="one-h" className="card mt-6 space-y-3">
          <h2 id="one-h" className="h2">{names.get(sp.student!)} · v{selected.version} · <When iso={selected.submitted_at} tz={cls.timezone} locale={locale} /></h2>
          {versions > 1 && <p className="text-sm text-muted">{t("versions", { count: versions })}</p>}
          <dl className="space-y-3">
            {survey.questions.map((q) => (
              <div key={q.id}>
                <dt className="font-semibold">{q.id}. {q.prompt[locale]} {PRIVATE_QUESTIONS.has(q.id) && <span className="text-xs text-warn">({t("private")})</span>}</dt>
                <dd className="whitespace-pre-wrap">{formatAnswer(q, (selected.answers as Answers)[q.id], locale, names, sessions, t("unsure")) || <span className="text-muted">{t("skipped")}</span>}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );
}

import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { classAssignments, lessonProgress, roster, surveyCompletion, teacherClass } from "@/lib/db/queries";
import { ClassTabs } from "@/features/teacher/ClassTabs";
import { addAssignment, updateAssignment } from "@/features/classes/actions";
import { Empty, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { utcToLocalInput } from "@/lib/time";
import type { Locale } from "@/lib/validation/content";

export default async function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireRole("teacher");
  const cls = await teacherClass(actor, id);
  const t = await getTranslations("teacher.assignments");
  const locale = (await getLocale()) as Locale;
  const [assignments, lessonsRes, surveysRes] = await Promise.all([
    classAssignments(actor, id),
    actor.supabase.from("lesson_versions").select("id, lesson_key, version, module_no, content").order("module_no").order("version"),
    actor.supabase.from("survey_versions").select("id, survey_key, version, content").order("survey_key"),
  ]);
  const approvedIds = (await roster(actor, id)).filter((p) => p.status === "approved").map((p) => p.studentId);
  const [progress, completion] = await Promise.all([
    lessonProgress(actor, assignments.filter((a) => a.kind === "lesson").map((a) => a.id)),
    surveyCompletion(actor, assignments.filter((a) => a.kind === "survey").map((a) => a.id)),
  ]);
  // Distribution over approved students only; students without rows count as not started.
  const distribution = (aid: string, kind: string) => {
    const counts: Record<string, number> = {};
    for (const sid of approvedIds) {
      const st = kind === "lesson" ? progress.get(aid)?.get(sid) ?? "not_started" : completion.get(aid)?.get(sid) ?? "not_started";
      counts[st] = (counts[st] ?? 0) + 1;
    }
    return counts;
  };
  const ts = await getTranslations("status");
  const title = (c: unknown) => ((c as { title: Record<Locale, string> }).title[locale]);

  return (
    <>
      <PageHeader title={t("title")} subtitle={cls.name} back={{ href: `/teacher/classes/${id}`, label: t("back") }} />
      <ClassTabs classId={id} active="assignments" />
      <p className="mb-4 max-w-prose">{t("intro", { tz: cls.timezone })}</p>

      <form action={addAssignment.bind(null, id)} className="card mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label className="label" htmlFor="content">{t("addLabel")}</label>
          <select id="content" name="content" className="field" required>
            <optgroup label={t("lessons")}>
              {lessonsRes.data?.map((l) => <option key={l.id} value={`lesson:${l.id}`}>{t("moduleOption", { n: l.module_no, title: title(l.content), v: l.version })}</option>)}
            </optgroup>
            <optgroup label={t("surveys")}>
              {surveysRes.data?.map((s) => <option key={s.id} value={`survey:${s.id}`}>{`${title(s.content)} (v${s.version})`}</option>)}
            </optgroup>
          </select>
        </div>
        <SubmitButton>{t("add")}</SubmitButton>
      </form>

      {!assignments.length && <Empty>{t("none")}</Empty>}
      <ul className="space-y-3">
        {assignments.map((a) => {
          const name = a.lesson ? `${t("module", { n: a.lesson.module })} · ${a.lesson.title[locale]}` : a.survey!.title[locale];
          return (
            <li key={a.id} className="card">
              <form action={updateAssignment.bind(null, id, a.id)} className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto_auto] md:items-end">
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-muted">
                    {a.kind === "lesson" ? t("kindLesson") : t("kindSurvey")} · v{a.lesson?.version ?? a.survey?.version}
                    {" · "}{a.publishedAt ? t("isPublished") : t("isDraft")}{a.closedAt ? ` · ${t("isClosed")}` : ""}
                  </p>
                </div>
                <div>
                  <label className="label" htmlFor={`pos-${a.id}`}>{t("order")}</label>
                  <input className="field w-20" id={`pos-${a.id}`} name="position" type="number" min={0} max={1000} defaultValue={a.position} />
                </div>
                <div>
                  <label className="label" htmlFor={`due-${a.id}`}>{t("due")}</label>
                  <input className="field" id={`due-${a.id}`} name="due" type="datetime-local" defaultValue={utcToLocalInput(a.dueAt, cls.timezone)} />
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="published" defaultChecked={!!a.publishedAt} className="size-5" /> {t("published")}
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="closed" defaultChecked={!!a.closedAt} className="size-5" /> {t("closed")}
                </label>
                <SubmitButton className="btn">{t("save")}</SubmitButton>
              </form>
              {a.publishedAt && (
                <p className="mt-2 text-sm text-muted">
                  {t("distribution", { total: approvedIds.length })}{" "}
                  {Object.entries(distribution(a.id, a.kind)).map(([st, n]) => `${ts(st as "draft")}: ${n}`).join(" · ") || "—"}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

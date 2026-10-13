import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { classAssignments, roster, teacherClass } from "@/lib/db/queries";
import { ClassTabs } from "@/features/teacher/ClassTabs";
import { addMember, createTeam, removeMember, setException } from "@/features/teams/actions";
import { Alert, Empty, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { latestSubmitted } from "@/lib/survey-summary";
import { formatAnswer } from "@/lib/survey-format";
import type { Answers } from "@/lib/validation/survey";
import type { Locale } from "@/lib/validation/content";

export default async function TeamsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const actor = await requireRole("teacher");
  const cls = await teacherClass(actor, id);
  const t = await getTranslations("teacher.teams");
  const tu = await getTranslations("teacher.surveys");
  const locale = (await getLocale()) as Locale;
  const [people, { data: teams }, { data: members }, assignments, { data: sessionRows }] = await Promise.all([
    roster(actor, id),
    actor.supabase.from("teams").select("id, name, size_exception_reason").eq("class_id", id).order("created_at"),
    actor.supabase.from("team_members").select("id, team_id, student_id").eq("class_id", id).is("left_at", null),
    classAssignments(actor, id),
    actor.supabase.from("class_sessions").select("id, label").eq("class_id", id),
  ]);
  const approved = people.filter((p) => p.status === "approved");
  const names = new Map(people.map((p) => [p.studentId, p.name]));
  const assigned = new Set((members ?? []).map((m) => m.student_id));
  const unassigned = approved.filter((p) => !assigned.has(p.studentId));
  const sessions = new Map((sessionRows ?? []).map((s) => [s.id, s.label]));

  // Private teacher panel from the project survey (never shown to students).
  const projectSurvey = assignments.find((a) => a.survey?.key === "project");
  let prefs: { name: string; rows: { label: string; value: string }[] }[] = [];
  if (projectSurvey?.survey) {
    const { data: rows } = await actor.supabase.from("survey_responses").select("student_id, version, status, answers").eq("assignment_id", projectSurvey.id);
    const latest = latestSubmitted(rows ?? []);
    const qs = projectSurvey.survey.questions.filter((q) => ["P3", "P8", "P9", "P10", "P11"].includes(q.id));
    prefs = approved.filter((p) => latest.has(p.studentId)).map((p) => ({
      name: p.name,
      rows: qs.map((q) => ({ label: `${q.id}. ${q.prompt[locale]}`, value: formatAnswer(q, (latest.get(p.studentId)!.answers as Answers)[q.id], locale, names, sessions, tu("unsure")) })),
    }));
  }

  return (
    <>
      <PageHeader title={t("title")} subtitle={cls.name} back={{ href: `/teacher/classes/${id}`, label: t("back") }} />
      <ClassTabs classId={id} active="teams" />
      {error && <div className="mb-4"><Alert tone="bad">{t(`error_${error}` as "error_generic")}</Alert></div>}
      <p className="mb-4 max-w-prose">{t("intro")}</p>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {!teams?.length && <Empty>{t("none")}</Empty>}
          {teams?.map((team) => {
            const ms = (members ?? []).filter((m) => m.team_id === team.id);
            const ok = ms.length >= 3 && ms.length <= 4;
            return (
              <section key={team.id} className="card space-y-3" aria-labelledby={`t-${team.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id={`t-${team.id}`} className="h2">{team.name}</h2>
                  <span className={`text-sm font-semibold ${ok ? "text-ok" : team.size_exception_reason ? "text-warn" : "text-muted"}`}>
                    {ok ? `✓ ${t("sizeOk", { n: ms.length })}` : team.size_exception_reason ? `⚑ ${t("sizeException", { n: ms.length })}` : `… ${t("forming", { n: ms.length })}`}
                  </span>
                </div>
                <ul className="divide-y divide-line">
                  {ms.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 py-1">
                      {names.get(m.student_id)}
                      <form action={removeMember.bind(null, id, m.id)}><SubmitButton className="btn btn-sm">{t("remove")}</SubmitButton></form>
                    </li>
                  ))}
                </ul>
                {ms.length < 4 && unassigned.length > 0 && (
                  <form action={addMember.bind(null, id, team.id)} className="flex flex-wrap items-end gap-2">
                    <div>
                      <label className="label" htmlFor={`add-${team.id}`}>{t("addStudent")}</label>
                      <select id={`add-${team.id}`} name="student" className="field" required>
                        {unassigned.map((p) => <option key={p.studentId} value={p.studentId}>{p.name}</option>)}
                      </select>
                    </div>
                    <SubmitButton className="btn">{t("add")}</SubmitButton>
                  </form>
                )}
                <form action={setException.bind(null, id, team.id)} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-64 flex-1">
                    <label className="label" htmlFor={`ex-${team.id}`}>{t("exception")}</label>
                    <input id={`ex-${team.id}`} name="reason" className="field" maxLength={300} defaultValue={team.size_exception_reason ?? ""} aria-describedby={`exh-${team.id}`} />
                    <p id={`exh-${team.id}`} className="hint">{t("exceptionHelp")}</p>
                  </div>
                  <SubmitButton className="btn btn-sm">{t("save")}</SubmitButton>
                </form>
              </section>
            );
          })}
          <form action={createTeam.bind(null, id)} className="card flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <label className="label" htmlFor="team-name">{t("newTeam")}</label>
              <input id="team-name" name="name" className="field" required maxLength={60} />
            </div>
            <SubmitButton>{t("create")}</SubmitButton>
          </form>
        </div>

        <aside className="space-y-4">
          <section className="card space-y-2" aria-labelledby="un-h">
            <h2 id="un-h" className="h2">{t("unassigned", { count: unassigned.length })}</h2>
            <ul className="text-sm">{unassigned.map((p) => <li key={p.studentId}>{p.name}</li>)}</ul>
          </section>
          <section className="card space-y-2 border-2 border-warn" aria-labelledby="pref-h">
            <h2 id="pref-h" className="h2">🔒 {t("prefs")}</h2>
            <p className="hint">{t("prefsHelp")}</p>
            {!prefs.length && <p className="text-sm text-muted">{t("noPrefs")}</p>}
            {prefs.map((p) => (
              <details key={p.name}>
                <summary className="cursor-pointer font-semibold">{p.name}</summary>
                <dl className="mt-1 space-y-1 text-sm">
                  {p.rows.map((r) => <div key={r.label}><dt className="text-muted">{r.label}</dt><dd>{r.value || "—"}</dd></div>)}
                </dl>
              </details>
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}

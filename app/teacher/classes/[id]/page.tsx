import { getLocale, getTranslations } from "next-intl/server";
import { nowMs } from "@/lib/time";
import { requireRole } from "@/lib/auth/session";
import { classAssignments, lessonProgress, roster, surveyCompletion, teacherClass } from "@/lib/db/queries";
import { ClassTabs } from "@/features/teacher/ClassTabs";
import { InvitePanel } from "@/features/teacher/InvitePanel";
import { addSession, archiveClass, decideEnrollment, removeSession, revokeInvites } from "@/features/classes/actions";
import { Empty, PageHeader, StatusBadge, When } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import type { Locale } from "@/lib/validation/content";

export default async function ClassOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireRole("teacher");
  const cls = await teacherClass(actor, id);
  const t = await getTranslations("teacher.overview");
  const locale = (await getLocale()) as Locale;

  const [people, assignments, invites, sessions] = await Promise.all([
    roster(actor, id),
    classAssignments(actor, id),
    actor.supabase.from("class_invites").select("expires_at, uses, max_uses").eq("class_id", id).is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1),
    actor.supabase.from("class_sessions").select("id, label, notes").eq("class_id", id).order("created_at"),
  ]);
  const pending = people.filter((p) => p.status === "pending");
  const approved = people.filter((p) => p.status === "approved");
  const published = assignments.filter((a) => a.publishedAt);
  const lessons = published.filter((a) => a.kind === "lesson");
  const surveys = published.filter((a) => a.kind === "survey");
  const [progress, completion] = await Promise.all([lessonProgress(actor, lessons.map((a) => a.id)), surveyCompletion(actor, surveys.map((a) => a.id))]);
  const now = nowMs();

  const rows = approved.map((s) => {
    const statuses = lessons.map((a) => progress.get(a.id)?.get(s.studentId) ?? "not_started");
    const overdue = lessons.filter((a, i) => a.dueAt && Date.parse(a.dueAt) < now && ["not_started", "draft"].includes(statuses[i])).length;
    const surveysMissing = surveys.filter((a) => completion.get(a.id)?.get(s.studentId) !== "submitted").length;
    return {
      ...s,
      accepted: statuses.filter((x) => x === "accepted").length,
      revision: statuses.filter((x) => x === "needs_revision").length,
      awaiting: statuses.filter((x) => x === "submitted" || x === "practice_passed").length,
      overdue,
      surveysMissing,
    };
  });
  const attention = rows.filter((r) => r.revision || r.overdue || r.surveysMissing);
  const invite = invites.data?.[0];

  return (
    <>
      <PageHeader title={cls.name} subtitle={`${cls.term} · ${cls.timezone}${cls.archived_at ? ` · ${t("archived")}` : ""}`} back={{ href: "/teacher", label: t("back") }} />
      <ClassTabs classId={id} active="overview" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-3" aria-labelledby="invite-h">
          <h2 id="invite-h" className="h2">{t("enrollment")}</h2>
          <InvitePanel classId={id} activeInvite={invite ? { expires: new Date(invite.expires_at).toLocaleDateString(locale === "id" ? "id-ID" : "en-GB", { timeZone: cls.timezone }), uses: invite.uses, max: invite.max_uses } : null} />
          {invite && (
            <form action={revokeInvites.bind(null, id)}>
              <SubmitButton className="btn btn-sm btn-danger">{t("revoke")}</SubmitButton>
            </form>
          )}
          <h3 className="h3 pt-2">{t("pending", { count: pending.length })}</h3>
          {!pending.length && <Empty>{t("noPending")}</Empty>}
          <ul className="divide-y divide-line">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{p.name} <span className="text-sm text-muted">(<When iso={p.requestedAt} tz={cls.timezone} locale={locale} />)</span></span>
                <span className="flex gap-2">
                  <form action={decideEnrollment.bind(null, id, p.id, "approved")}><SubmitButton className="btn btn-sm btn-primary">{t("approve")}</SubmitButton></form>
                  <form action={decideEnrollment.bind(null, id, p.id, "rejected")}><SubmitButton className="btn btn-sm btn-danger">{t("reject")}</SubmitButton></form>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-3" aria-labelledby="attention-h">
          <h2 id="attention-h" className="h2">{t("attention")}</h2>
          <p className="hint">{t("attentionHelp")}</p>
          {!attention.length && <Empty>{t("noAttention")}</Empty>}
          <ul className="space-y-2">
            {attention.map((r) => (
              <li key={r.studentId}>
                <span className="font-semibold">{r.name}</span>
                <span className="text-sm text-muted">
                  {" — "}
                  {[r.revision ? t("reasonRevision", { count: r.revision }) : null, r.overdue ? t("reasonOverdue", { count: r.overdue }) : null, r.surveysMissing ? t("reasonSurvey", { count: r.surveysMissing }) : null].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6 space-y-3" aria-labelledby="roster-h">
        <h2 id="roster-h" className="h2">{t("roster", { count: approved.length })}</h2>
        {!approved.length ? (
          <Empty>{t("noStudents")}</Empty>
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby="roster-h">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t("rosterCaption")}</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-3">{t("colName")}</th>
                  <th scope="col" className="py-2 pr-3">{t("colAccepted", { total: lessons.length })}</th>
                  <th scope="col" className="py-2 pr-3">{t("colAwaiting")}</th>
                  <th scope="col" className="py-2 pr-3">{t("colRevision")}</th>
                  <th scope="col" className="py-2 pr-3">{t("colSurveys")}</th>
                  <th scope="col" className="py-2"><span className="sr-only">{t("colActions")}</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.studentId} className="border-b border-line/60">
                    <th scope="row" className="py-2 pr-3 font-semibold">{r.name}</th>
                    <td className="py-2 pr-3">{r.accepted}/{lessons.length}</td>
                    <td className="py-2 pr-3">{r.awaiting}</td>
                    <td className="py-2 pr-3">{r.revision}</td>
                    <td className="py-2 pr-3">{surveys.length - r.surveysMissing}/{surveys.length}</td>
                    <td className="py-2">
                      <form action={decideEnrollment.bind(null, id, r.id, "withdrawn")}><SubmitButton className="btn btn-sm">{t("withdraw")}</SubmitButton></form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {people.some((p) => p.status === "rejected" || p.status === "withdrawn") && (
          <details>
            <summary className="cursor-pointer text-sm font-semibold">{t("inactive")}</summary>
            <ul className="mt-2 space-y-1">
              {people.filter((p) => p.status === "rejected" || p.status === "withdrawn").map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  {p.name} <StatusBadge status={p.status} />
                  <form action={decideEnrollment.bind(null, id, p.id, "approved")}><SubmitButton className="btn btn-sm">{t("reinstate")}</SubmitButton></form>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card space-y-3" aria-labelledby="sessions-h">
          <h2 id="sessions-h" className="h2">{t("sessions")}</h2>
          <p className="hint">{t("sessionsHelp")}</p>
          <ul className="divide-y divide-line">
            {sessions.data?.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                <span><span className="font-semibold">{s.label}</span>{s.notes && <span className="text-sm text-muted"> — {s.notes}</span>}</span>
                <form action={removeSession.bind(null, id, s.id)}><SubmitButton className="btn btn-sm">{t("remove")}</SubmitButton></form>
              </li>
            ))}
          </ul>
          <form action={addSession.bind(null, id)} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div><label className="label" htmlFor="label">{t("sessionLabel")}</label><input className="field" id="label" name="label" required maxLength={80} placeholder={t("sessionExample")} /></div>
            <div><label className="label" htmlFor="notes">{t("sessionNotes")}</label><input className="field" id="notes" name="notes" maxLength={300} /></div>
            <SubmitButton>{t("add")}</SubmitButton>
          </form>
        </section>

        <section className="card space-y-3" aria-labelledby="data-h">
          <h2 id="data-h" className="h2">{t("data")}</h2>
          <p className="hint">{t("exportHelp")}</p>
          <div className="flex flex-wrap gap-2">
            {(["progress", "surveys", "teams", "scores"] as const).map((kind) => (
              <form key={kind} method="post" action={`/teacher/classes/${id}/export`}>
                <input type="hidden" name="kind" value={kind} />
                <button className="btn btn-sm" type="submit">{t(`export_${kind}`)}</button>
              </form>
            ))}
          </div>
          <form action={async () => { "use server"; await archiveClass(id, !cls.archived_at); }}>
            <SubmitButton className="btn btn-sm btn-danger">{cls.archived_at ? t("unarchive") : t("archive")}</SubmitButton>
          </form>
          <p className="hint">{t("archiveHelp")}</p>
        </section>
      </div>
    </>
  );
}

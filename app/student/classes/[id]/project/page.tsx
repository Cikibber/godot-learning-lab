import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { Alert, Empty, PageHeader, StatusBadge, When } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { StructuredForm } from "@/features/projects/StructuredForm";
import { BodyView } from "@/features/projects/BodyView";
import { INDIVIDUAL_CRITERIA, MILESTONE_FIELDS, PROPOSAL_FIELDS, TEAM_CRITERIA, type Body } from "@/features/projects/schema";
import { saveContribution, saveMilestone, saveProposal, startMilestone, startProposal, submitMilestone, submitProposal } from "@/features/projects/actions";
import type { Locale } from "@/lib/validation/content";

const KINDS = ["prototype", "playable_loop", "final"] as const;

export default async function StudentProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const actor = await requireRole("student");
  const t = await getTranslations("project");
  const locale = (await getLocale()) as Locale;
  const { data: enr } = await actor.supabase.from("enrollments").select("status, classes(name, timezone)").eq("class_id", id).eq("student_id", actor.id).maybeSingle();
  if (enr?.status !== "approved") notFound();
  const cls = enr.classes as { name: string; timezone: string };

  const { data: membership } = await actor.supabase.from("team_members").select("team_id, teams(name)").eq("class_id", id).eq("student_id", actor.id).is("left_at", null).maybeSingle();
  const header = <PageHeader title={t("title")} subtitle={cls.name} back={{ href: `/student/classes/${id}`, label: t("back") }} />;
  if (!membership) return <>{header}<Empty>{t("noTeam")}</Empty></>;
  const teamId = membership.team_id;

  const [{ data: roster }, { data: proposals }, { data: milestones }, { data: contributions }, { data: scores }] = await Promise.all([
    actor.supabase.rpc("team_roster", { p_team_id: teamId }),
    actor.supabase.from("project_proposals").select("id, version, status, revision, body, submitted_at").eq("team_id", teamId).order("version", { ascending: false }),
    actor.supabase.from("project_milestones").select("id, kind, version, status, revision, body, submitted_at").eq("team_id", teamId).order("version", { ascending: false }),
    actor.supabase.from("contribution_statements").select("milestone_kind, body, updated_at").eq("team_id", teamId).eq("student_id", actor.id),
    actor.supabase.from("rubric_scores").select("criterion, student_id, points, feedback").eq("team_id", teamId),
  ]);
  const ids = [...(proposals ?? []).map((p) => p.id)];
  const mids = (milestones ?? []).map((m) => m.id);
  const [{ data: pReviews }, { data: mReviews }] = await Promise.all([
    ids.length ? actor.supabase.from("proposal_reviews").select("proposal_id, result, feedback, created_at").in("proposal_id", ids) : Promise.resolve({ data: [] as { proposal_id: string; result: "approved" | "changes_requested"; feedback: string; created_at: string }[] }),
    mids.length ? actor.supabase.from("milestone_reviews").select("milestone_id, result, feedback, created_at").in("milestone_id", mids) : Promise.resolve({ data: [] as { milestone_id: string; result: "accepted" | "needs_revision"; feedback: string; created_at: string }[] }),
  ]);
  const latestProposal = proposals?.[0];
  const latestReview = latestProposal && pReviews?.find((r) => r.proposal_id === latestProposal.id);
  const approved = (pReviews ?? []).some((r) => r.result === "approved");
  const proposalStatus = !latestProposal ? "not_started" : latestProposal.status === "draft" ? "draft" : latestReview?.result ?? "submitted";

  return (
    <>
      {header}
      {sp.saved && <div className="mb-4"><Alert tone="ok">{t("saved")}</Alert></div>}
      {sp.error && <div className="mb-4"><Alert tone="bad">{t("error")}</Alert></div>}
      <section className="card mb-6 space-y-1" aria-labelledby="team-h">
        <h2 id="team-h" className="h2">{(membership.teams as { name: string }).name}</h2>
        <p>{(roster ?? []).map((r) => r.display_name).join(", ")}</p>
        <p className="hint">{t("teamHelp")}</p>
      </section>

      <section className="mb-8 space-y-3" aria-labelledby="proposal-h">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="proposal-h" className="h2">{t("proposal")}</h2>
          <StatusBadge status={proposalStatus} />
          {latestProposal && <span className="text-sm text-muted">v{latestProposal.version}</span>}
        </div>
        {latestReview && (
          <Alert tone={latestReview.result === "approved" ? "ok" : "bad"}>
            <p className="font-semibold">{t("teacherFeedback")}</p>
            <p className="whitespace-pre-wrap">{latestReview.feedback}</p>
          </Alert>
        )}
        {!latestProposal && (
          <form action={startProposal.bind(null, id, teamId)}><SubmitButton>{t("startProposal")}</SubmitButton></form>
        )}
        {latestProposal?.status === "draft" && (
          <StructuredForm kind="proposal" fields={PROPOSAL_FIELDS} userId={actor.id}
            draft={{ id: latestProposal.id, revision: latestProposal.revision, body: latestProposal.body as Body }}
            save={saveProposal} submit={submitProposal.bind(null, id)} />
        )}
        {latestProposal?.status === "submitted" && (
          <div className="card space-y-3">
            {!latestReview && <p className="text-muted">{t("awaitingReview")}</p>}
            <BodyView fields={PROPOSAL_FIELDS} body={latestProposal.body as Body} />
            {latestReview?.result === "changes_requested" && (
              <form action={startProposal.bind(null, id, teamId)}><SubmitButton>{t("newVersion")}</SubmitButton></form>
            )}
          </div>
        )}
      </section>

      <section className="mb-8 space-y-4" aria-labelledby="ms-h">
        <h2 id="ms-h" className="h2">{t("milestones")}</h2>
        {!approved && <Empty>{t("milestonesLocked")}</Empty>}
        {approved && KINDS.map((kind) => {
          const versions = (milestones ?? []).filter((m) => m.kind === kind);
          const latest = versions[0];
          const review = latest && mReviews?.find((r) => r.milestone_id === latest.id);
          const mine = contributions?.find((c) => c.milestone_kind === kind);
          return (
            <article key={kind} className="card space-y-3" aria-labelledby={`ms-${kind}`}>
              <div className="flex flex-wrap items-center gap-3">
                <h3 id={`ms-${kind}`} className="h3">{t(`kind_${kind}`)}</h3>
                <StatusBadge status={!latest ? "not_started" : latest.status === "draft" ? "draft" : review?.result ?? "submitted"} />
              </div>
              <p className="hint">{t(`kindHelp_${kind}`)}</p>
              {review && <Alert tone={review.result === "accepted" ? "ok" : "bad"}><p className="whitespace-pre-wrap">{review.feedback}</p></Alert>}
              {!latest && <form action={startMilestone.bind(null, id, teamId, kind)}><SubmitButton className="btn">{t("startMilestone")}</SubmitButton></form>}
              {latest?.status === "draft" && (
                <StructuredForm kind="milestone" fields={MILESTONE_FIELDS} userId={actor.id}
                  draft={{ id: latest.id, revision: latest.revision, body: latest.body as Body }}
                  save={saveMilestone} submit={submitMilestone.bind(null, id)} />
              )}
              {latest?.status === "submitted" && (
                <>
                  <p className="text-sm text-muted">v{latest.version} · <When iso={latest.submitted_at} tz={cls.timezone} locale={locale} /></p>
                  <BodyView fields={MILESTONE_FIELDS} body={latest.body as Body} />
                  {review?.result === "needs_revision" && <form action={startMilestone.bind(null, id, teamId, kind)}><SubmitButton className="btn">{t("newVersion")}</SubmitButton></form>}
                </>
              )}
              <form action={saveContribution.bind(null, id, teamId, kind)} className="space-y-2 border-t border-line pt-3">
                <label className="label" htmlFor={`contrib-${kind}`}>{t("contribution")}</label>
                <p className="hint" id={`contrib-help-${kind}`}>{t("contributionHelp")}</p>
                <textarea id={`contrib-${kind}`} name="body" className="field min-h-20" maxLength={1500} required defaultValue={mine?.body ?? ""} aria-describedby={`contrib-help-${kind}`} />
                <SubmitButton className="btn btn-sm">{t("saveContribution")}</SubmitButton>
              </form>
            </article>
          );
        })}
      </section>

      <section className="card space-y-2" aria-labelledby="scores-h">
        <h2 id="scores-h" className="h2">{t("scores")}</h2>
        {!scores?.length ? <p className="text-muted">{t("noScores")}</p> : (
          <table className="w-full text-sm">
            <caption className="sr-only">{t("scores")}</caption>
            <tbody>
              {[...TEAM_CRITERIA.map((c) => ({ ...c, team: true })), ...INDIVIDUAL_CRITERIA.map((c) => ({ ...c, team: false }))].map((c) => {
                const s = scores.find((x) => x.criterion === c.key && (c.team ? x.student_id === null : x.student_id === actor.id));
                return (
                  <tr key={c.key} className="border-b border-line/60">
                    <th scope="row" className="py-1 pr-3 text-left font-normal">{t(`crit_${c.key}`)} <span className="text-xs text-muted">({c.team ? t("teamPart") : t("individualPart")})</span></th>
                    <td className="py-1 pr-3 font-mono">{s ? `${s.points}/${c.max}` : "—"}</td>
                    <td className="py-1 text-muted">{s?.feedback}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

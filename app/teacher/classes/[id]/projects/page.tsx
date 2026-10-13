import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { roster, teacherClass } from "@/lib/db/queries";
import { ClassTabs } from "@/features/teacher/ClassTabs";
import { Alert, Empty, PageHeader, StatusBadge, When } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { BodyView } from "@/features/projects/BodyView";
import { INDIVIDUAL_CRITERIA, MILESTONE_FIELDS, PROPOSAL_FIELDS, TEAM_CRITERIA, type Body } from "@/features/projects/schema";
import { reviewMilestone, reviewProposal, saveScores } from "@/features/projects/actions";
import type { Locale } from "@/lib/validation/content";

const KINDS = ["prototype", "playable_loop", "final"] as const;

export default async function ProjectsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ team?: string; saved?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const actor = await requireRole("teacher");
  const cls = await teacherClass(actor, id);
  const t = await getTranslations("teacher.projects");
  const tp = await getTranslations("project");
  const locale = (await getLocale()) as Locale;
  const { data: teams } = await actor.supabase.from("teams").select("id, name, size_exception_reason").eq("class_id", id).order("created_at");
  const teamIds = (teams ?? []).map((x) => x.id);
  const [people, { data: proposals }, { data: milestones }, { data: allMembers }] = await Promise.all([
    roster(actor, id),
    teamIds.length ? actor.supabase.from("project_proposals").select("id, team_id, version, status, body, submitted_at").in("team_id", teamIds).order("version", { ascending: false }) : Promise.resolve({ data: [] }),
    teamIds.length ? actor.supabase.from("project_milestones").select("id, team_id, kind, version, status, body, submitted_at").in("team_id", teamIds).order("version", { ascending: false }) : Promise.resolve({ data: [] }),
    actor.supabase.from("team_members").select("team_id, student_id, left_at").eq("class_id", id),
  ]);
  const pIds = (proposals ?? []).map((p) => p.id);
  const mIds = (milestones ?? []).map((m) => m.id);
  const [{ data: pReviews }, { data: mReviews }] = await Promise.all([
    pIds.length ? actor.supabase.from("proposal_reviews").select("proposal_id, result, feedback, created_at").in("proposal_id", pIds) : Promise.resolve({ data: [] as { proposal_id: string; result: "approved" | "changes_requested"; feedback: string; created_at: string }[] }),
    mIds.length ? actor.supabase.from("milestone_reviews").select("milestone_id, result, feedback, observation, created_at").in("milestone_id", mIds) : Promise.resolve({ data: [] as { milestone_id: string; result: "accepted" | "needs_revision"; feedback: string; observation: string; created_at: string }[] }),
  ]);
  const names = new Map(people.map((p) => [p.studentId, p.name]));
  const selected = teams?.find((x) => x.id === sp.team) ?? teams?.[0];

  const header = (
    <>
      <PageHeader title={t("title")} subtitle={cls.name} back={{ href: `/teacher/classes/${id}`, label: t("back") }}>
        <Link className="btn btn-sm no-print" href="/teacher/plan">{t("rubricLink")}</Link>
      </PageHeader>
      <ClassTabs classId={id} active="projects" />
    </>
  );
  if (!selected) return <>{header}<Empty>{t("none")}</Empty></>;

  const proposal = proposals?.find((p) => p.team_id === selected.id);
  const pReview = proposal && pReviews?.find((r) => r.proposal_id === proposal.id);
  const members = (allMembers ?? []).filter((m) => m.team_id === selected.id);
  const everMembers = [...new Set(members.map((m) => m.student_id))];
  const { data: scores } = await actor.supabase.from("rubric_scores").select("criterion, student_id, points, feedback").eq("team_id", selected.id);
  const { data: contributions } = await actor.supabase.from("contribution_statements").select("student_id, milestone_kind, body, updated_at").eq("team_id", selected.id);
  const score = (criterion: string, studentId: string | null) => scores?.find((s) => s.criterion === criterion && s.student_id === studentId);
  const teamTotal = TEAM_CRITERIA.reduce((n, c) => n + Number(score(c.key, null)?.points ?? 0), 0);

  return (
    <>
      {header}
      {sp.saved && <div className="mb-4"><Alert tone="ok">{t("saved")}</Alert></div>}
      {sp.error && <div className="mb-4"><Alert tone="bad">{t("error")}</Alert></div>}

      <section className="mb-6 overflow-x-auto" aria-labelledby="overview-h" tabIndex={0}>
        <h2 id="overview-h" className="h2 mb-2">{t("overview")}</h2>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-line"><th scope="col" className="py-2 pr-3">{t("team")}</th><th scope="col" className="py-2 pr-3">{t("members")}</th><th scope="col" className="py-2 pr-3">{tp("proposal")}</th>{KINDS.map((k) => <th key={k} scope="col" className="py-2 pr-3">{tp(`kind_${k}`)}</th>)}</tr></thead>
          <tbody>
            {teams!.map((team) => {
              const p = proposals?.find((x) => x.team_id === team.id);
              const r = p && pReviews?.find((x) => x.proposal_id === p.id);
              return (
                <tr key={team.id} className="border-b border-line/60">
                  <th scope="row" className="py-2 pr-3"><Link className="link" href={`?team=${team.id}`} aria-current={team.id === selected.id ? "true" : undefined}>{team.name}</Link></th>
                  <td className="py-2 pr-3">{(allMembers ?? []).filter((m) => m.team_id === team.id && !m.left_at).length}{team.size_exception_reason ? " ⚑" : ""}</td>
                  <td className="py-2 pr-3"><StatusBadge status={!p ? "not_started" : p.status === "draft" ? "draft" : r?.result ?? "submitted"} /></td>
                  {KINDS.map((k) => {
                    const m = milestones?.find((x) => x.team_id === team.id && x.kind === k);
                    const mr = m && mReviews?.find((x) => x.milestone_id === m.id);
                    return <td key={k} className="py-2 pr-3"><StatusBadge status={!m ? "not_started" : m.status === "draft" ? "draft" : mr?.result ?? "submitted"} /></td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <h2 className="h1 mb-4">{selected.name}</h2>
      <p className="mb-4 text-sm">{t("currentMembers")}: {members.filter((m) => !m.left_at).map((m) => names.get(m.student_id)).join(", ") || "—"}{selected.size_exception_reason && <> · ⚑ {selected.size_exception_reason}</>}</p>

      <section className="card mb-6 space-y-3" aria-labelledby="prop-h">
        <h3 id="prop-h" className="h2">{tp("proposal")} {proposal && <span className="text-base font-normal text-muted">v{proposal.version}</span>}</h3>
        {!proposal || proposal.status === "draft" ? <p className="text-muted">{t("proposalNotSubmitted")}</p> : (
          <>
            <p className="text-sm text-muted"><When iso={proposal.submitted_at} tz={cls.timezone} locale={locale} /></p>
            <BodyView fields={PROPOSAL_FIELDS} body={proposal.body as Body} />
            {pReview ? (
              <Alert tone={pReview.result === "approved" ? "ok" : "bad"}><StatusBadge status={pReview.result} /> <span className="whitespace-pre-wrap">{pReview.feedback}</span></Alert>
            ) : (
              <form action={reviewProposal.bind(null, id, proposal.id)} className="space-y-2 border-t border-line pt-3">
                <fieldset className="flex flex-wrap gap-4"><legend className="label">{t("decision")}</legend>
                  <label className="flex min-h-11 items-center gap-2"><input type="radio" name="result" value="approved" required className="size-5" />{t("approve")}</label>
                  <label className="flex min-h-11 items-center gap-2"><input type="radio" name="result" value="changes_requested" className="size-5" />{t("requestChanges")}</label>
                </fieldset>
                <label className="label" htmlFor="pfb">{t("feedback")}</label>
                <textarea id="pfb" name="feedback" className="field min-h-24" required maxLength={2000} />
                <SubmitButton>{t("saveDecision")}</SubmitButton>
              </form>
            )}
          </>
        )}
      </section>

      {KINDS.map((kind) => {
        const m = milestones?.find((x) => x.team_id === selected.id && x.kind === kind);
        const r = m && mReviews?.find((x) => x.milestone_id === m.id);
        return (
          <section key={kind} className="card mb-4 space-y-3" aria-labelledby={`m-${kind}`}>
            <h3 id={`m-${kind}`} className="h2">{tp(`kind_${kind}`)} {m && <span className="text-base font-normal text-muted">v{m.version}</span>}</h3>
            {!m || m.status === "draft" ? <p className="text-muted">{t("milestoneNotSubmitted")}</p> : (
              <>
                <BodyView fields={MILESTONE_FIELDS} body={m.body as Body} />
                <p className="hint">{t("linkNote")}</p>
                {r ? (
                  <Alert tone={r.result === "accepted" ? "ok" : "bad"}>
                    <StatusBadge status={r.result} /> <span className="whitespace-pre-wrap">{r.feedback}</span>
                    {r.observation && <p className="mt-1 text-sm"><span className="font-semibold">{t("observation")}:</span> {r.observation}</p>}
                  </Alert>
                ) : (
                  <form action={reviewMilestone.bind(null, id, m.id)} className="space-y-2 border-t border-line pt-3">
                    <fieldset className="flex flex-wrap gap-4"><legend className="label">{t("decision")}</legend>
                      <label className="flex min-h-11 items-center gap-2"><input type="radio" name="result" value="accepted" required className="size-5" />{t("accept")}</label>
                      <label className="flex min-h-11 items-center gap-2"><input type="radio" name="result" value="needs_revision" className="size-5" />{t("revise")}</label>
                    </fieldset>
                    <label className="label" htmlFor={`fb-${kind}`}>{t("feedback")}</label>
                    <textarea id={`fb-${kind}`} name="feedback" className="field min-h-20" required maxLength={2000} />
                    <label className="label" htmlFor={`ob-${kind}`}>{t("observation")}</label>
                    <textarea id={`ob-${kind}`} name="observation" className="field min-h-16" maxLength={1000} aria-describedby={`obh-${kind}`} />
                    <p id={`obh-${kind}`} className="hint">{t("observationHelp")}</p>
                    <SubmitButton>{t("saveDecision")}</SubmitButton>
                  </form>
                )}
              </>
            )}
            <details>
              <summary className="cursor-pointer text-sm font-semibold">{t("contributions")}</summary>
              <ul className="mt-2 space-y-2 text-sm">
                {everMembers.map((sid) => {
                  const c = contributions?.find((x) => x.student_id === sid && x.milestone_kind === kind);
                  return <li key={sid}><span className="font-semibold">{names.get(sid)}:</span> <span className="whitespace-pre-wrap">{c?.body ?? <em className="text-muted">{t("noContribution")}</em>}</span></li>;
                })}
              </ul>
            </details>
          </section>
        );
      })}

      <form id="rubric" action={saveScores.bind(null, id, selected.id)} className="card space-y-4">
        <h3 className="h2">{t("rubric")}</h3>
        <p className="hint">{t("rubricHelp")}</p>
        <fieldset className="space-y-2">
          <legend className="h3">{t("teamScores", { total: teamTotal })}</legend>
          {TEAM_CRITERIA.map((c) => (
            <div key={c.key} className="grid gap-2 sm:grid-cols-[1fr_6rem_2fr] sm:items-end">
              <label className="label" htmlFor={`pts-${c.key}`}>{tp(`crit_${c.key}`)} (0–{c.max})</label>
              <input id={`pts-${c.key}`} name={`pts:${c.key}:team`} type="number" min={0} max={c.max} step={0.5} className="field" defaultValue={score(c.key, null)?.points ?? ""} />
              <input aria-label={`${tp(`crit_${c.key}`)}: ${t("note")}`} name={`note:${c.key}:team`} maxLength={1000} className="field" placeholder={t("note")} defaultValue={score(c.key, null)?.feedback ?? ""} />
            </div>
          ))}
        </fieldset>
        {everMembers.map((sid) => (
          <fieldset key={sid} className="space-y-2 border-t border-line pt-3">
            <legend className="h3">{names.get(sid)} — {t("individual", { total: INDIVIDUAL_CRITERIA.reduce((n, c) => n + Number(score(c.key, sid)?.points ?? 0), 0) })}{members.every((m) => m.student_id !== sid || m.left_at) ? ` (${t("formerMember")})` : ""}</legend>
            {INDIVIDUAL_CRITERIA.map((c) => (
              <div key={c.key} className="grid gap-2 sm:grid-cols-[1fr_6rem_2fr] sm:items-end">
                <label className="label" htmlFor={`pts-${c.key}-${sid}`}>{tp(`crit_${c.key}`)} (0–{c.max})</label>
                <input id={`pts-${c.key}-${sid}`} name={`pts:${c.key}:${sid}`} type="number" min={0} max={c.max} step={0.5} className="field" defaultValue={score(c.key, sid)?.points ?? ""} />
                <input aria-label={`${tp(`crit_${c.key}`)}: ${t("note")}`} name={`note:${c.key}:${sid}`} maxLength={1000} className="field" placeholder={t("note")} defaultValue={score(c.key, sid)?.feedback ?? ""} />
              </div>
            ))}
          </fieldset>
        ))}
        <SubmitButton>{t("saveScores")}</SubmitButton>
      </form>
    </>
  );
}

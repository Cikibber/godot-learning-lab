import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { classAssignments, roster, teacherClass } from "@/lib/db/queries";
import { ClassTabs } from "@/features/teacher/ClassTabs";
import { Alert, Empty, PageHeader, StatusBadge, When } from "@/components/ui";
import type { Locale } from "@/lib/validation/content";

const PAGE = 25;
const FILTERS = ["awaiting", "needs_revision", "accepted", "all"] as const;

export default async function ReviewsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ a?: string; f?: string; p?: string; done?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const actor = await requireRole("teacher");
  const cls = await teacherClass(actor, id);
  const t = await getTranslations("teacher.reviews");
  const locale = (await getLocale()) as Locale;
  const filter = (FILTERS as readonly string[]).includes(sp.f ?? "") ? (sp.f as (typeof FILTERS)[number]) : "awaiting";
  const page = Math.max(0, Number(sp.p) || 0);

  const lessons = (await classAssignments(actor, id)).filter((a) => a.kind === "lesson");
  const ids = sp.a && lessons.some((l) => l.id === sp.a) ? [sp.a] : lessons.map((l) => l.id);
  const names = new Map((await roster(actor, id)).map((r) => [r.studentId, r.name]));

  const { data: attempts } = ids.length
    ? await actor.supabase
        .from("exercise_attempts")
        .select("id, assignment_id, student_id, attempt_no, submitted_at, checks:evidence->checkResults")
        .in("assignment_id", ids)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: true })
        .limit(2000)
    : { data: [] };
  const attemptIds = (attempts ?? []).map((a) => a.id);
  const reviews: { attempt_id: string; result: "accepted" | "needs_revision"; created_at: string }[] = [];
  for (let i = 0; i < attemptIds.length; i += 200) {
    const { data } = await actor.supabase.from("attempt_reviews").select("attempt_id, result, created_at").in("attempt_id", attemptIds.slice(i, i + 200));
    reviews.push(...(data ?? []));
  }
  const latest = new Map<string, "accepted" | "needs_revision">();
  for (const r of [...reviews].sort((a, b) => a.created_at.localeCompare(b.created_at))) latest.set(r.attempt_id, r.result);

  // Only the newest submitted attempt per student/assignment needs a decision.
  const newest = new Map<string, number>();
  for (const a of attempts ?? []) newest.set(`${a.assignment_id}:${a.student_id}`, Math.max(newest.get(`${a.assignment_id}:${a.student_id}`) ?? 0, a.attempt_no));
  const rows = (attempts ?? [])
    .map((a) => ({ ...a, review: latest.get(a.id) ?? null, isNewest: newest.get(`${a.assignment_id}:${a.student_id}`) === a.attempt_no }))
    .filter((r) => (filter === "all" ? true : filter === "awaiting" ? !r.review && r.isNewest : r.review === filter));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const lessonTitle = new Map(lessons.map((l) => [l.id, `${l.lesson!.module}. ${l.lesson!.title[locale]}`]));
  const qs = (o: Record<string, string | number | undefined>) =>
    "?" + new URLSearchParams(Object.entries({ a: sp.a, f: filter, p: page, ...o }).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();

  return (
    <>
      <PageHeader title={t("title")} subtitle={cls.name} back={{ href: `/teacher/classes/${id}`, label: t("back") }} />
      <ClassTabs classId={id} active="reviews" />
      {sp.done && <div className="mb-4"><Alert tone="ok">{t("saved")}</Alert></div>}

      <form className="card mb-4 flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="label" htmlFor="a">{t("lesson")}</label>
          <select id="a" name="a" className="field" defaultValue={sp.a ?? ""}>
            <option value="">{t("allLessons")}</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{lessonTitle.get(l.id)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f">{t("status")}</label>
          <select id="f" name="f" className="field" defaultValue={filter}>
            {FILTERS.map((f) => <option key={f} value={f}>{t(`filter_${f}`)}</option>)}
          </select>
        </div>
        <button className="btn" type="submit">{t("apply")}</button>
      </form>

      <p className="mb-2 text-sm text-muted">{t("count", { count: rows.length })}</p>
      {!shown.length ? (
        <Empty>{t("empty")}</Empty>
      ) : (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("title")}>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("title")}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-3">{t("student")}</th>
                <th scope="col" className="py-2 pr-3">{t("lesson")}</th>
                <th scope="col" className="py-2 pr-3">{t("attempt")}</th>
                <th scope="col" className="py-2 pr-3">{t("submitted")}</th>
                <th scope="col" className="py-2 pr-3">{t("checks")}</th>
                <th scope="col" className="py-2">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const checks = (r.checks as { passed: boolean }[] | null) ?? [];
                return (
                  <tr key={r.id} className="border-b border-line/60">
                    <th scope="row" className="py-2 pr-3"><Link className="link" href={`/teacher/classes/${id}/reviews/${r.id}`}>{names.get(r.student_id) ?? "?"}</Link></th>
                    <td className="py-2 pr-3">{lessonTitle.get(r.assignment_id)}</td>
                    <td className="py-2 pr-3">#{r.attempt_no}</td>
                    <td className="py-2 pr-3"><When iso={r.submitted_at} tz={cls.timezone} locale={locale} /></td>
                    <td className="py-2 pr-3">{checks.filter((c) => c.passed).length}/{checks.length}</td>
                    <td className="py-2">{r.review ? <StatusBadge status={r.review} /> : <StatusBadge status="submitted" />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <nav aria-label={t("pagination")} className="mt-4 flex gap-2">
        {page > 0 && <Link className="btn btn-sm" href={qs({ p: page - 1 })}>{t("prev")}</Link>}
        {(page + 1) * PAGE < rows.length && <Link className="btn btn-sm" href={qs({ p: page + 1 })}>{t("next")}</Link>}
      </nav>
    </>
  );
}

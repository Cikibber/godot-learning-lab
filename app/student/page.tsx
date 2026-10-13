import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { myEnrollments, studentClassItems } from "@/lib/db/student";
import { JoinClassForm } from "@/features/student/JoinClassForm";
import { NextUp, PathList } from "@/features/student/LearningPath";
import { Empty, PageHeader, StatusBadge } from "@/components/ui";
import type { Locale } from "@/lib/validation/content";

export async function generateMetadata() {
  return { title: (await getTranslations("student"))("title") };
}

const DONE = new Set(["accepted", "submitted", "practice_passed"]);

export default async function StudentHome() {
  const actor = await requireRole("student");
  const t = await getTranslations("student");
  const locale = (await getLocale()) as Locale;
  const enrollments = await myEnrollments(actor);
  const approved = enrollments.filter((e) => e.status === "approved");
  const pending = enrollments.filter((e) => e.status === "pending");
  const perClass = await Promise.all(approved.map(async (e) => ({ e, items: await studentClassItems(actor, e.class_id) })));
  // Revisions first, then the first unfinished item in the teacher's order.
  const open = perClass.flatMap(({ e, items }) => items.filter((i) => !DONE.has(i.status)).map((i) => ({ e, i })));
  const next = open.find((x) => x.i.status === "needs_revision") ?? open[0];

  return (
    <>
      <PageHeader title={t("hello", { name: actor.displayName })} subtitle={t("subtitle")} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="continue-h" className="rounded-[6px] border border-line-strong bg-panel">
            <h2 id="continue-h" className="border-b border-line px-5 py-2.5 text-sm font-semibold text-brand">
              <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-brand align-middle" />
              {t("continue")}
            </h2>
            <div className="p-5">
              {next ? (
                <NextUp item={next.i} className={next.e.cls?.name} timezone={next.e.cls?.timezone ?? "Asia/Jakarta"} locale={locale} />
              ) : (
                <Empty>{approved.length ? t("allDone") : t("noClasses")}</Empty>
              )}
            </div>
          </section>

          {perClass.map(({ e, items }) => {
            const lessons = items.filter((i) => i.kind === "lesson");
            const accepted = lessons.filter((i) => i.status === "accepted").length;
            return (
              <section key={e.id} aria-labelledby={`c-${e.id}`} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                  <h2 id={`c-${e.id}`} className="h2">
                    <Link className="hover:text-brand" href={`/student/classes/${e.class_id}`}>{e.cls?.name}</Link>
                  </h2>
                  <p className="meta">{t("summary", { accepted, total: lessons.length })}</p>
                </div>
                {lessons.length > 0 && (
                  // Real progress only: one segment per published module.
                  <div className="flex gap-1" aria-hidden="true">
                    {lessons.map((l) => (
                      <span key={l.id} className={`h-1.5 flex-1 rounded-[1px] ${l.status === "accepted" ? "bg-ok" : l.status === "needs_revision" ? "bg-bad" : l.status === "not_started" ? "bg-line" : "bg-info/70"}`} />
                    ))}
                  </div>
                )}
                {items.length ? <PathList items={items} timezone={e.cls?.timezone ?? "Asia/Jakarta"} locale={locale} /> : <Empty>{t("class.none")}</Empty>}
                <Link className="link text-sm" href={`/student/classes/${e.class_id}/project`}>{t("class.project")}</Link>
              </section>
            );
          })}
        </div>

        <aside className="space-y-4" aria-label={t("sideLabel")}>
          {pending.length > 0 && (
            <section className="panel" aria-labelledby="pending-h">
              <h2 id="pending-h" className="panel-head">{t("pendingTitle")}</h2>
              <div className="panel-body space-y-2">
                <ul className="space-y-1">{pending.map((e) => <li key={e.id} className="flex items-center justify-between gap-2">{e.cls?.name ?? "—"} <StatusBadge status="pending" /></li>)}</ul>
                <p className="hint">{t("pendingHelp")}</p>
              </div>
            </section>
          )}
          <JoinClassForm />
          <section className="panel text-sm" aria-labelledby="help-h">
            <h2 id="help-h" className="panel-head">{t("help.title")}</h2>
            <ul className="panel-body list-disc space-y-1.5 pl-8 text-muted">
              <li>{t("help.p1")}</li>
              <li>{t("help.p2")}</li>
              <li>{t("help.p3")}</li>
              <li>{t("help.p4")}</li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

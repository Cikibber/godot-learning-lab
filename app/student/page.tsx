import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { itemHref, itemTitle, myEnrollments, studentClassItems } from "@/lib/db/student";
import { JoinClassForm } from "@/features/student/JoinClassForm";
import { Empty, PageHeader, StatusBadge, When } from "@/components/ui";
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
  const next = perClass.flatMap(({ e, items }) => items.filter((i) => !DONE.has(i.status)).map((i) => ({ e, i })))[0];

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("hello", { name: actor.displayName })} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="continue-h" className="card space-y-2 border-2 border-brand">
            <h2 id="continue-h" className="h2">{t("continue")}</h2>
            {next ? (
              <>
                <p className="text-lg font-semibold">{itemTitle(next.i, locale)}</p>
                <p className="text-sm text-muted">
                  {next.e.cls?.name}
                  {next.i.lesson && <> · {t("minutes", { min: next.i.lesson.minutes.explain + next.i.lesson.minutes.practice })}</>}
                  {next.i.dueAt && next.e.cls && <> · {t("due")} <When iso={next.i.dueAt} tz={next.e.cls.timezone} locale={locale} /></>}
                </p>
                {next.i.lesson && <p>{next.i.lesson.objective[locale]}</p>}
                <Link className="btn btn-primary" href={itemHref(next.i)}>{t("open")}</Link>
              </>
            ) : (
              <Empty>{approved.length ? t("allDone") : t("noClasses")}</Empty>
            )}
          </section>

          {perClass.map(({ e, items }) => {
            const lessons = items.filter((i) => i.kind === "lesson");
            const revision = items.filter((i) => i.status === "needs_revision").length;
            return (
              <section key={e.id} aria-labelledby={`c-${e.id}`} className="card space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={`c-${e.id}`} className="h2"><Link className="link" href={`/student/classes/${e.class_id}`}>{e.cls?.name}</Link></h2>
                  <p className="text-sm text-muted">{t("summary", { accepted: lessons.filter((i) => i.status === "accepted").length, total: lessons.length })}</p>
                </div>
                {revision > 0 && <p className="font-semibold text-bad">{t("revisionNeeded", { count: revision })}</p>}
                <ul className="divide-y divide-line">
                  {items.slice(0, 6).map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link className="link" href={itemHref(i)}>{itemTitle(i, locale)}</Link>
                      <StatusBadge status={i.status} />
                    </li>
                  ))}
                </ul>
                <Link className="link text-sm" href={`/student/classes/${e.class_id}`}>{t("viewClass")}</Link>
              </section>
            );
          })}
        </div>

        <div className="space-y-6">
          <JoinClassForm />
          <section className="card space-y-2 text-sm" aria-labelledby="help-h">
            <h2 id="help-h" className="h2">{t("help.title")}</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("help.p1")}</li>
              <li>{t("help.p2")}</li>
              <li>{t("help.p3")}</li>
              <li>{t("help.p4")}</li>
            </ul>
          </section>
          {pending.length > 0 && (
            <section className="card space-y-2" aria-labelledby="pending-h">
              <h2 id="pending-h" className="h2">{t("pendingTitle")}</h2>
              <ul>{pending.map((e) => <li key={e.id} className="flex items-center justify-between gap-2 py-1">{e.cls?.name ?? "—"} <StatusBadge status="pending" /></li>)}</ul>
              <p className="hint">{t("pendingHelp")}</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

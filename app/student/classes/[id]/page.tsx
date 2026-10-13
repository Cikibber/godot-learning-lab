import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { isPast } from "@/lib/time";
import { requireRole } from "@/lib/auth/session";
import { itemHref, itemTitle, studentClassItems } from "@/lib/db/student";
import { Empty, PageHeader, StatusBadge, When } from "@/components/ui";
import type { Locale } from "@/lib/validation/content";

export default async function StudentClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireRole("student");
  const t = await getTranslations("student.class");
  const locale = (await getLocale()) as Locale;
  const { data: enrollment } = await actor.supabase.from("enrollments").select("status, classes(name, term, timezone)").eq("class_id", id).eq("student_id", actor.id).maybeSingle();
  if (!enrollment || enrollment.status !== "approved") notFound();
  const cls = enrollment.classes as { name: string; term: string; timezone: string };
  const items = await studentClassItems(actor, id);

  return (
    <>
      <PageHeader title={cls.name} subtitle={cls.term} back={{ href: "/student", label: t("back") }}>
        <Link className="btn" href={`/student/classes/${id}/project`}>{t("project")}</Link>
      </PageHeader>
      <section aria-labelledby="assign-h" className="space-y-3">
        <h2 id="assign-h" className="h2">{t("assignments")}</h2>
        {!items.length && <Empty>{t("none")}</Empty>}
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link className="link text-lg" href={itemHref(i)}>{itemTitle(i, locale)}</Link>
                <p className="text-sm text-muted">
                  {i.kind === "lesson" ? t("lesson") : t("survey")}
                  {i.dueAt && <> · {t("due")} <When iso={i.dueAt} tz={cls.timezone} locale={locale} /></>}
                  {isPast(i.closedAt) && <> · {t("closed")}</>}
                </p>
              </div>
              <StatusBadge status={i.status} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";

const TABS = ["overview", "assignments", "reviews", "surveys", "teams", "projects"] as const;

export async function ClassTabs({ classId, active }: { classId: string; active: (typeof TABS)[number] }) {
  const t = await getTranslations("teacher.tabs");
  return (
    <nav aria-label={t("label")} className="no-print -mx-4 mb-8 flex gap-1 overflow-x-auto border-b border-line px-4">
      {TABS.map((tab) => (
        <Link
          key={tab}
          href={`/teacher/classes/${classId}${tab === "overview" ? "" : `/${tab}`}`}
          aria-current={tab === active ? "page" : undefined}
          className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold ${tab === active ? "border-brand text-ink" : "border-transparent text-muted hover:border-line-strong hover:text-ink"}`}
        >
          {t(tab)}
        </Link>
      ))}
    </nav>
  );
}

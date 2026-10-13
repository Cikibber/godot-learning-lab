import Link from "next/link";
import { getTranslations } from "next-intl/server";

const TABS = ["overview", "assignments", "reviews", "surveys", "teams", "projects"] as const;

export async function ClassTabs({ classId, active }: { classId: string; active: (typeof TABS)[number] }) {
  const t = await getTranslations("teacher.tabs");
  return (
    <nav aria-label={t("label")} className="no-print mb-6 flex flex-wrap gap-2 border-b border-line pb-2">
      {TABS.map((tab) => (
        <Link
          key={tab}
          href={`/teacher/classes/${classId}${tab === "overview" ? "" : `/${tab}`}`}
          aria-current={tab === active ? "page" : undefined}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === active ? "bg-brand text-white" : "text-brand hover:bg-brand/10"}`}
        >
          {t(tab)}
        </Link>
      ))}
    </nav>
  );
}

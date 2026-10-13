import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { CreateClassForm } from "@/features/teacher/CreateClassForm";
import { Empty, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  return { title: (await getTranslations("teacher"))("title") };
}

export default async function TeacherHome() {
  const actor = await requireRole("teacher");
  const t = await getTranslations("teacher");
  const { data: classes } = await actor.supabase.from("classes").select("id, name, term, archived_at").eq("teacher_id", actor.id).order("created_at");
  const { data: pending } = await actor.supabase.from("enrollments").select("class_id").eq("status", "pending");
  const pendingBy = new Map<string, number>();
  for (const p of pending ?? []) pendingBy.set(p.class_id, (pendingBy.get(p.class_id) ?? 0) + 1);
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("hello", { name: actor.displayName })} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="classes-h" className="space-y-3">
          <h2 id="classes-h" className="h2">{t("classes")}</h2>
          {!classes?.length && <Empty>{t("noClasses")}</Empty>}
          <ul className="space-y-3">
            {classes?.map((c) => (
              <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/teacher/classes/${c.id}`} className="link text-lg">{c.name}</Link>
                  <p className="text-sm text-muted">{c.term}{c.archived_at ? ` · ${t("archived")}` : ""}</p>
                </div>
                {(pendingBy.get(c.id) ?? 0) > 0 && (
                  <span className="rounded-full bg-warn/15 px-3 py-1 text-sm font-semibold text-warn">{t("pendingCount", { count: pendingBy.get(c.id)! })}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
        <CreateClassForm />
      </div>
    </>
  );
}

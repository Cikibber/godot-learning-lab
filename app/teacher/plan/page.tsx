import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { RUBRIC, WEEKS } from "@/content/plan";
import { PageHeader } from "@/components/ui";
import type { Locale } from "@/lib/validation/content";

export async function generateMetadata() {
  return { title: (await getTranslations("plan"))("title") };
}

export default async function PlanPage() {
  await requireRole("teacher");
  const t = await getTranslations("plan");
  const tp = await getTranslations("project");
  const locale = (await getLocale()) as Locale;
  return (
    <article className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <section aria-labelledby="weeks-h" className="space-y-3">
        <h2 id="weeks-h" className="h2">{t("weeks")}</h2>
        <p className="max-w-prose">{t("weeksHelp")}</p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby="weeks-h">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b-2 border-line"><th scope="col" className="py-2 pr-3">{t("week")}</th><th scope="col" className="py-2 pr-3">{t("browser")}</th><th scope="col" className="py-2 pr-3">{t("godot")}</th><th scope="col" className="py-2">{t("deliverable")}</th></tr></thead>
            <tbody>
              {WEEKS.map((w, i) => (
                <tr key={i} className="border-b border-line align-top">
                  <th scope="row" className="py-2 pr-3">{i + 1}</th>
                  {w.map((c, j) => <td key={j} className="py-2 pr-3">{c[locale]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">{t("capacity")}</p>
      </section>

      <section aria-labelledby="rubric-h" className="space-y-3">
        <h2 id="rubric-h" className="h2">{t("rubric")}</h2>
        <p className="max-w-prose">{t("rubricHelp")}</p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby="rubric-h">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-line">
                <th scope="col" className="py-2 pr-3">{t("criterion")}</th>
                <th scope="col" className="py-2 pr-3">{t("weight")}</th>
                {(["excellent", "meets", "developing", "beginning"] as const).map((l) => <th key={l} scope="col" className="py-2 pr-3">{t(l)}</th>)}
              </tr>
            </thead>
            <tbody>
              {RUBRIC.map((r) => (
                <tr key={r.key} className="border-b border-line align-top">
                  <th scope="row" className="py-2 pr-3">{tp(`crit_${r.key}`)}</th>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.max} {r.team ? tp("teamPart") : tp("individualPart")}</td>
                  {r.levels.map((l, i) => <td key={i} className="py-2 pr-3">{l[locale]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">{t("anchors")}</p>
        <p className="hint">{t("individualEvidence")}</p>
      </section>
    </article>
  );
}

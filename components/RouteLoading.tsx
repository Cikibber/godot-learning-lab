import { getTranslations } from "next-intl/server";

/** Instant navigation feedback while the server renders the next page. */
export async function RouteLoading() {
  const t = await getTranslations("common");
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <p className="sr-only">{t("loading")}</p>
      <div className="h-8 w-64 max-w-full rounded-[3px] bg-raised" />
      <div className="h-40 rounded-[6px] border border-line bg-panel" />
      <div className="space-y-px overflow-hidden rounded-[3px] border border-line">
        {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-panel" />)}
      </div>
    </div>
  );
}

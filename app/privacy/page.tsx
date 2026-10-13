import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  return { title: (await getTranslations("privacy"))("title") };
}

// Plain-language notice. The school contact comes from configuration; the
// retention period is a proposal until the school approves it.
export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const name = process.env.SCHOOL_CONTACT_NAME ?? "—";
  const email = process.env.SCHOOL_CONTACT_EMAIL ?? "";
  const sections = ["collect", "why", "who", "notCollected", "surveys", "keep", "rights", "storage"] as const;
  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <h1 className="h1">{t("title")}</h1>
      <p className="rounded-md border border-warn/40 bg-warn/10 p-3">{t("draftNotice")}</p>
      {sections.map((s) => (
        <section key={s} className="space-y-1">
          <h2 className="h2">{t(`${s}.h`)}</h2>
          <p>{t(`${s}.p`)}</p>
        </section>
      ))}
      <section className="space-y-1">
        <h2 className="h2">{t("contact.h")}</h2>
        <p>{t("contact.p")}</p>
        <p className="font-semibold">{name}{email && <> · <a className="link" href={`mailto:${email}`}>{email}</a></>}</p>
      </section>
    </article>
  );
}

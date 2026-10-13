import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getActor } from "@/lib/auth/session";

export default async function Home() {
  const actor = await getActor();
  if (actor) redirect(actor.role === "teacher" ? "/teacher" : "/student");
  const t = await getTranslations("landing");
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <h1 className="h1">{t("promise")}</h1>
      <p className="text-lg">{t("body")}</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>{t("point1")}</li>
        <li>{t("point2")}</li>
        <li>{t("point3")}</li>
      </ul>
      <p className="rounded-md border border-warn/40 bg-warn/10 p-3">{t("honest")}</p>
      <div className="flex flex-wrap gap-3">
        <Link className="btn btn-primary" href="/sign-in">{t("cta")}</Link>
        <Link className="btn" href="/privacy">{t("privacy")}</Link>
      </div>
    </div>
  );
}

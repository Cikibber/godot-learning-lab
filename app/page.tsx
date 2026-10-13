import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getActor } from "@/lib/auth/session";
import { Motif } from "@/components/Motif";
import { PracticePreview } from "@/components/PracticePreview";

export default async function Home() {
  const actor = await getActor();
  if (actor) redirect(actor.role === "teacher" ? "/teacher" : "/student");
  const t = await getTranslations("landing");
  const points = [
    { kind: "scene" as const, text: t("point1") },
    { kind: "movement" as const, text: t("point2") },
    { kind: "loop" as const, text: t("point3") },
  ];
  return (
    <div className="grid items-center gap-10 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-8">
      <div className="space-y-6">
        <h1 className="display max-w-[16ch]">{t("headline")}</h1>
        <p className="max-w-[54ch] text-lg text-ink/90">{t("body")}</p>
        <ul className="space-y-3">
          {points.map((p) => (
            <li key={p.kind} className="flex items-start gap-3">
              <span className="text-brand"><Motif kind={p.kind} size={26} /></span>
              <span className="pt-0.5">{p.text}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link className="btn btn-primary" href="/sign-in">{t("cta")}</Link>
          <Link className="btn btn-quiet" href="/privacy">{t("privacy")}</Link>
        </div>
      </div>
      <figure className="space-y-3">
        <PracticePreview />
        <figcaption className="flex gap-3 text-sm text-muted">
          <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[2px] bg-warn font-mono text-xs font-bold text-on-brand">!</span>
          <span>{t("honest")}</span>
        </figcaption>
      </figure>
    </div>
  );
}

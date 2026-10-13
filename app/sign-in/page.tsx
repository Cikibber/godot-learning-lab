import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth/session";
import { SignInForm } from "@/features/auth/SignInForm";
import { Alert } from "@/components/ui";

export async function generateMetadata() {
  return { title: (await getTranslations("signIn"))("title") };
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const actor = await getActor();
  if (actor) redirect(actor.role === "teacher" ? "/teacher" : "/student");
  const t = await getTranslations("signIn");
  const { link } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="h1">{t("title")}</h1>
      {link === "invalid" && <Alert tone="bad">{t("linkInvalid")}</Alert>}
      <SignInForm />
      <p className="hint">{t("help")}</p>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth/session";
import { PasswordForm } from "@/features/auth/PasswordForm";

export default async function PasswordPage() {
  if (!(await getActor())) redirect("/sign-in");
  const t = await getTranslations("password");
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="h1">{t("title")}</h1>
      <p>{t("intro")}</p>
      <PasswordForm />
    </div>
  );
}

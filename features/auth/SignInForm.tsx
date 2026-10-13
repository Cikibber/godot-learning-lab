"use client";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signIn, type FormState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { clearAllLocalDrafts } from "@/lib/draft-cache";

export function SignInForm() {
  const t = useTranslations("signIn");
  const te = useTranslations("errors");
  const [state, action] = useActionState<FormState, FormData>(signIn, null);
  return (
    // A new sign-in on a shared computer must not see the previous user's drafts.
    <form action={action} onSubmit={() => clearAllLocalDrafts()} className="card space-y-4" noValidate>
      {state?.error && <p role="alert" className="error" id="signin-error">{te(state.error as "signInFailed")}</p>}
      <div>
        <label className="label" htmlFor="email">{t("email")}</label>
        <input className="field" id="email" name="email" type="email" autoComplete="username" required aria-describedby={state?.error ? "signin-error" : undefined} />
      </div>
      <div>
        <label className="label" htmlFor="password">{t("password")}</label>
        <input className="field" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton pendingText={t("pending")}>{t("submit")}</SubmitButton>
    </form>
  );
}

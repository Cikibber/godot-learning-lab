"use client";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { setPassword, type FormState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export function PasswordForm() {
  const t = useTranslations("password");
  const te = useTranslations("errors");
  const [state, action] = useActionState<FormState, FormData>(setPassword, null);
  return (
    <form action={action} className="card space-y-4">
      {state?.error && <p role="alert" className="error">{te(state.error as "generic")}</p>}
      <div>
        <label className="label" htmlFor="password">{t("new")}</label>
        <input className="field" id="password" name="password" type="password" autoComplete="new-password" minLength={10} required aria-describedby="pw-hint" />
        <p className="hint" id="pw-hint">{t("rule")}</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">{t("confirm")}</label>
        <input className="field" id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}

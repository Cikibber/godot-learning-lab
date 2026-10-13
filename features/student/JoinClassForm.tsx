"use client";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { redeemCode, type ActionResult } from "@/features/classes/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function JoinClassForm() {
  const t = useTranslations("student.join");
  const [state, action] = useActionState<ActionResult, FormData>(redeemCode, null);
  return (
    <form action={action} className="card space-y-3">
      <h2 className="h2">{t("title")}</h2>
      <div>
        <label className="label" htmlFor="code">{t("label")}</label>
        <input id="code" name="code" className="field font-mono uppercase tracking-widest" maxLength={20} autoComplete="off" required aria-describedby="code-help code-msg" />
        <p id="code-help" className="hint">{t("help")}</p>
      </div>
      <p id="code-msg" role="status" className={state?.ok ? "font-semibold text-ok" : "error"}>
        {state?.ok ? t("sent") : state?.error ? t("failed") : ""}
      </p>
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}

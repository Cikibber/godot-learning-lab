"use client";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { rotateInvite, type ActionResult } from "@/features/classes/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function InvitePanel({ classId, activeInvite }: { classId: string; activeInvite: { expires: string; uses: number; max: number } | null }) {
  const t = useTranslations("teacher.invite");
  const [state, action] = useActionState<ActionResult, FormData>(rotateInvite.bind(null, classId), null);
  return (
    <div className="space-y-3">
      {state?.code ? (
        <div role="status" className="rounded-md border-2 border-ok bg-ok/10 p-3">
          <p className="text-sm">{t("showOnce")}</p>
          <p className="font-mono text-2xl font-bold tracking-widest">{state.code}</p>
        </div>
      ) : activeInvite ? (
        <p className="text-sm">{t("active", activeInvite)}</p>
      ) : (
        <p className="text-sm text-muted">{t("none")}</p>
      )}
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="days">{t("days")}</label>
          <input className="field w-24" id="days" name="days" type="number" min={1} max={90} defaultValue={14} />
        </div>
        <div>
          <label className="label" htmlFor="maxUses">{t("maxUses")}</label>
          <input className="field w-24" id="maxUses" name="maxUses" type="number" min={1} max={200} defaultValue={45} />
        </div>
        <SubmitButton>{activeInvite ? t("rotate") : t("create")}</SubmitButton>
      </form>
      {state?.error && <p role="alert" className="error">{t("failed")}</p>}
      <p className="hint">{t("help")}</p>
    </div>
  );
}

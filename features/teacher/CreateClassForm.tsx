"use client";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createClass, type ActionResult } from "@/features/classes/actions";
import { SubmitButton } from "@/components/SubmitButton";

const ZONES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Singapore", "Europe/London", "UTC"];

export function CreateClassForm() {
  const t = useTranslations("teacher.create");
  const [state, action] = useActionState<ActionResult, FormData>(createClass, null);
  return (
    <form action={action} className="card space-y-3">
      <h2 className="h2">{t("title")}</h2>
      {state?.error && <p role="alert" className="error">{t("failed")}</p>}
      <div>
        <label className="label" htmlFor="name">{t("name")}</label>
        <input className="field" id="name" name="name" required maxLength={80} />
      </div>
      <div>
        <label className="label" htmlFor="term">{t("term")}</label>
        <input className="field" id="term" name="term" maxLength={40} placeholder="2026/2027 Ganjil" />
      </div>
      <div>
        <label className="label" htmlFor="timezone">{t("timezone")}</label>
        <select className="field" id="timezone" name="timezone" defaultValue="Asia/Jakarta">
          {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>
      <SubmitButton>{t("submit")}</SubmitButton>
    </form>
  );
}

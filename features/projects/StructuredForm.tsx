"use client";
// Shared editor for team proposals and milestones: autosave with revision
// checks (one teammate's stale tab cannot overwrite another's save).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAutosave, type SaveOutcome } from "@/lib/useAutosave";
import { validateBody, type Body, type FieldSpec } from "./schema";
import type { SubmitResult } from "./actions";

type Props = {
  kind: "proposal" | "milestone";
  fields: readonly FieldSpec[];
  userId: string;
  draft: { id: string; revision: number; body: Body };
  save: (input: { id: string | null; revision: number; body: unknown }) => Promise<SaveOutcome>;
  submit: (input: { id: string | null; revision: number; body: unknown }) => Promise<SubmitResult>;
};

export function StructuredForm({ kind, fields, userId, draft, save, submit }: Props) {
  const t = useTranslations("project");
  const tf = useTranslations("project.fields");
  const ts = useTranslations("save");
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const auto = useAutosave<Body>({
    initialValue: draft.body,
    enabled: true,
    userId,
    scope: `${kind}:${draft.id}`,
    initial: { id: draft.id, revision: draft.revision },
    save: (meta, value) => save({ id: meta.id, revision: meta.revision, body: value }),
  });
  const body = auto.value;
  const setBody = auto.update;

  const onSubmit = async () => {
    const v = validateBody(fields, body, true);
    setErrors(v.errors);
    setSubmitError("");
    if (!v.ok) {
      document.getElementById(`f-${Object.keys(v.errors)[0]}`)?.focus();
      return;
    }
    auto.cancelPending();
    setBusy(true);
    const r = await submit({ id: auto.meta.current.id, revision: auto.meta.current.revision, body }).catch(() => ({ ok: false as const, error: "generic" }));
    setBusy(false);
    if (r.ok) return router.refresh();
    if ("fields" in r && r.fields) setErrors(r.fields);
    setSubmitError(r.error);
    if (r.error === "conflict") auto.setState("conflict");
  };

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSubmit(); }} noValidate>
      {fields.map((f) => {
        const err = errors[f.key];
        const errId = `f-${f.key}-err`;
        const label = <>{tf(f.key as "title")} <span className="text-sm font-normal text-muted">({f.required ? t("required") : t("optional")})</span></>;
        if (f.type === "list" || f.type === "links") {
          const items = (Array.isArray(body[f.key]) ? body[f.key] : []) as string[];
          return (
            <fieldset key={f.key} aria-describedby={err ? errId : undefined}>
              <legend id={`f-${f.key}`} tabIndex={-1} className="label">{label}</legend>
              {f.type === "links" && <p className="hint">{t("linksHelp")}</p>}
              <div className="space-y-2">
                {Array.from({ length: f.count }, (_, i) => (
                  <input key={i} aria-label={`${tf(f.key as "title")} ${i + 1}`} className="field" type={f.type === "links" ? "url" : "text"} inputMode={f.type === "links" ? "url" : undefined}
                    maxLength={f.max} value={items[i] ?? ""} placeholder={f.type === "links" ? "https://" : undefined}
                    onChange={(e) => setBody({ ...body, [f.key]: Array.from({ length: f.count }, (_, j) => (j === i ? e.target.value : items[j] ?? "")) })} />
                ))}
              </div>
              {err && <p id={errId} className="error">{t(`err_${err}` as "err_required")}</p>}
            </fieldset>
          );
        }
        const Tag = f.type === "textarea" ? "textarea" : "input";
        return (
          <div key={f.key}>
            <label className="label" htmlFor={`f-${f.key}`}>{label}</label>
            <Tag id={`f-${f.key}`} className={`field ${f.type === "textarea" ? "min-h-20" : ""}`} maxLength={f.max} value={String(body[f.key] ?? "")}
              aria-invalid={!!err} aria-describedby={err ? errId : undefined}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBody({ ...body, [f.key]: e.target.value })} />
            {err && <p id={errId} className="error">{t(`err_${err}` as "err_required")}</p>}
          </div>
        );
      })}
      {submitError && <p role="alert" className="error">{t(`submit_${submitError}` as "submit_generic")}</p>}
      <div className="card sticky bottom-2 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <p role="status" aria-live="polite" className={`text-sm font-semibold ${["failed", "conflict", "closed"].includes(auto.state) ? "text-bad" : auto.state === "saved" ? "text-ok" : "text-muted"}`}>{ts(auto.state)}</p>
        <div className="flex flex-wrap gap-2">
          {auto.state === "failed" && <button type="button" className="btn btn-sm" onClick={auto.retry}>{ts("retry")}</button>}
          {auto.state === "conflict" && <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>{ts("reloadLatest")}</button>}
          <button type="button" className="btn" onClick={() => void auto.persist()}>{ts("saveNow")}</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t("submitting") : kind === "proposal" ? t("submitProposal") : t("submitMilestone")}</button>
        </div>
      </div>
    </form>
  );
}

"use client";
// Small fixed renderer for the two seeded surveys (not a survey designer).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Question, SurveyContent, Locale } from "@/lib/validation/content";
import { validateAnswers, type Answer, type Answers, type FieldError } from "@/lib/validation/survey";
import { useAutosave } from "@/lib/useAutosave";
import { saveSurveyDraft, submitSurvey } from "./actions";

type Props = {
  userId: string;
  assignmentId: string;
  survey: SurveyContent;
  classmates: { student_id: string; display_name: string }[];
  sessions: { id: string; label: string }[];
  draft: { id: string; revision: number; answers: Answers } | null;
  canWork: boolean;
};

export function SurveyForm({ userId, assignmentId, survey, classmates, sessions, draft, canWork }: Props) {
  const t = useTranslations("survey");
  const ts = useTranslations("save");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  const [submitting, setSubmitting] = useState(false);
  const ctx = { classmateIds: classmates.map((c) => c.student_id), sessionIds: sessions.map((s) => s.id) };

  const auto = useAutosave<Answers>({
    initialValue: draft?.answers ?? {},
    enabled: canWork,
    userId,
    scope: `survey:${assignmentId}`,
    initial: { id: draft?.id ?? null, revision: draft?.revision ?? 0 },
    save: (meta, value) => saveSurveyDraft({ assignmentId, id: meta.id, revision: meta.revision, answers: value }),
  });

  const answers = auto.value;
  const set = (id: string, a: Answer | undefined) => {
    auto.update((prev) => {
      const next = { ...prev };
      if (a === undefined) delete next[id];
      else next[id] = a;
      return next;
    });
  };

  const submit = async () => {
    const local = validateAnswers(survey, answers, ctx, "submit");
    setErrors(local.errors);
    if (!local.ok) {
      document.getElementById(`q-${Object.keys(local.errors)[0]}`)?.focus();
      return;
    }
    auto.cancelPending();
    setSubmitting(true);
    const r = await submitSurvey({ assignmentId, id: auto.meta.current.id, revision: auto.meta.current.revision, answers }).catch(() => ({ ok: false as const, error: "generic" }));
    setSubmitting(false);
    if (r.ok) return router.refresh();
    if ("fields" in r && r.fields) setErrors(r.fields);
    else auto.setState(r.error === "conflict" ? "conflict" : r.error === "closed" ? "closed" : "failed");
  };

  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="error">{t("fixErrors", { count: Object.keys(errors).length })}</p>
      )}
      {survey.questions.map((q) => (
        <QuestionField key={q.id} q={q} locale={locale} value={answers[q.id]} error={errors[q.id]} disabled={!canWork}
          classmates={classmates} sessions={sessions} onChange={(a) => set(q.id, a)} />
      ))}
      {canWork && (
        <div className="card sticky bottom-2 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <p role="status" aria-live="polite" className={`text-sm font-semibold ${["failed", "conflict", "closed"].includes(auto.state) ? "text-bad" : auto.state === "saved" ? "text-ok" : "text-muted"}`}>{ts(auto.state)}</p>
          <div className="flex flex-wrap gap-2">
            {auto.state === "failed" && <button type="button" className="btn btn-sm" onClick={auto.retry}>{ts("retry")}</button>}
            {auto.state === "conflict" && <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>{ts("reloadLatest")}</button>}
            <button type="button" className="btn" onClick={() => void auto.persist()} disabled={auto.state === "saving"}>{ts("saveNow")}</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || auto.state === "closed"}>{submitting ? t("submitting") : t("submit")}</button>
          </div>
        </div>
      )}
    </form>
  );
}

function QuestionField({ q, locale, value, error, disabled, classmates, sessions, onChange }: {
  q: Question; locale: Locale; value: Answer | undefined; error?: FieldError; disabled: boolean;
  classmates: Props["classmates"]; sessions: Props["sessions"]; onChange: (a: Answer | undefined) => void;
}) {
  const t = useTranslations("survey");
  const te = useTranslations("survey.errors");
  const v = (value ?? {}) as Record<string, unknown>;
  const errId = `q-${q.id}-err`;
  const helpId = `q-${q.id}-help`;
  const described = [q.help ? helpId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  const legend = (
    <legend id={`q-${q.id}`} tabIndex={-1} className="label text-base">
      {q.prompt[locale]} <span className="text-sm font-normal text-muted">({q.required ? t("required") : t("optional")})</span>
    </legend>
  );
  const followUp = q.followUp && (!q.followUp.forOption || v.choice === q.followUp.forOption) && (
    <div className="mt-2">
      <label className="label text-sm" htmlFor={`q-${q.id}-text`}>{q.followUp.label[locale]}</label>
      <input id={`q-${q.id}-text`} className="field" maxLength={q.followUp.maxLength} disabled={disabled} value={String(v.text ?? "")}
        onChange={(e) => onChange({ ...(value ?? { choice: "" }), text: e.target.value } as Answer)} />
    </div>
  );
  const choices = (Array.isArray(v.choices) ? v.choices : []) as string[];
  const toggle = (val: string, on: boolean) => {
    const next = on ? [...choices, val] : choices.filter((c) => c !== val);
    onChange(next.length || v.text ? ({ choices: next, ...(v.text ? { text: v.text as string } : {}) } as Answer) : undefined);
  };
  const multiOptions =
    q.type === "multi" ? (q.options ?? []).map((o) => ({ value: o.value, label: o.label[locale] }))
    : q.type === "sessions" ? [...sessions.map((s) => ({ value: s.id, label: s.label })), { value: "unsure", label: t("unsure") }]
    : q.type === "classmates" ? classmates.map((c) => ({ value: c.student_id, label: c.display_name }))
    : [];

  return (
    <fieldset className="card space-y-2" aria-describedby={described} aria-invalid={!!error}>
      {legend}
      {q.help && <p id={helpId} className="hint">{q.help[locale]}</p>}

      {q.type === "single" && (
        <div className="space-y-1">
          {q.options!.map((o) => (
            <label key={o.value} className="flex min-h-11 items-center gap-2">
              <input type="radio" className="size-5" name={q.id} disabled={disabled} checked={v.choice === o.value}
                onChange={() => onChange({ choice: o.value, ...(v.text && (!q.followUp?.forOption || q.followUp.forOption === o.value) ? { text: v.text as string } : {}) })} />
              {o.label[locale]}
            </label>
          ))}
          {!q.required && v.choice !== undefined && <button type="button" className="link text-sm" onClick={() => onChange(undefined)}>{t("clear")}</button>}
        </div>
      )}

      {(q.type === "multi" || q.type === "sessions" || q.type === "classmates") && (
        <div className="space-y-1">
          {q.max && <p className="hint">{t("chooseMax", { max: q.max })}</p>}
          {!multiOptions.length && <p className="hint">{q.type === "sessions" ? t("noSessions") : t("noClassmates")}</p>}
          {multiOptions.map((o) => (
            <label key={o.value} className="flex min-h-11 items-center gap-2">
              <input type="checkbox" className="size-5" disabled={disabled || (!choices.includes(o.value) && !!q.max && choices.length >= q.max)}
                checked={choices.includes(o.value)} onChange={(e) => toggle(o.value, e.target.checked)} />
              {o.label}
            </label>
          ))}
        </div>
      )}

      {q.type === "scale" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md border border-line px-3">
                <input type="radio" className="size-5" name={q.id} disabled={disabled} checked={v.value === n} onChange={() => onChange({ value: n })} />
                {n}
              </label>
            ))}
            {q.scale!.extra.map((o) => (
              <label key={o.value} className="flex min-h-11 items-center gap-2 rounded-md border border-line px-3">
                <input type="radio" className="size-5" name={q.id} disabled={disabled} checked={v.value === o.value} onChange={() => onChange({ value: o.value })} />
                {o.label[locale]}
              </label>
            ))}
          </div>
          <p className="hint">{q.scale!.low[locale]} · {q.scale!.high[locale]}</p>
        </div>
      )}

      {q.type === "text" && (
        <>
          <textarea aria-labelledby={`q-${q.id}`} className="field min-h-20" maxLength={q.max ?? 300} disabled={disabled} value={String(v.text ?? "")}
            onChange={(e) => onChange(e.target.value ? { text: e.target.value } : undefined)} />
          <p className="hint">{t("chars", { n: String(v.text ?? "").length, max: q.max ?? 300 })}</p>
        </>
      )}

      {q.type === "textlist" && (
        <div className="space-y-2">
          {Array.from({ length: q.max ?? 3 }, (_, i) => {
            const items = (Array.isArray(v.items) ? v.items : []) as string[];
            return (
              <div key={i}>
                <label className="label text-sm" htmlFor={`q-${q.id}-${i}`}>{t("item", { n: i + 1 })}</label>
                <input id={`q-${q.id}-${i}`} className="field" maxLength={q.itemMaxLength ?? 120} disabled={disabled} value={items[i] ?? ""}
                  onChange={(e) => {
                    const next = Array.from({ length: q.max ?? 3 }, (_, j) => (j === i ? e.target.value : items[j] ?? ""));
                    while (next.length && !next[next.length - 1]) next.pop();
                    onChange(next.length ? { items: next } : undefined);
                  }} />
              </div>
            );
          })}
        </div>
      )}

      {q.type === "pair" && (
        <div className="grid gap-3 md:grid-cols-2">
          {(["a", "b"] as const).map((k) => (
            <div key={k}>
              <label className="label text-sm" htmlFor={`q-${q.id}-${k}`}>{q.pair![k][locale]}</label>
              <textarea id={`q-${q.id}-${k}`} className="field min-h-20" maxLength={q.pair!.maxLength} disabled={disabled} value={String(v[k] ?? "")}
                onChange={(e) => onChange({ a: String(v.a ?? ""), b: String(v.b ?? ""), [k]: e.target.value } as Answer)} />
            </div>
          ))}
        </div>
      )}

      {followUp}
      {error && <p id={errId} className="error">{te(error)}</p>}
    </fieldset>
  );
}

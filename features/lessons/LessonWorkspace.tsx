"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ActivityConfig, ConfigOf, Evidence, Summary } from "@/exercises/schema";
import { runChecks } from "@/exercises/checks";
import type { LessonContent, Locale } from "@/lib/validation/content";
import { clearLocalDraft, loadLocalDraft } from "@/lib/draft-cache";
import { useAutosave, type SaveOutcome } from "@/lib/useAutosave";
import { saveDraft, submitAttempt, type SaveResult } from "./actions";
import { emptyAnswers, type LessonAnswers } from "./validate";

// Activities are client-only and loaded on demand (separate chunks).
const ActivityHost = dynamic(() => import("./ActivityHost"), { ssr: false });
const SceneComposer = dynamic(() => import("./SceneComposer"), { ssr: false });

type Draft = { id: string; revision: number; evidence: unknown; answers: unknown; mode: "canvas" | "step" } | null;
type Work = { config: ActivityConfig; summary: Summary | null; answers: LessonAnswers; mode: "canvas" | "step" };

function buildEvidence(lesson: LessonContent, w: Work): Evidence | Record<string, never> {
  if (!w.summary) return {};
  const results = runChecks(lesson.checks, w.config, w.summary);
  return { contentVersion: lesson.version, config: w.config, summary: w.summary, checkResults: results.map(({ id, passed }) => ({ id, passed })) };
}

const toOutcome = (r: SaveResult): SaveOutcome => (r.ok ? { ok: true, id: r.attemptId, revision: r.revision } : { ok: false, error: r.error });

export function LessonWorkspace(props: {
  userId: string;
  assignmentId: string;
  lesson: LessonContent;
  draft: Draft;
  canWork: boolean;
}) {
  const { userId, assignmentId, lesson, canWork } = props;
  const t = useTranslations("lesson");
  const ts = useTranslations("save");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const scope = `lesson:${assignmentId}`;
  const initialEvidence = (props.draft?.evidence ?? {}) as Partial<Evidence>;

  const auto = useAutosave<Work>({
    initialValue: {
      config: initialEvidence.config ?? lesson.activity.initialConfig,
      summary: initialEvidence.summary ?? null,
      answers: { ...emptyAnswers, ...((props.draft?.answers as LessonAnswers) ?? {}) },
      mode: props.draft?.mode ?? "canvas",
    },
    enabled: canWork,
    userId,
    scope,
    initial: { id: props.draft?.id ?? null, revision: props.draft?.revision ?? 0 },
    save: async (meta, w) =>
      toOutcome(await saveDraft({ assignmentId, attemptId: meta.id, revision: meta.revision, mode: w.mode, evidence: buildEvidence(lesson, w), answers: w.answers })),
  });
  const { config, summary, answers, mode } = auto.value;
  const patch = (p: Partial<Work>) => auto.update((prev) => ({ ...prev, ...p }));
  const save = auto.state;
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restorable, setRestorable] = useState<Work | null>(null);

  // Offer to restore unsent work after an interruption (same tab session only).
  useEffect(() => {
    const local = loadLocalDraft<Work>(userId, scope);
    // Reading sessionStorage is an external system; it is only available after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (local && canWork) setRestorable(local.value);
  }, [userId, scope, canWork]);

  const submit = async () => {
    setSubmitting(true);
    setFieldErrors([]);
    auto.cancelPending();
    const w = auto.latest.current;
    let result: SaveResult;
    try {
      result = await submitAttempt({ assignmentId, attemptId: auto.meta.current.id, revision: auto.meta.current.revision, mode: w.mode, evidence: buildEvidence(lesson, w), answers: w.answers });
    } catch {
      result = { ok: false, error: "generic" };
    }
    setSubmitting(false);
    setConfirming(false);
    if (result.ok) {
      clearLocalDraft(userId, scope);
      router.refresh();
      return;
    }
    if (result.error === "invalid") setFieldErrors(result.fields ?? ["invalid"]);
    else auto.setState(result.error === "conflict" ? "conflict" : result.error === "closed" ? "closed" : "failed");
  };

  const results = summary ? runChecks(lesson.checks, config, summary) : null;
  const allPassed = results?.every((r) => r.passed) ?? false;
  const err = (f: string) => fieldErrors.includes(f);

  return (
    <div className="space-y-6">
      {restorable && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-md border border-warn/40 bg-warn/10 p-3">
          <span>{ts("restorable")}</span>
          <button type="button" className="btn btn-sm" onClick={() => { auto.update(restorable); setRestorable(null); }}>{ts("restore")}</button>
          <button type="button" className="btn btn-sm" onClick={() => { clearLocalDraft(userId, scope); setRestorable(null); }}>{ts("discard")}</button>
        </div>
      )}

      {lesson.kind === "scene" ? (
        <SceneComposer config={config as ConfigOf<"scene">} onConfig={(c) => patch({ config: c })} onSummary={(sm) => patch({ summary: sm })} readOnly={!canWork} />
      ) : (
        <ActivityHost config={config} onConfig={(c) => patch({ config: c })} onSummary={(sm) => patch({ summary: sm })} readOnly={!canWork} mode={mode} onMode={(m) => patch({ mode: m })} />
      )}

      <section aria-labelledby="checks-h" className="card space-y-2">
        <h3 id="checks-h" className="h3">{t("checks")}</h3>
        {!results ? (
          <p className="text-muted">{t("checksNotRun")}</p>
        ) : (
          <ul className="space-y-1" aria-live="polite">
            {results.map((r) => (
              <li key={r.id} className={r.passed ? "text-ok" : "text-bad"}>
                <span aria-hidden="true">{r.passed ? "✓ " : "✕ "}</span>
                <span className="sr-only">{r.passed ? t("passed") : t("notYet")}: </span>
                {lesson.checkLabels[r.id][locale]}
              </li>
            ))}
          </ul>
        )}
        {allPassed && <p className="rounded-md bg-brand/5 p-2 text-sm">{t("practicePassedNote")}</p>}
        <details>
          <summary className="cursor-pointer text-sm font-semibold">{t("hints")}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">{lesson.activity.hints.map((h, i) => <li key={i}>{h[locale]}</li>)}</ul>
        </details>
      </section>

      <section aria-labelledby="answers-h" className="card space-y-4">
        <h3 id="answers-h" className="h3">{t("yourAnswers")}</h3>
        <fieldset aria-describedby={err("quiz") ? "quiz-err" : undefined}>
          <legend className="label">{lesson.quiz.prompt[locale]}</legend>
          {lesson.quiz.code && <pre tabIndex={0} className="mb-2 overflow-x-auto rounded-md bg-[#1f2430] p-3 text-sm text-[#f4f1ea]"><code>{lesson.quiz.code}</code></pre>}
          <div className="space-y-1">
            {lesson.quiz.options.map((o, i) => (
              <label key={i} className="flex min-h-11 items-center gap-2">
                <input type="radio" name="quiz" className="size-5" checked={answers.quiz === i} disabled={!canWork} onChange={() => patch({ answers: { ...answers, quiz: i } })} />
                <span className="font-mono text-sm [overflow-wrap:anywhere]">{o[locale]}</span>
              </label>
            ))}
          </div>
          {err("quiz") && <p id="quiz-err" className="error">{t("errQuiz")}</p>}
        </fieldset>
        <div>
          <label className="label" htmlFor="reflection">{t("reflection")}</label>
          <p className="hint" id="reflection-q">{lesson.reflection[locale]}</p>
          <textarea id="reflection" className="field min-h-28" maxLength={1500} disabled={!canWork} value={answers.reflection}
            aria-describedby={`reflection-q${err("reflection") ? " reflection-err" : ""}`} aria-invalid={err("reflection")}
            onChange={(e) => patch({ answers: { ...answers, reflection: e.target.value } })} />
          {err("reflection") && <p id="reflection-err" className="error">{t("errText")}</p>}
        </div>
        <div>
          <label className="label" htmlFor="transfer">{t("transferAnswer")}</label>
          <p className="hint" id="transfer-q">{lesson.transfer.question[locale]}</p>
          <textarea id="transfer" className="field min-h-28" maxLength={1500} disabled={!canWork} value={answers.transfer}
            aria-describedby={`transfer-q${err("transfer") ? " transfer-err" : ""}`} aria-invalid={err("transfer")}
            onChange={(e) => patch({ answers: { ...answers, transfer: e.target.value } })} />
          {err("transfer") && <p id="transfer-err" className="error">{t("errText")}</p>}
        </div>
        {err("invalid") && <p role="alert" className="error">{t("errInvalid")}</p>}
      </section>

      {canWork && (
        <div className="card sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <p role="status" aria-live="polite" className={`text-sm font-semibold ${save === "failed" || save === "conflict" || save === "closed" ? "text-bad" : save === "saved" ? "text-ok" : "text-muted"}`}>
            {ts(save)}
          </p>
          <div className="flex flex-wrap gap-2">
            {save === "conflict" && <button type="button" className="btn btn-sm" onClick={() => { window.location.reload(); }}>{ts("reloadLatest")}</button>}
            {save === "failed" && <button type="button" className="btn btn-sm" onClick={auto.retry}>{ts("retry")}</button>}
            <button type="button" className="btn" disabled={save === "saving" || save === "closed"} onClick={() => void auto.persist()}>{ts("saveNow")}</button>
            {!confirming ? (
              <button type="button" className="btn btn-primary" disabled={!summary || save === "closed"} onClick={() => setConfirming(true)}>{t("submit")}</button>
            ) : (
              <span className="flex flex-wrap items-center gap-2" role="group" aria-label={t("confirmSubmit")}>
                <span className="text-sm">{t("confirmSubmit")}</span>
                <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => void submit()}>{submitting ? t("submitting") : t("confirm")}</button>
                <button type="button" className="btn" onClick={() => setConfirming(false)}>{t("cancel")}</button>
              </span>
            )}
          </div>
          {!summary && <p className="hint w-full">{t("runChecksFirst")}</p>}
        </div>
      )}
    </div>
  );
}

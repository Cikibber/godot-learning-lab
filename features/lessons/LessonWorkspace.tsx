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

  const passedCount = results?.filter((r) => r.passed).length ?? 0;
  const SAVE_MARK: Record<string, { mark: string; cls: string }> = {
    idle: { mark: "○", cls: "text-muted" },
    dirty: { mark: "●", cls: "text-warn" },
    saving: { mark: "…", cls: "text-muted" },
    saved: { mark: "✓", cls: "text-ok" },
    failed: { mark: "!", cls: "text-bad" },
    conflict: { mark: "⇄", cls: "text-bad" },
    closed: { mark: "■", cls: "text-bad" },
  };
  const sm = SAVE_MARK[save];

  return (
    <div className="space-y-8">
      {restorable && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-[3px] border border-warn/60 bg-warn/[0.07] p-3">
          <span>{ts("restorable")}</span>
          <button type="button" className="btn btn-sm" onClick={() => { auto.update(restorable); setRestorable(null); }}>{ts("restore")}</button>
          <button type="button" className="btn btn-sm btn-quiet" onClick={() => { clearLocalDraft(userId, scope); setRestorable(null); }}>{ts("discard")}</button>
        </div>
      )}

      <div className="space-y-px">
        {lesson.kind === "scene" ? (
          <SceneComposer config={config as ConfigOf<"scene">} onConfig={(c) => patch({ config: c })} onSummary={(s) => patch({ summary: s })} readOnly={!canWork} />
        ) : (
          <ActivityHost config={config} onConfig={(c) => patch({ config: c })} onSummary={(s) => patch({ summary: s })} readOnly={!canWork} mode={mode} onMode={(m) => patch({ mode: m })} />
        )}

        <section aria-labelledby="checks-h" className="mt-3 overflow-hidden rounded-[3px] border border-line bg-panel">
          <div className="panel-head">
            <h3 id="checks-h">{t("checks")}</h3>
            {results && <span className="font-mono text-xs">{passedCount}/{results.length}</span>}
          </div>
          <div className="panel-body space-y-3">
            {!results ? (
              <p className="text-sm text-muted">{t("checksNotRun")}</p>
            ) : (
              <ul className="space-y-1.5" aria-live="polite">
                {results.map((r) => (
                  <li key={r.id} className="flex gap-2.5 text-sm">
                    <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-[2px] border font-mono text-xs ${r.passed ? "border-ok/70 text-ok" : "border-line-strong text-muted"}`}>{r.passed ? "✓" : "·"}</span>
                    <span className="sr-only">{r.passed ? t("passed") : t("notYet")}: </span>
                    <span className={r.passed ? "text-ink" : "text-muted"}>{lesson.checkLabels[r.id][locale]}</span>
                  </li>
                ))}
              </ul>
            )}
            {allPassed && (
              <p className="rounded-[3px] border border-info/50 bg-info/[0.07] p-2.5 text-sm">
                <span aria-hidden="true" className="mr-1.5 font-mono text-info">◆</span>{t("practicePassedNote")}
              </p>
            )}
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-muted hover:text-ink">{t("hints")}</summary>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-ink/90">{lesson.activity.hints.map((h, i) => <li key={i}>{h[locale]}</li>)}</ul>
            </details>
          </div>
        </section>
      </div>

      <section id="explain" aria-labelledby="answers-h" className="scroll-mt-16 space-y-6">
        <h3 id="answers-h" className="h2">{t("yourAnswers")}</h3>
        <fieldset className="space-y-2" aria-describedby={err("quiz") ? "quiz-err" : undefined}>
          <legend className="label mb-2 max-w-[68ch]">{lesson.quiz.prompt[locale]}</legend>
          {lesson.quiz.code && <pre tabIndex={0} className="codeblock mb-2 max-w-[80ch]"><code>{lesson.quiz.code}</code></pre>}
          <div className="max-w-[68ch] space-y-1.5">
            {lesson.quiz.options.map((o, i) => (
              <label key={i} className={`flex min-h-11 items-center gap-3 rounded-[3px] border px-3 py-2 ${answers.quiz === i ? "border-brand bg-brand/[0.08]" : "border-line hover:border-line-strong"}`}>
                <input type="radio" name="quiz" className="size-4 shrink-0" checked={answers.quiz === i} disabled={!canWork} onChange={() => patch({ answers: { ...answers, quiz: i } })} />
                <span className="font-mono text-sm [overflow-wrap:anywhere]">{o[locale]}</span>
              </label>
            ))}
          </div>
          {err("quiz") && <p id="quiz-err" className="error">{t("errQuiz")}</p>}
        </fieldset>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="label" htmlFor="reflection">{t("reflection")}</label>
            <p className="hint mb-2" id="reflection-q">{lesson.reflection[locale]}</p>
            <textarea id="reflection" className="field min-h-32" maxLength={1500} disabled={!canWork} value={answers.reflection}
              aria-describedby={`reflection-q${err("reflection") ? " reflection-err" : ""}`} aria-invalid={err("reflection")}
              onChange={(e) => patch({ answers: { ...answers, reflection: e.target.value } })} />
            {err("reflection") && <p id="reflection-err" className="error">{t("errText")}</p>}
          </div>
          <div>
            <label className="label" htmlFor="transfer">{t("transferAnswer")}</label>
            <p className="hint mb-2" id="transfer-q">{lesson.transfer.question[locale]}</p>
            <textarea id="transfer" className="field min-h-32" maxLength={1500} disabled={!canWork} value={answers.transfer}
              aria-describedby={`transfer-q${err("transfer") ? " transfer-err" : ""}`} aria-invalid={err("transfer")}
              onChange={(e) => patch({ answers: { ...answers, transfer: e.target.value } })} />
            {err("transfer") && <p id="transfer-err" className="error">{t("errText")}</p>}
          </div>
        </div>
        {err("invalid") && <p role="alert" className="error">{t("errInvalid")}</p>}
      </section>

      {canWork && (
        <div className="-mx-4 border-t border-line-strong bg-recess px-4 py-3 sm:sticky sm:bottom-0 sm:z-10 sm:mx-0 sm:rounded-[3px] sm:border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" aria-live="polite" className={`flex items-center gap-2 text-sm font-semibold ${sm.cls}`}>
              <span aria-hidden="true" className="font-mono">{sm.mark}</span>
              {ts(save)}
            </p>
            <div className="flex flex-wrap gap-2">
              {save === "conflict" && <button type="button" className="btn btn-sm" onClick={() => { window.location.reload(); }}>{ts("reloadLatest")}</button>}
              {save === "failed" && <button type="button" className="btn btn-sm" onClick={auto.retry}>{ts("retry")}</button>}
              <button type="button" className="btn" disabled={save === "saving" || save === "closed"} onClick={() => void auto.persist()}>{ts("saveNow")}</button>
              {!confirming && (
                <button type="button" className="btn btn-primary" disabled={!summary || save === "closed"} onClick={() => setConfirming(true)}>{t("submit")}</button>
              )}
            </div>
          </div>
          {confirming && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3" role="group" aria-label={t("confirmSubmit")}>
              <span className="mr-auto text-sm">{t("confirmSubmit")}</span>
              <button type="button" className="btn btn-quiet" onClick={() => setConfirming(false)}>{t("cancel")}</button>
              <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => void submit()}>{submitting ? t("submitting") : t("confirm")}</button>
            </div>
          )}
          {!summary && <p className="hint">{t("runChecksFirst")}</p>}
        </div>
      )}
    </div>
  );
}

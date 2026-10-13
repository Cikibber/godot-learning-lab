"use client";
// Owns a draft value and saves it: debounced + explicit, acknowledgement-based
// status, optimistic concurrency (revision), bounded retry, and a
// session-scoped local copy. All state changes happen in event handlers.
import { useCallback, useEffect, useRef, useState } from "react";
import { clearLocalDraft, saveLocalDraft } from "@/lib/draft-cache";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "failed" | "conflict" | "closed";
export type SaveOutcome = { ok: true; id: string; revision: number } | { ok: false; error: "conflict" | "closed" | "invalid" | "unauthorized" | "generic" };
export type DraftMeta = { id: string | null; revision: number };

const MAX_RETRIES = 3;

export function useAutosave<T>(opts: {
  initialValue: T;
  enabled: boolean;
  userId: string;
  scope: string;
  initial: DraftMeta;
  save: (meta: DraftMeta, value: T) => Promise<SaveOutcome>;
  delayMs?: number;
}) {
  const { enabled, userId, scope, save, delayMs = 4000 } = opts;
  const [value, setValue] = useState<T>(opts.initialValue);
  const [state, setState] = useState<SaveState>("idle");
  const meta = useRef<DraftMeta>(opts.initial);
  const latest = useRef<T>(opts.initialValue);
  const timer = useRef<number | undefined>(undefined);
  const retries = useRef(0);

  const persist = useCallback(async (): Promise<void> => {
    window.clearTimeout(timer.current);
    if (!enabled) return;
    setState("saving");
    let r: SaveOutcome;
    try {
      r = await save(meta.current, latest.current);
    } catch {
      r = { ok: false, error: "generic" };
    }
    if (r.ok) {
      meta.current = { id: r.id, revision: r.revision };
      retries.current = 0;
      clearLocalDraft(userId, scope);
      setState("saved");
      return;
    }
    if (r.error === "conflict" || r.error === "closed") {
      setState(r.error);
      return;
    }
    setState("failed");
    if (retries.current < MAX_RETRIES) {
      retries.current++;
      timer.current = window.setTimeout(() => document.dispatchEvent(new CustomEvent(`gll-retry:${scope}`)), 2000 * 2 ** retries.current);
    }
  }, [enabled, save, userId, scope]);

  // Retries are triggered through an event so the callback never references itself.
  useEffect(() => {
    const onRetry = () => void persist();
    document.addEventListener(`gll-retry:${scope}`, onRetry);
    return () => document.removeEventListener(`gll-retry:${scope}`, onRetry);
  }, [persist, scope]);

  /** Call from event handlers to change the draft. */
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const v = typeof next === "function" ? (next as (p: T) => T)(latest.current) : next;
      latest.current = v;
      setValue(v);
      if (!enabled) return;
      saveLocalDraft(userId, scope, v);
      setState((s) => (s === "conflict" || s === "closed" ? s : "dirty"));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void persist(), delayMs);
    },
    [enabled, userId, scope, persist, delayMs],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (state === "dirty" || state === "saving" || state === "failed") e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [state]);

  return {
    value,
    update,
    state,
    setState,
    persist,
    meta,
    latest,
    retry: () => {
      retries.current = 0;
      void persist();
    },
    cancelPending: () => window.clearTimeout(timer.current),
  };
}

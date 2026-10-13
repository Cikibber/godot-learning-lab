"use client";
// Hosts one time-based simulation. Per-frame state lives in the Sim object
// and the Canvas; React only shows a bounded HUD refreshed a few times a
// second, plus meaningful phase changes announced to screen readers.
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { InputState, WORLD_H, WORLD_W, runStepAction, type Action, type Sim } from "@/exercises/runtime/core";
import { createLoop, setupCanvas } from "@/exercises/runtime/loop";
import { SIM_LOADERS, keymap, type LoadedSim } from "@/exercises/registry";
import type { ActivityConfig, Summary } from "@/exercises/schema";
import type { Locale } from "@/lib/validation/content";
import { ActivityParams } from "./ActivityParams";

type Props = {
  config: ActivityConfig;
  onConfig: (c: ActivityConfig) => void;
  onSummary: (s: Summary) => void;
  readOnly: boolean;
  mode: "canvas" | "step";
  onMode: (m: "canvas" | "step") => void;
};

type SimLike = Sim & { configure(c: ActivityConfig): void };

const PAD: { action: Action; label: string; key: "left" | "right" | "up" | "down" }[] = [
  { action: "move_up", label: "▲", key: "up" },
  { action: "move_left", label: "◀", key: "left" },
  { action: "move_right", label: "▶", key: "right" },
  { action: "move_down", label: "▼", key: "down" },
];

export default function ActivityHost({ config, onConfig, onSummary, readOnly, mode, onMode }: Props) {
  const t = useTranslations("activity");
  const locale = useLocale() as Locale;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimLike | null>(null);
  const loopRef = useRef<ReturnType<typeof createLoop> | null>(null);
  const inputRef = useRef(new InputState());
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const fpsRef = useRef<30 | 60>(60);
  const configRef = useRef(config);
  const [loaded, setLoaded] = useState<LoadedSim | null>(null);
  const [running, setRunning] = useState(false);
  const [hud, setHud] = useState<Record<string, string | number>>({});
  const [trace, setTrace] = useState<string[]>([]);
  const [announce, setAnnounce] = useState("");
  const [description, setDescription] = useState("");
  const [fps, setFps] = useState<30 | 60>(60);
  const [focused, setFocused] = useState(false);
  const lastPhase = useRef("");

  const render = useCallback(() => {
    if (simRef.current && ctxRef.current) simRef.current.render(ctxRef.current);
  }, []);

  const refreshHtml = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    setHud(sim.hud());
    setTrace(sim.trace());
    const phase = sim.phase();
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      setAnnounce(t(`phase.${phase}` as "phase.playing"));
    }
  }, [t]);

  // Load the activity chunk and build the simulation once.
  useEffect(() => {
    let cancelled = false;
    if (config.kind === "scene") return;
    SIM_LOADERS[config.kind]().then((mod) => {
      if (cancelled) return;
      simRef.current = mod.create(configRef.current);
      setLoaded(mod);
    });
    return () => {
      cancelled = true;
    };
    // The kind never changes for a mounted lesson.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canvas + loop lifecycle with complete teardown.
  useEffect(() => {
    if (!loaded || !canvasRef.current) return;
    ctxRef.current = setupCanvas(canvasRef.current, WORLD_W, WORLD_H);
    const input = inputRef.current;
    const loop = createLoop({
      step: (dt) => {
        simRef.current?.step(dt, input);
        input.endStep();
      },
      render,
      renderFps: () => fpsRef.current,
    });
    loopRef.current = loop;
    render();
    refreshHtml();
    const hudTimer = window.setInterval(() => loop.running && refreshHtml(), 250);
    const onVisibility = () => {
      if (document.hidden) {
        input.clear();
        loop.stop();
        setRunning(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      loop.stop();
      window.clearInterval(hudTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      input.clear();
    };
  }, [loaded, render, refreshHtml]);

  // Parameter changes apply live without rebuilding the simulation.
  useEffect(() => {
    configRef.current = config;
    simRef.current?.configure(config);
    if (!loopRef.current?.running) {
      render();
      refreshHtml();
    }
  }, [config, render, refreshHtml]);

  const start = () => {
    loopRef.current?.start();
    setRunning(true);
    canvasRef.current?.focus();
  };
  const pause = () => {
    loopRef.current?.stop();
    inputRef.current.clear();
    setRunning(false);
    refreshHtml();
  };
  const reset = () => {
    simRef.current?.reset();
    inputRef.current.clear();
    render();
    refreshHtml();
    setDescription(simRef.current?.describe(locale) ?? "");
  };
  const check = () => {
    const sim = simRef.current;
    if (!sim) return;
    pause();
    onSummary(sim.summary());
  };

  const keys = keymap(config);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
      return;
    }
    const action = keys[e.code];
    if (!action) return;
    e.preventDefault(); // only while the canvas has focus
    if (!loopRef.current?.running) start();
    inputRef.current.down(action);
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    const action = keys[e.code];
    if (action) inputRef.current.up(action);
  };

  const doStep = (stepId: string) => {
    const sim = simRef.current;
    const step = loaded?.steps.find((s) => s.id === stepId);
    if (!sim || !step) return;
    runStepAction(sim, inputRef.current, step);
    render();
    refreshHtml();
    setDescription(sim.describe(locale));
  };

  if (!loaded) return <p role="status" className="panel panel-body text-muted">{t("loading")}</p>;

  const glyph = (g: string) => <span aria-hidden="true" className="font-mono text-xs">{g}</span>;
  const hasRestart = config.kind === "state" || config.kind === "loop" || config.kind === "timer";

  return (
    <div className="overflow-hidden rounded-[6px] border border-line-strong bg-recess">
      {/* Toolbar: transport, check, mode, render rate */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-raised px-2 py-2 sm:px-3">
        {mode === "canvas" && (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("transport")}>
            {running ? (
              <button type="button" className="btn btn-sm" onClick={pause}>{glyph("❚❚")}{t("pause")}</button>
            ) : (
              <button type="button" className="btn btn-sm border-brand/70 text-brand" onClick={start}>{glyph("▶")}{t("start")}</button>
            )}
            <button type="button" className="btn btn-sm" onClick={reset}>{glyph("↺")}{t("reset")}</button>
            {hasRestart && (
              <button type="button" className="btn btn-sm" onClick={() => { inputRef.current.down("restart"); simRef.current?.step(1 / 60, inputRef.current); inputRef.current.endStep(); inputRef.current.up("restart"); render(); refreshHtml(); }}>{t("restart")}</button>
            )}
          </div>
        )}
        <button type="button" className="btn btn-sm btn-primary" onClick={check}>{glyph("✓")}{t("check")}</button>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {mode === "canvas" && (
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" className="size-4" checked={fps === 30} onChange={(e) => { const v = e.target.checked ? 30 : 60; fpsRef.current = v; setFps(v); }} />
              {t("lowRender")}
            </label>
          )}
          <div className="flex overflow-hidden rounded-[3px] border border-line-strong" role="group" aria-label={t("modeLabel")}>
            <button type="button" className={`min-h-9 px-3 text-xs font-semibold ${mode === "canvas" ? "bg-brand text-on-brand" : "bg-recess text-muted hover:text-ink"}`} aria-pressed={mode === "canvas"} onClick={() => onMode("canvas")}>{t("modeCanvas")}</button>
            <button type="button" className={`min-h-9 border-l border-line-strong px-3 text-xs font-semibold ${mode === "step" ? "bg-brand text-on-brand" : "bg-recess text-muted hover:text-ink"}`} aria-pressed={mode === "step"} onClick={() => { pause(); onMode("step"); setDescription(simRef.current?.describe(locale) ?? ""); }}>{t("modeStep")}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-line lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-3 bg-recess p-2 sm:p-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span className="font-[family-name:var(--font-display)] text-sm font-semibold [font-stretch:87.5%]">{t("viewport")}</span>
            <span className={focused ? "text-brand" : ""}>{focused ? t("focusOn") : t("focusOff")}</span>
          </div>
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-label={t("canvasLabel")}
            aria-describedby="activity-status"
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); inputRef.current.clear(); }}
            className={`block aspect-video w-full rounded-[2px] border bg-recess ${focused ? "border-brand" : "border-line"}`}
          />

          {mode === "canvas" ? (
            <div className="flex flex-wrap items-start gap-4">
              {/* On-screen controls: hold with pointer/touch. Keyboard users use arrows on the canvas or Step mode. */}
              <div className="grid w-40 grid-cols-3 gap-1" aria-label={t("pad")} role="group">
                {PAD.map((p) => (
                  <button
                    key={p.action}
                    type="button"
                    aria-label={t(`dir.${p.key}`)}
                    className={`btn min-h-11 select-none touch-none px-0 text-base ${p.key === "up" ? "col-start-2" : p.key === "left" ? "col-start-1 row-start-2" : p.key === "right" ? "col-start-3 row-start-2" : "col-start-2 row-start-3"}`}
                    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); if (!loopRef.current?.running) start(); inputRef.current.down(p.action); }}
                    onPointerUp={() => inputRef.current.up(p.action)}
                    onPointerCancel={() => inputRef.current.up(p.action)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {p.label}
                  </button>
                ))}
                {config.kind === "input" && (
                  <button type="button" className="btn col-span-3 min-h-11 touch-none"
                    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); if (!loopRef.current?.running) start(); inputRef.current.down("dash"); }}
                    onPointerUp={() => inputRef.current.up("dash")} onPointerCancel={() => inputRef.current.up("dash")}>
                    {t("dash")}
                  </button>
                )}
              </div>
              <p className="max-w-xs text-sm text-muted">{t("keysHelp")}</p>
            </div>
          ) : (
            <div className="space-y-3 rounded-[3px] border border-line bg-panel p-3">
              <p className="text-sm text-muted">{t("stepHelp")}</p>
              <div className="flex flex-wrap gap-2">
                {loaded.steps.map((s) => (
                  <button key={s.id} type="button" className="btn btn-sm" onClick={() => doStep(s.id)}>{s.label[locale]}</button>
                ))}
                <button type="button" className="btn btn-sm btn-quiet" onClick={reset}>{glyph("↺")}{t("reset")}</button>
              </div>
              <p aria-live="polite" className="min-h-12 rounded-[2px] border border-line bg-recess p-3 font-mono text-sm leading-relaxed">{description}</p>
            </div>
          )}
        </div>

        <aside className="divide-y divide-line bg-panel" aria-label={t("dock")}>
          <section className="bg-panel">
            <h3 className="panel-head">{t("parameters")}</h3>
            <div className="panel-body">
              <ActivityParams config={config} onChange={onConfig} disabled={readOnly} />
            </div>
          </section>
          <section className="bg-panel" id="activity-status">
            <h3 className="panel-head">{t("status")}</h3>
            <dl className="panel-body grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {Object.entries(hud).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{t.has(`hud.${k}` as never) ? t(`hud.${k}` as never) : k}</dt>
                  <dd className="text-right font-mono font-semibold tabular-nums">{String(v)}</dd>
                </div>
              ))}
            </dl>
            <p className="sr-only" aria-live="polite">{announce}</p>
          </section>
          {trace.length > 0 && (
            <section className="bg-panel">
              <h3 className="panel-head">{t("trace")}</h3>
              <ol className="panel-body max-h-48 space-y-0.5 overflow-y-auto font-mono text-xs text-muted" tabIndex={0} aria-label={t("trace")}>
                {trace.map((line, i) => <li key={i} className={i === trace.length - 1 ? "text-ink" : ""}>{line}</li>)}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

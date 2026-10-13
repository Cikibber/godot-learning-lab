"use client";
// Bounded parameter controls per activity. Each control maps to one field of
// the validated config; there is no free-form or executable input.
import { useId } from "react";
import { useTranslations } from "next-intl";
import { ACTIONS, type ActivityConfig } from "@/exercises/schema";

type Props<C extends ActivityConfig = ActivityConfig> = { config: C; onChange: (c: C) => void; disabled?: boolean };

function Slider({ label, value, min, max, step = 1, unit, onChange, disabled }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>{label}: <output htmlFor={id} className="font-mono text-brand">{value}{unit}</output></label>
      <input id={id} type="range" className="w-full" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-2 font-semibold">
      <input type="checkbox" className="size-5" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Select<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <select id={id} className="field" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function ActivityParams({ config, onChange, disabled }: Props) {
  const t = useTranslations("activity.params");
  const set = (k: string, v: unknown) => onChange({ ...config, [k]: v } as ActivityConfig);
  const d = disabled;
  switch (config.kind) {
    case "movement":
      return (
        <div className="space-y-3">
          <Slider label={t("speed")} unit=" px/s" value={config.speed} min={40} max={400} step={10} disabled={d} onChange={(v) => set("speed", v as never)} />
          <Toggle label={t("useDelta")} checked={config.useDelta} disabled={d} onChange={(v) => set("useDelta", v as never)} />
        </div>
      );
    case "collision":
      return (
        <fieldset className="space-y-2">
          <legend className="label">{t("mask")}</legend>
          <Toggle label={t("maskWalls")} checked={config.maskWalls} disabled={d} onChange={(v) => set("maskWalls", v as never)} />
          <Toggle label={t("maskWater")} checked={config.maskWater} disabled={d} onChange={(v) => set("maskWater", v as never)} />
          <Slider label={t("speed")} unit=" px/s" value={config.speed} min={60} max={300} step={10} disabled={d} onChange={(v) => set("speed", v as never)} />
        </fieldset>
      );
    case "input":
      return (
        <div className="space-y-3">
          <Toggle label={t("normalize")} checked={config.normalizeDiagonal} disabled={d} onChange={(v) => set("normalizeDiagonal", v as never)} />
          <Select label={t("dashMode")} value={config.dashMode} disabled={d} onChange={(v) => set("dashMode", v as never)}
            options={[{ value: "held", label: t("held") }, { value: "just_pressed", label: t("justPressed") }]} />
          <Select label={t("dashKey")} value={config.dashKey} disabled={d} onChange={(v) => set("dashKey", v as never)}
            options={[{ value: "Space", label: t("keySpace") }, { value: "KeyJ", label: "J" }]} />
        </div>
      );
    case "signals":
      return (
        <div className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="label">{t("connections")}</legend>
            {(Object.keys(config.connections) as (keyof typeof config.connections)[]).map((sig) => (
              <Select key={sig} label={sig} value={config.connections[sig]} disabled={d}
                onChange={(v) => onChange({ ...config, connections: { ...config.connections, [sig]: v } })}
                options={ACTIONS.map((a) => ({ value: a, label: t(`action_${a}`) }))} />
            ))}
          </fieldset>
          <Slider label={t("coinsRequired")} value={config.coinsRequired} min={1} max={5} disabled={d} onChange={(v) => set("coinsRequired", v as never)} />
          <Toggle label={t("emitOverlap")} checked={config.emitWhileOverlapping} disabled={d} onChange={(v) => set("emitWhileOverlapping", v as never)} />
        </div>
      );
    case "state":
      return (
        <div className="space-y-3">
          <Slider label={t("lives")} value={config.lives} min={1} max={5} disabled={d} onChange={(v) => set("lives", v as never)} />
          <Slider label={t("goal")} value={config.goal} min={1} max={10} disabled={d} onChange={(v) => set("goal", v as never)} />
          <fieldset className="space-y-1">
            <legend className="label">{t("restartResets")}</legend>
            <Toggle label={t("resetScore")} checked={config.resetScoreOnRestart} disabled={d} onChange={(v) => set("resetScoreOnRestart", v as never)} />
            <Toggle label={t("resetLives")} checked={config.resetLivesOnRestart} disabled={d} onChange={(v) => set("resetLivesOnRestart", v as never)} />
          </fieldset>
        </div>
      );
    case "timer":
      return (
        <div className="space-y-3">
          <Slider label={t("countdown")} unit=" s" value={config.countdownSeconds} min={10} max={60} step={5} disabled={d} onChange={(v) => set("countdownSeconds", v as never)} />
          <Toggle label={t("oneShot")} checked={config.countdownOneShot} disabled={d} onChange={(v) => set("countdownOneShot", v as never)} />
          <Slider label={t("spawnInterval")} unit=" s" value={config.spawnInterval} min={0.5} max={5} step={0.5} disabled={d} onChange={(v) => set("spawnInterval", v as never)} />
          <Toggle label={t("capEnabled")} checked={config.capEnabled} disabled={d} onChange={(v) => set("capEnabled", v as never)} />
          <Slider label={t("maxEntities")} value={config.maxEntities} min={1} max={30} disabled={d || !config.capEnabled} onChange={(v) => set("maxEntities", v as never)} />
        </div>
      );
    case "loop":
      return (
        <div className="space-y-3">
          <Select label={t("exitRule")} value={config.exitRule} disabled={d} onChange={(v) => set("exitRule", v as never)}
            options={[
              { value: "score_gt_zero", label: "coins_collected > 0" },
              { value: "always", label: "true" },
              { value: "score_ge_total", label: "coins_collected >= coins_total" },
            ]} />
          <Select label={t("restartRule")} value={config.restartRule} disabled={d} onChange={(v) => set("restartRule", v as never)}
            options={[{ value: "keep_coins", label: t("keepCoins") }, { value: "reset_coins", label: t("resetCoins") }]} />
          <Slider label={t("lives")} value={config.lives} min={1} max={5} disabled={d} onChange={(v) => set("lives", v as never)} />
        </div>
      );
    case "scene":
      return null;
  }
}

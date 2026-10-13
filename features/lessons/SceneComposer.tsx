"use client";
// Scene Composer: hierarchy editing with buttons and selects only (no drag).
// The Canvas is a picture of the same state that the HTML tree describes.
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { WORLD_H, WORLD_W } from "@/exercises/runtime/core";
import { setupCanvas } from "@/exercises/runtime/loop";
import { SCENE_NODE_TYPES, type ConfigOf, type Summary } from "@/exercises/schema";
import { globalPosition } from "@/exercises/checks";
import { MAX_NODES, addNode, isDescendant, moveNode, removeNode, renderScene, reparent, treeOrder } from "@/exercises/sims/scene";

type Cfg = ConfigOf<"scene">;

export default function SceneComposer({ config, onConfig, onSummary, readOnly }: { config: Cfg; onConfig: (c: Cfg) => void; onSummary: (s: Summary) => void; readOnly: boolean }) {
  const t = useTranslations("activity.scene");
  const ta = useTranslations("activity");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [selected, setSelected] = useState<string>(config.nodes[0]?.id ?? "");
  const [newType, setNewType] = useState<(typeof SCENE_NODE_TYPES)[number]>("CollisionShape2D");
  const [announce, setAnnounce] = useState("");
  // Globals stay hidden until the student predicts and checks (or reveals).
  const [showGlobal, setShowGlobal] = useState(false);
  const ids = { parent: useId(), type: useId(), px: useId(), py: useId() };

  useEffect(() => {
    if (canvasRef.current) ctxRef.current = setupCanvas(canvasRef.current, WORLD_W, WORLD_H);
  }, []);
  useEffect(() => {
    if (ctxRef.current) renderScene(ctxRef.current, config, selected, showGlobal);
  }, [config, selected, showGlobal]);

  const node = config.nodes.find((n) => n.id === selected);
  const update = (next: Cfg, message: string) => {
    onConfig(next);
    setAnnounce(message);
  };
  const g = node ? globalPosition(config.nodes, node.id) : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <div className="space-y-3">
        <canvas ref={canvasRef} role="img" aria-label={t("canvasLabel")} className="aspect-video w-full rounded-md border-2 border-line bg-[#f4f1ea]" />
        <div className="card">
          <h3 className="h3">{t("tree")}</h3>
          <ul className="mt-2 space-y-1" aria-label={t("tree")}>
            {treeOrder(config.nodes).map(({ node: n, depth }) => {
              const gp = globalPosition(config.nodes, n.id);
              return (
                <li key={n.id} style={{ paddingInlineStart: `${depth * 1.25}rem` }}>
                  <button type="button" aria-pressed={n.id === selected} onClick={() => setSelected(n.id)}
                    className={`w-full rounded px-2 py-1 text-left text-sm ${n.id === selected ? "bg-brand text-white" : "hover:bg-ink/5"}`}>
                    {depth > 0 && <span aria-hidden="true">└ </span>}
                    <span className="font-semibold">{n.name}</span> <span className="opacity-80">({n.type})</span>
                    <span className="block text-xs opacity-80">{showGlobal ? t("localGlobal", { lx: n.x, ly: n.y, gx: gp?.x ?? 0, gy: gp?.y ?? 0 }) : t("localOnly", { lx: n.x, ly: n.y })}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <aside className="space-y-4">
        {node && (
          <div className="card space-y-3">
            <h3 className="h3">{t("selected", { name: node.name })}</h3>
            <div>
              <label className="label" htmlFor={ids.parent}>{t("parent")}</label>
              <select id={ids.parent} className="field" value={node.parent ?? ""} disabled={readOnly}
                onChange={(e) => update(reparent(config, node.id, e.target.value || null), t("movedUnder", { name: node.name }))}>
                <option value="">{t("root")}</option>
                {config.nodes.filter((p) => p.id !== node.id && !isDescendant(config.nodes, p.id, node.id)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="label">{t("move")}</legend>
              <div className="flex flex-wrap gap-1">
                {([[-10, 0, "◀ x−10"], [10, 0, "x+10 ▶"], [0, -10, "▲ y−10"], [0, 10, "y+10 ▼"]] as const).map(([dx, dy, label]) => (
                  <button key={label} type="button" className="btn btn-sm" disabled={readOnly} onClick={() => update(moveNode(config, node.id, dx, dy), t("position", { name: node.name, x: node.x + dx, y: node.y + dy }))}>{label}</button>
                ))}
              </div>
            </fieldset>
            <p className="text-sm">{showGlobal ? t("localGlobal", { lx: node.x, ly: node.y, gx: g?.x ?? 0, gy: g?.y ?? 0 }) : t("localOnly", { lx: node.x, ly: node.y })}</p>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-5" checked={showGlobal} onChange={(e) => setShowGlobal(e.target.checked)} />{t("showGlobal")}</label>
            <button type="button" className="btn btn-sm btn-danger" disabled={readOnly || config.nodes.length <= 1}
              onClick={() => { const next = removeNode(config, node.id); update(next, t("removed", { name: node.name })); setSelected(next.nodes[0]?.id ?? ""); }}>
              {t("remove")}
            </button>
          </div>
        )}
        <div className="card space-y-3">
          <h3 className="h3">{t("add")}</h3>
          <div>
            <label className="label" htmlFor={ids.type}>{t("type")}</label>
            <select id={ids.type} className="field" value={newType} disabled={readOnly} onChange={(e) => setNewType(e.target.value as typeof newType)}>
              {SCENE_NODE_TYPES.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-sm" disabled={readOnly || config.nodes.length >= MAX_NODES}
            onClick={() => update(addNode(config, newType, node?.id ?? null), t("added", { type: newType, parent: node?.name ?? t("root") }))}>
            {t("addUnder", { parent: node?.name ?? t("root") })}
          </button>
          <p className="hint">{t("limit", { max: MAX_NODES })}</p>
        </div>
        <div className="card space-y-3">
          <h3 className="h3">{t("predict")}</h3>
          <p className="text-sm">{t("predictHelp")}</p>
          <div className="flex gap-2">
            <div>
              <label className="label" htmlFor={ids.px}>x</label>
              <input id={ids.px} className="field w-24" type="number" min={-2000} max={2000} disabled={readOnly} value={config.prediction?.x ?? ""}
                onChange={(e) => onConfig({ ...config, prediction: { x: Math.round(Number(e.target.value) || 0), y: config.prediction?.y ?? 0 } })} />
            </div>
            <div>
              <label className="label" htmlFor={ids.py}>y</label>
              <input id={ids.py} className="field w-24" type="number" min={-2000} max={2000} disabled={readOnly} value={config.prediction?.y ?? ""}
                onChange={(e) => onConfig({ ...config, prediction: { x: config.prediction?.x ?? 0, y: Math.round(Number(e.target.value) || 0) } })} />
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-primary w-full" onClick={() => { setShowGlobal(true); onSummary({ nodes: config.nodes.length }); }}>{ta("check")}</button>
        <p className="sr-only" aria-live="polite">{announce}</p>
      </aside>
    </div>
  );
}

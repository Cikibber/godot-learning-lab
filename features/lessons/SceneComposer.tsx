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
    <div className="overflow-hidden rounded-[6px] border border-line-strong bg-recess">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-raised px-2 py-2 sm:px-3">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => { setShowGlobal(true); onSummary({ nodes: config.nodes.length }); }}>
          <span aria-hidden="true" className="font-mono text-xs">✓</span>{ta("check")}
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" className="size-4" checked={showGlobal} onChange={(e) => setShowGlobal(e.target.checked)} />
          {t("showGlobal")}
        </label>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-line lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid gap-px bg-line md:grid-cols-[15rem_minmax(0,1fr)]">
          <section className="bg-panel" aria-labelledby="tree-h">
            <h3 id="tree-h" className="panel-head">{t("tree")}</h3>
            <ul className="space-y-0.5 p-2" aria-labelledby="tree-h">
              {treeOrder(config.nodes).map(({ node: n, depth }) => {
                const gp = globalPosition(config.nodes, n.id);
                return (
                  <li key={n.id} style={{ paddingInlineStart: `${depth * 1}rem` }}>
                    <button type="button" aria-pressed={n.id === selected} onClick={() => setSelected(n.id)}
                      className={`w-full rounded-[2px] border px-2 py-1 text-left text-sm ${n.id === selected ? "border-brand bg-brand/15 text-ink" : "border-transparent hover:bg-raised"}`}>
                      {depth > 0 && <span aria-hidden="true" className="text-line-strong">└ </span>}
                      <span className="font-semibold">{n.name}</span> <span className="font-mono text-xs text-muted">{n.type}</span>
                      <span className="block font-mono text-xs text-muted">{showGlobal ? t("localGlobal", { lx: n.x, ly: n.y, gx: gp?.x ?? 0, gy: gp?.y ?? 0 }) : t("localOnly", { lx: n.x, ly: n.y })}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <div className="space-y-2 bg-recess p-2 sm:p-3">
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-muted [font-stretch:87.5%]">{ta("viewport")}</p>
            <canvas ref={canvasRef} role="img" aria-label={t("canvasLabel")} className="block aspect-video w-full rounded-[2px] border border-line bg-recess" />
          </div>
        </div>

        <aside className="divide-y divide-line bg-panel" aria-label={ta("dock")}>
          {node && (
            <section className="bg-panel" aria-labelledby="inspector-h">
              <h3 id="inspector-h" className="panel-head">{t("selected", { name: node.name })}</h3>
              <div className="panel-body space-y-3">
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
                  <div className="grid grid-cols-2 gap-1">
                    {([[-10, 0, "◀ x−10"], [10, 0, "x+10 ▶"], [0, -10, "▲ y−10"], [0, 10, "y+10 ▼"]] as const).map(([dx, dy, label]) => (
                      <button key={label} type="button" className="btn btn-sm px-2 font-mono" disabled={readOnly} onClick={() => update(moveNode(config, node.id, dx, dy), t("position", { name: node.name, x: node.x + dx, y: node.y + dy }))}>{label}</button>
                    ))}
                  </div>
                </fieldset>
                <p className="font-mono text-xs text-muted">{showGlobal ? t("localGlobal", { lx: node.x, ly: node.y, gx: g?.x ?? 0, gy: g?.y ?? 0 }) : t("localOnly", { lx: node.x, ly: node.y })}</p>
                <button type="button" className="btn btn-sm btn-danger" disabled={readOnly || config.nodes.length <= 1}
                  onClick={() => { const next = removeNode(config, node.id); update(next, t("removed", { name: node.name })); setSelected(next.nodes[0]?.id ?? ""); }}>
                  {t("remove")}
                </button>
              </div>
            </section>
          )}
          <section className="bg-panel" aria-labelledby="add-h">
            <h3 id="add-h" className="panel-head">{t("add")}</h3>
            <div className="panel-body space-y-3">
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
          </section>
          <section className="bg-panel" aria-labelledby="predict-h">
            <h3 id="predict-h" className="panel-head">{t("predict")}</h3>
            <div className="panel-body space-y-3">
              <p className="text-sm text-muted">{t("predictHelp")}</p>
              <div className="flex gap-2">
                <div>
                  <label className="label font-mono" htmlFor={ids.px}>x</label>
                  <input id={ids.px} className="field w-24 font-mono" type="number" min={-2000} max={2000} disabled={readOnly} value={config.prediction?.x ?? ""}
                    onChange={(e) => onConfig({ ...config, prediction: { x: Math.round(Number(e.target.value) || 0), y: config.prediction?.y ?? 0 } })} />
                </div>
                <div>
                  <label className="label font-mono" htmlFor={ids.py}>y</label>
                  <input id={ids.py} className="field w-24 font-mono" type="number" min={-2000} max={2000} disabled={readOnly} value={config.prediction?.y ?? ""}
                    onChange={(e) => onConfig({ ...config, prediction: { x: config.prediction?.x ?? 0, y: Math.round(Number(e.target.value) || 0) } })} />
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </div>
  );
}

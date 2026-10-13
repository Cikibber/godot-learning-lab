// Scene Composer: a small teaching tree edited with buttons/selects only.
import type { ConfigOf, SceneNode } from "../schema";
import { SCENE_NODE_TYPES } from "../schema";
import { globalPosition } from "../checks";
import { C, clear, text } from "../runtime/draw";

type Cfg = ConfigOf<"scene">;
export const MAX_NODES = 10;
const ORIGIN = { x: 160, y: 110 }; // where world (0,0) is drawn

export function isDescendant(nodes: SceneNode[], id: string, maybeAncestor: string): boolean {
  let cur = nodes.find((n) => n.id === id);
  let guard = 0;
  while (cur?.parent && guard++ < 12) {
    if (cur.parent === maybeAncestor) return true;
    cur = nodes.find((n) => n.id === cur!.parent);
  }
  return false;
}

export function reparent(cfg: Cfg, id: string, parent: string | null): Cfg {
  if (parent === id || (parent && isDescendant(cfg.nodes, parent, id))) return cfg; // no cycles
  return { ...cfg, nodes: cfg.nodes.map((n) => (n.id === id ? { ...n, parent } : n)) };
}

export function addNode(cfg: Cfg, type: (typeof SCENE_NODE_TYPES)[number], parent: string | null): Cfg {
  if (cfg.nodes.length >= MAX_NODES) return cfg;
  const used = new Set(cfg.nodes.map((n) => n.id));
  let i = 1;
  while (used.has(`n${i}`)) i++;
  const names = new Set(cfg.nodes.map((n) => n.name));
  let name: string = type;
  for (let k = 2; names.has(name); k++) name = `${type}${k}`;
  return { ...cfg, nodes: [...cfg.nodes, { id: `n${i}`, type, name, parent, x: 0, y: 0 }] };
}

/** Removing a node moves its children up to its parent, like a safe "delete". */
export function removeNode(cfg: Cfg, id: string): Cfg {
  const node = cfg.nodes.find((n) => n.id === id);
  if (!node || cfg.nodes.length <= 1) return cfg;
  return {
    ...cfg,
    nodes: cfg.nodes.filter((n) => n.id !== id).map((n) => (n.parent === id ? { ...n, parent: node.parent } : n)),
  };
}

export function moveNode(cfg: Cfg, id: string, dx: number, dy: number): Cfg {
  const clampI = (v: number) => Math.max(-400, Math.min(400, Math.round(v)));
  return { ...cfg, nodes: cfg.nodes.map((n) => (n.id === id ? { ...n, x: clampI(n.x + dx), y: clampI(n.y + dy) } : n)) };
}

/** Depth-first order for rendering the tree as an indented list. */
export function treeOrder(nodes: SceneNode[]): { node: SceneNode; depth: number }[] {
  const out: { node: SceneNode; depth: number }[] = [];
  const visit = (parent: string | null, depth: number) => {
    for (const n of nodes.filter((x) => x.parent === parent)) {
      out.push({ node: n, depth });
      if (depth < 10) visit(n.id, depth + 1);
    }
  };
  visit(null, 0);
  return out;
}

export function renderScene(ctx: CanvasRenderingContext2D, cfg: Cfg, selected: string | null, showGlobal: boolean) {
  clear(ctx);
  ctx.strokeStyle = C.muted;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(ORIGIN.x, 0);
  ctx.lineTo(ORIGIN.x, 360);
  ctx.moveTo(0, ORIGIN.y);
  ctx.lineTo(640, ORIGIN.y);
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, "(0,0)", ORIGIN.x + 22, ORIGIN.y - 8, C.muted, 10);
  for (const n of cfg.nodes) {
    const g = globalPosition(cfg.nodes, n.id);
    if (!g) continue;
    const px = ORIGIN.x + g.x;
    const py = ORIGIN.y + g.y;
    if (n.parent) {
      const pg = globalPosition(cfg.nodes, n.parent);
      if (pg) {
        ctx.strokeStyle = C.muted;
        ctx.beginPath();
        ctx.moveTo(ORIGIN.x + pg.x, ORIGIN.y + pg.y);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }
    const color = n.type === "CharacterBody2D" ? C.player : n.type === "Sprite2D" ? C.coin : n.type === "CollisionShape2D" ? C.goal : C.ink;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (n.type === "Sprite2D") ctx.rect(px - 7, py - 7, 14, 14);
    else ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    if (n.id === selected) {
      ctx.strokeStyle = C.select;
      ctx.lineWidth = 3;
      ctx.strokeRect(px - 11, py - 11, 22, 22);
      ctx.lineWidth = 1;
    }
    text(ctx, showGlobal ? `${n.name} (${g.x}, ${g.y})` : `${n.name} [${n.x}, ${n.y}]`, px, py + 18, C.ink, 11);
  }
}

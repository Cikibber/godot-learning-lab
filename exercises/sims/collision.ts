import type { ConfigOf } from "../schema";
import { C, box, clear, text, triangle } from "../runtime/draw";
import { STANDARD_STEPS, fmt, moveAndCollide, overlaps, type Rect, type Sim } from "../runtime/core";

type Cfg = ConfigOf<"collision">;
type Solid = Rect & { layer: 1 | 2 };

// Layer 1 = walls, layer 2 = water. The only gap in the dividing wall is
// filled by water, and the top gap (18px) is narrower than the player (24px).
export const SOLIDS: Solid[] = [
  { x: 300, y: 18, w: 24, h: 132, layer: 1 },
  { x: 300, y: 222, w: 24, h: 138, layer: 1 },
  { x: 300, y: 150, w: 24, h: 72, layer: 2 },
  { x: 120, y: 40, w: 24, h: 100, layer: 1 },
  { x: 160, y: 260, w: 100, h: 24, layer: 1 },
  { x: 420, y: 20, w: 24, h: 100, layer: 1 },
  { x: 420, y: 240, w: 24, h: 120, layer: 1 },
];
const GOAL: Rect = { x: 580, y: 168, w: 32, h: 32 };
const START = { x: 30, y: 168 };

export function createCollisionSim(initial: Cfg) {
  let cfg = initial;
  const player: Rect = { x: START.x, y: START.y, w: 24, h: 24 };
  let wallHits = 0;
  let waterHits = 0;
  let touching = false;
  let reachedGoal = false;

  const active = () => SOLIDS.filter((s) => (s.layer === 1 ? cfg.maskWalls : cfg.maskWater));

  const sim: Sim & { configure(c: Cfg): void } = {
    configure(c) {
      cfg = c;
    },
    reset() {
      player.x = START.x;
      player.y = START.y;
      touching = false;
    },
    step(dt, input) {
      const dir = input.getVector();
      // velocity is px/second; the "engine" integrates it over the step,
      // the way move_and_slide() uses the physics timestep internally.
      const vx = dir.x * cfg.speed;
      const vy = dir.y * cfg.speed;
      const solids = active();
      const before = { x: player.x, y: player.y };
      const { hitX, hitY } = moveAndCollide(player, vx * dt, vy * dt, solids);
      const hit = hitX || hitY;
      if (hit && !touching) {
        const probe = { x: before.x + vx * dt, y: before.y + vy * dt, w: player.w, h: player.h };
        const water = solids.some((s) => s.layer === 2 && overlaps(probe, s));
        if (water) waterHits++;
        else wallHits++;
      }
      touching = hit;
      if (overlaps(player, GOAL)) reachedGoal = true;
    },
    render(ctx) {
      clear(ctx);
      for (const s of SOLIDS) {
        const on = s.layer === 1 ? cfg.maskWalls : cfg.maskWater;
        ctx.globalAlpha = on ? 1 : 0.35;
        box(ctx, s, s.layer === 1 ? C.wall : C.water, s.h > 60 && s.w < 30 ? (s.layer === 1 ? "1" : "2") : undefined);
        ctx.globalAlpha = 1;
      }
      triangle(ctx, GOAL, C.goal);
      text(ctx, "GOAL", GOAL.x + 16, GOAL.y - 10, C.goal, 11);
      box(ctx, player, C.player, "P");
    },
    summary: () => ({ wallHits, waterHits, reachedGoal, maskWalls: cfg.maskWalls, maskWater: cfg.maskWater }),
    describe: (l) => {
      const ahead = player.x < 300 ? (l === "id" ? "di kiri dinding pembatas" : "left of the dividing wall") : l === "id" ? "di kanan dinding pembatas" : "right of the dividing wall";
      return l === "id"
        ? `Pemain di (${fmt(player.x)}, ${fmt(player.y)}), ${ahead}. Celah air di y 150–222 pada x 300. Bendera di (${GOAL.x}, ${GOAL.y}). Mask: Dinding ${cfg.maskWalls ? "aktif" : "nonaktif"}, Air ${cfg.maskWater ? "aktif" : "nonaktif"}. Tabrakan dinding: ${wallHits}, air: ${waterHits}.${reachedGoal ? " Bendera tercapai." : ""}`
        : `Player at (${fmt(player.x)}, ${fmt(player.y)}), ${ahead}. Water gap at y 150–222 at x 300. Flag at (${GOAL.x}, ${GOAL.y}). Mask: Walls ${cfg.maskWalls ? "on" : "off"}, Water ${cfg.maskWater ? "on" : "off"}. Wall hits: ${wallHits}, water hits: ${waterHits}.${reachedGoal ? " Flag reached." : ""}`;
    },
    phase: () => (reachedGoal ? "goal" : touching ? "blocked" : "moving"),
    hud: () => ({ x: fmt(player.x), y: fmt(player.y), wallHits, waterHits }),
    trace: () => [],
  };
  return sim;
}

export const collisionSteps = STANDARD_STEPS;

import type { ConfigOf } from "../schema";
import { C, box, clear, outline, text } from "../runtime/draw";
import { STANDARD_STEPS, WORLD_H, WORLD_W, clamp, fmt, overlaps, type InputState, type Rect, type Sim } from "../runtime/core";

type Cfg = ConfigOf<"movement">;
const TOP = 84; // the delta comparison strip occupies the top band
const TARGET: Rect = { x: 540, y: 220, w: 64, h: 64 };

export function createMovementSim(initial: Cfg) {
  let cfg = initial;
  const player: Rect = { x: 40, y: 200, w: 28, h: 28 };
  let elapsed = 0;
  let reachedAt: number | null = null;
  let noDeltaSeconds = 0;
  let comparedWithoutDelta = false;
  // Two ghosts updated at simulated 30 and 60 FPS from the same clock.
  const ghosts = [
    { fps: 30, x: 0, acc: 0 },
    { fps: 60, x: 0, acc: 0 },
  ];

  const reset = () => {
    player.x = 40;
    player.y = 200;
    elapsed = 0;
    reachedAt = null;
    ghosts.forEach((g) => ((g.x = 0), (g.acc = 0)));
  };

  const sim: Sim & { configure(c: Cfg): void; ghostDistances(): number[] } = {
    configure(c) {
      if (c.useDelta !== cfg.useDelta) ghosts.forEach((g) => ((g.x = 0), (g.acc = 0)));
      cfg = c;
    },
    reset,
    step(dt, input: InputState) {
      elapsed += dt;
      const v = input.getVector();
      // Node2D-style: position += direction * speed * delta
      player.x = clamp(player.x + v.x * cfg.speed * dt, 0, WORLD_W - player.w);
      player.y = clamp(player.y + v.y * cfg.speed * dt, TOP, WORLD_H - player.h);
      if (reachedAt === null && overlaps(player, TARGET)) reachedAt = elapsed;

      for (const g of ghosts) {
        g.acc += dt;
        const frame = 1 / g.fps;
        while (g.acc >= frame - 1e-9) {
          g.acc -= frame;
          // Without delta the step is tuned "per frame" (as if for 60 FPS).
          g.x += cfg.useDelta ? cfg.speed * frame : cfg.speed / 60;
        }
        if (g.x > WORLD_W - 20) g.x = 0;
      }
      if (!cfg.useDelta) {
        noDeltaSeconds += dt;
        if (noDeltaSeconds >= 1.5) comparedWithoutDelta = true;
      }
    },
    render(ctx) {
      clear(ctx);
      ctx.fillStyle = C.panel;
      ctx.fillRect(0, 0, WORLD_W, TOP - 6);
      ghosts.forEach((g, i) => {
        const y = 14 + i * 32;
        text(ctx, `${g.fps} FPS`, 34, y + 9, C.ink, 12);
        box(ctx, { x: 64 + (g.x * (WORLD_W - 90)) / WORLD_W, y, w: 18, h: 18 }, i ? C.goal : C.coin);
      });
      text(ctx, cfg.useDelta ? "× delta" : "no delta", WORLD_W - 50, 40, cfg.useDelta ? C.goal : C.hazard, 12);
      box(ctx, TARGET, "rgba(168,186,138,0.16)");
      outline(ctx, TARGET, C.goal, true);
      text(ctx, "TARGET", TARGET.x + TARGET.w / 2, TARGET.y - 10, C.goal, 11);
      box(ctx, player, C.player, "P");
    },
    summary: () => ({
      reachedTarget: reachedAt !== null,
      secondsToTarget: reachedAt === null ? -1 : Math.round(reachedAt * 10) / 10,
      comparedWithoutDelta,
      speed: cfg.speed,
    }),
    describe: (l) =>
      l === "id"
        ? `Pemain di (${fmt(player.x)}, ${fmt(player.y)}). Target di (${TARGET.x}, ${TARGET.y}) sampai (${TARGET.x + TARGET.w}, ${TARGET.y + TARGET.h}). Kecepatan ${cfg.speed} px/dtk. ${reachedAt !== null ? "Target tercapai." : ""}`
        : `Player at (${fmt(player.x)}, ${fmt(player.y)}). Target spans (${TARGET.x}, ${TARGET.y}) to (${TARGET.x + TARGET.w}, ${TARGET.y + TARGET.h}). Speed ${cfg.speed} px/s. ${reachedAt !== null ? "Target reached." : ""}`,
    phase: () => (reachedAt !== null ? "reached" : "moving"),
    hud: () => ({ x: fmt(player.x), y: fmt(player.y), ghost30: fmt(ghosts[0].x), ghost60: fmt(ghosts[1].x) }),
    trace: () => [],
    ghostDistances: () => ghosts.map((g) => g.x),
  };
  return sim;
}

export const movementSteps = STANDARD_STEPS;

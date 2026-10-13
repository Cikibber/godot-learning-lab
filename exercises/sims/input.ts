import type { ConfigOf } from "../schema";
import { C, box, clear, text } from "../runtime/draw";
import { STANDARD_STEPS, Trace, WORLD_H, WORLD_W, clamp, fmt, type Rect, type Sim, type StepAction } from "../runtime/core";

type Cfg = ConfigOf<"input">;
const SPEED = 160;
const DASH = 24;

export function createInputSim(initial: Cfg) {
  let cfg = initial;
  const player: Rect = { x: 300, y: 170, w: 26, h: 26 };
  let diagonalTicks = 0;
  let diagonalSpeedRatio = 0;
  let dashPresses = 0;
  let dashActivations = 0;
  const trace = new Trace(10);
  let lastDir = { x: 1, y: 0 };
  const heldBefore = new Set<string>();

  const sim: Sim & { configure(c: Cfg): void } = {
    configure(c) {
      cfg = c;
      // A new setting starts a fresh measurement.
      diagonalTicks = 0;
      diagonalSpeedRatio = 0;
    },
    reset() {
      player.x = 300;
      player.y = 170;
      trace.clear();
      dashPresses = 0;
      dashActivations = 0;
      diagonalTicks = 0;
      diagonalSpeedRatio = 0;
    },
    step(dt, input) {
      for (const a of ["move_left", "move_right", "move_up", "move_down"] as const) {
        if (input.isJustPressed(a)) trace.push(`${a} ▼`);
        if (!input.isPressed(a) && heldBefore.has(a)) trace.push(`${a} ▲`);
        if (input.isPressed(a)) heldBefore.add(a);
        else heldBefore.delete(a);
      }
      const dir = cfg.normalizeDiagonal ? input.getVector() : input.rawVector();
      if (dir.x || dir.y) lastDir = dir;
      const x0 = player.x;
      const y0 = player.y;
      player.x = clamp(player.x + dir.x * SPEED * dt, 0, WORLD_W - player.w);
      player.y = clamp(player.y + dir.y * SPEED * dt, 0, WORLD_H - player.h);
      const moved = Math.hypot(player.x - x0, player.y - y0);
      const free = player.x > 0 && player.y > 0 && player.x < WORLD_W - player.w && player.y < WORLD_H - player.h;
      if (dir.x !== 0 && dir.y !== 0 && free) {
        diagonalTicks++;
        diagonalSpeedRatio = Math.max(diagonalSpeedRatio, moved / (SPEED * dt));
      }

      if (input.isJustPressed("dash")) dashPresses++;
      const fire = cfg.dashMode === "held" ? input.isPressed("dash") : input.isJustPressed("dash");
      if (fire) {
        dashActivations++;
        const len = Math.hypot(lastDir.x, lastDir.y) || 1;
        player.x = clamp(player.x + (lastDir.x / len) * DASH, 0, WORLD_W - player.w);
        player.y = clamp(player.y + (lastDir.y / len) * DASH, 0, WORLD_H - player.h);
        trace.push(cfg.dashMode === "held" ? "is_action_pressed(dash) → dash" : "is_action_just_pressed(dash) → dash");
      }
    },
    render(ctx) {
      clear(ctx);
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      ctx.strokeStyle = C.muted;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, "1 s @ 160 px/s → r≈160", cx, cy - 72, C.muted, 11);
      box(ctx, player, C.player, "P");
    },
    summary: () => ({
      diagonalTicks,
      diagonalSpeedRatio: Math.round(diagonalSpeedRatio * 100) / 100,
      dashPresses,
      dashActivations,
      normalizeDiagonal: cfg.normalizeDiagonal,
    }),
    describe: (l) =>
      l === "id"
        ? `Pemain di (${fmt(player.x)}, ${fmt(player.y)}). Rasio kecepatan diagonal: ${diagonalSpeedRatio.toFixed(2)}. Dash ditekan ${dashPresses} kali, aktif ${dashActivations} kali.`
        : `Player at (${fmt(player.x)}, ${fmt(player.y)}). Diagonal speed ratio: ${diagonalSpeedRatio.toFixed(2)}. Dash pressed ${dashPresses} times, activated ${dashActivations} times.`,
    phase: () => "playing",
    hud: () => ({ ratio: diagonalSpeedRatio.toFixed(2), presses: dashPresses, activations: dashActivations }),
    trace: () => trace.list(),
  };
  return sim;
}

export const inputSteps: StepAction[] = [
  ...STANDARD_STEPS.slice(0, 4),
  { id: "diag", label: { id: "Kanan+bawah 0,5 dtk", en: "Right+down 0.5 s" }, hold: ["move_right", "move_down"], seconds: 0.5 },
  { id: "dash_tap", label: { id: "Tekan dash sekali", en: "Tap dash once" }, hold: [], press: ["dash"], seconds: 0.1 },
  { id: "dash_hold", label: { id: "Tahan dash 0,5 dtk", en: "Hold dash 0.5 s" }, hold: ["dash"], seconds: 0.5 },
];

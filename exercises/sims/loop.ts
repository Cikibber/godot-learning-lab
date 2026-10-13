import type { ConfigOf } from "../schema";
import { C, banner, box, clear, diamond, outline, text } from "../runtime/draw";
import { STANDARD_STEPS, WORLD_H, fmt, moveAndCollide, overlaps, type Rect, type Sim, type StepAction } from "../runtime/core";

type Cfg = ConfigOf<"loop">;
type Phase = "playing" | "won" | "lost";

const COINS: Rect[] = [
  { x: 110, y: 60, w: 20, h: 20 },
  { x: 260, y: 290, w: 20, h: 20 },
  { x: 400, y: 60, w: 20, h: 20 },
  { x: 470, y: 280, w: 20, h: 20 },
];
const EXIT: Rect = { x: 580, y: 150, w: 44, h: 60 };
const START = { x: 30, y: 168 };

export function createLoopSim(initial: Cfg) {
  let cfg = initial;
  const player: Rect = { x: START.x, y: START.y, w: 24, h: 24 };
  let coins = COINS.map(() => false);
  let hazards: (Rect & { vy: number })[] = [];
  let phase: Phase = "playing";
  let score = 0;
  let lives = cfg.lives;
  let invulnerable = 0;
  let wins = 0;
  let losses = 0;
  let cleanRestarts = 0;
  let exitOpenedEarly = false;

  const exitOpen = () =>
    cfg.exitRule === "always" ? true : cfg.exitRule === "score_gt_zero" ? score > 0 : score >= COINS.length;

  const place = () => {
    hazards = [
      { x: 200, y: 40, w: 22, h: 22, vy: 110 },
      { x: 360, y: 300, w: 22, h: 22, vy: -140 },
    ];
    player.x = START.x;
    player.y = START.y;
    invulnerable = 1;
  };

  const restart = () => {
    place();
    phase = "playing";
    score = 0;
    lives = cfg.lives;
    // Seeded bug 2: the original restart forgets to bring coins back.
    if (cfg.restartRule === "reset_coins") coins = COINS.map(() => false);
    if (coins.every((t) => !t)) cleanRestarts++;
  };

  const fullReset = () => {
    coins = COINS.map(() => false);
    score = 0;
    lives = cfg.lives;
    phase = "playing";
    place();
  };
  fullReset();

  const sim: Sim & { configure(c: Cfg): void; restart(): void } = {
    configure(c) {
      const relives = c.lives !== cfg.lives;
      cfg = c;
      if (relives) fullReset();
    },
    reset: fullReset,
    restart,
    step(dt, input) {
      if (input.isJustPressed("restart")) restart();
      if (phase !== "playing") return;
      const v = input.getVector();
      moveAndCollide(player, v.x * 150 * dt, v.y * 150 * dt, []);
      invulnerable = Math.max(0, invulnerable - dt);
      for (const h of hazards) {
        h.y += h.vy * dt;
        if (h.y < 0 || h.y > WORLD_H - h.h) h.vy = -h.vy;
        if (invulnerable === 0 && overlaps(player, h)) {
          lives--;
          invulnerable = 1;
          if (lives <= 0) {
            phase = "lost";
            losses++;
          }
        }
      }
      COINS.forEach((r, i) => {
        if (!coins[i] && overlaps(player, r)) {
          coins[i] = true;
          score++;
        }
      });
      if (exitOpen() && score < COINS.length) exitOpenedEarly = true;
      if (phase === "playing" && exitOpen() && overlaps(player, EXIT)) {
        phase = "won";
        wins++;
      }
    },
    render(ctx) {
      clear(ctx);
      COINS.forEach((r, i) => !coins[i] && diamond(ctx, r, C.coin));
      hazards.forEach((h) => box(ctx, h, C.hazard, "!"));
      if (exitOpen()) box(ctx, EXIT, "rgba(168,186,138,0.2)");
      outline(ctx, EXIT, exitOpen() ? C.goal : C.muted, !exitOpen());
      text(ctx, exitOpen() ? "EXIT ✓" : "EXIT ✕", EXIT.x + 22, EXIT.y - 10, exitOpen() ? C.goal : C.muted, 11);
      ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable * 10) % 2 ? 0.4 : 1;
      box(ctx, player, C.player, "P");
      ctx.globalAlpha = 1;
      if (phase === "won") banner(ctx, "WON — R = restart", C.goal);
      if (phase === "lost") banner(ctx, "LOST — R = restart", C.hazard);
    },
    summary: () => ({ wins, losses, cleanRestarts, exitOpenedEarly, score, lives }),
    describe: (l) => {
      const left = COINS.filter((_, i) => !coins[i]).map((r) => `(${r.x}, ${r.y})`).join(", ") || "-";
      return l === "id"
        ? `State ${phase}. Koin ${score}/${COINS.length}, nyawa ${lives}. Koin tersisa: ${left}. Pintu keluar (580, 150) ${exitOpen() ? "terbuka" : "tertutup"}. Pemain di (${fmt(player.x)}, ${fmt(player.y)}). Bahaya bergerak naik-turun di x 200 dan x 360.`
        : `State ${phase}. Coins ${score}/${COINS.length}, lives ${lives}. Coins left: ${left}. Exit (580, 150) ${exitOpen() ? "open" : "closed"}. Player at (${fmt(player.x)}, ${fmt(player.y)}). Hazards move up and down at x 200 and x 360.`;
    },
    phase: () => phase,
    hud: () => ({ state: phase, coins: `${score}/${COINS.length}`, lives, exit: exitOpen() ? "open" : "closed" }),
    trace: () => [],
  };
  return sim;
}

export const loopSteps: StepAction[] = [
  ...STANDARD_STEPS,
  { id: "restart", label: { id: "Restart", en: "Restart" }, hold: [], press: ["restart"], seconds: 0.05 },
];

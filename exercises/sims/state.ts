import type { ConfigOf } from "../schema";
import { C, banner, box, clear, diamond } from "../runtime/draw";
import { STANDARD_STEPS, WORLD_H, WORLD_W, fmt, moveAndCollide, overlaps, rng, type Rect, type Sim, type StepAction } from "../runtime/core";

type Cfg = ConfigOf<"state">;
type Phase = "playing" | "won" | "lost";

const STAR_SPOTS: Rect[] = Array.from({ length: 10 }, (_, i) => ({
  x: 90 + (i % 5) * 110,
  y: i < 5 ? 70 : 270,
  w: 18,
  h: 18,
}));
const START = { x: 300, y: 170 };

export function createStateSim(initial: Cfg, seed = 7) {
  let cfg = initial;
  const player: Rect = { x: START.x, y: START.y, w: 24, h: 24 };
  let stars: { r: Rect; taken: boolean }[] = [];
  let hazards: (Rect & { vx: number; vy: number })[] = [];
  let phase: Phase = "playing";
  let score = 0;
  let lives = cfg.lives;
  let invulnerable = 0;
  let wins = 0;
  let losses = 0;
  let cleanRestarts = 0;
  let staleRestarts = 0;

  const placeWorld = () => {
    const r = rng(seed);
    stars = STAR_SPOTS.slice(0, cfg.goal).map((s) => ({ r: { ...s }, taken: false }));
    hazards = [0, 1, 2].map((i) => ({
      x: 60 + i * 200, y: 140 + i * 30, w: 22, h: 22,
      vx: (r() > 0.5 ? 1 : -1) * (60 + r() * 40), vy: (r() > 0.5 ? 1 : -1) * (50 + r() * 40),
    }));
    player.x = START.x;
    player.y = START.y;
    invulnerable = 1;
  };

  /** The "restart" button: what it resets depends on the student's fix. */
  const restart = () => {
    placeWorld();
    phase = "playing";
    if (cfg.resetScoreOnRestart) score = 0;
    if (cfg.resetLivesOnRestart) lives = cfg.lives;
    if (score === 0 && lives === cfg.lives) cleanRestarts++;
    else staleRestarts++;
    if (lives <= 0) {
      phase = "lost"; // stale lives: lost again immediately
      losses++;
    }
  };

  const fullReset = () => {
    score = 0;
    lives = cfg.lives;
    phase = "playing";
    placeWorld();
  };
  fullReset();

  const sim: Sim & { configure(c: Cfg): void; restart(): void } = {
    configure(c) {
      const layout = c.goal !== cfg.goal || c.lives !== cfg.lives;
      cfg = c;
      if (layout) fullReset();
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
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        if (h.x < 0 || h.x > WORLD_W - h.w) h.vx = -h.vx;
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
      for (const s of stars) {
        if (!s.taken && overlaps(player, s.r)) {
          s.taken = true;
          score++;
          if (score >= cfg.goal && phase === "playing") {
            phase = "won";
            wins++;
          }
        }
      }
    },
    render(ctx) {
      clear(ctx);
      stars.forEach((s) => !s.taken && diamond(ctx, s.r, C.coin));
      hazards.forEach((h) => box(ctx, h, C.hazard, "!"));
      ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable * 10) % 2 ? 0.4 : 1;
      box(ctx, player, C.player, "P");
      ctx.globalAlpha = 1;
      if (phase === "won") banner(ctx, "WON — R = restart", C.goal);
      if (phase === "lost") banner(ctx, "LOST — R = restart", C.hazard);
    },
    summary: () => ({ wins, losses, cleanRestarts, staleRestarts, score, lives }),
    describe: (l) => {
      const near = stars.filter((s) => !s.taken).slice(0, 3).map((s) => `(${s.r.x}, ${s.r.y})`).join(", ") || "-";
      const st = { playing: l === "id" ? "BERMAIN" : "PLAYING", won: l === "id" ? "MENANG" : "WON", lost: l === "id" ? "KALAH" : "LOST" }[phase];
      return l === "id"
        ? `State: ${st}. Skor ${score}/${cfg.goal}, nyawa ${lives}. Pemain di (${fmt(player.x)}, ${fmt(player.y)}). Bintang terdekat: ${near}. Bahaya: ${hazards.map((h) => `(${fmt(h.x)}, ${fmt(h.y)})`).join(", ")}.`
        : `State: ${st}. Score ${score}/${cfg.goal}, lives ${lives}. Player at (${fmt(player.x)}, ${fmt(player.y)}). Nearest stars: ${near}. Hazards: ${hazards.map((h) => `(${fmt(h.x)}, ${fmt(h.y)})`).join(", ")}.`;
    },
    phase: () => phase,
    hud: () => ({ state: phase, score: `${score}/${cfg.goal}`, lives }),
    trace: () => [],
  };
  return sim;
}

export const stateSteps: StepAction[] = [
  ...STANDARD_STEPS,
  { id: "restart", label: { id: "Restart", en: "Restart" }, hold: [], press: ["restart"], seconds: 0.05 },
];

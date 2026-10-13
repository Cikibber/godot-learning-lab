import type { ConfigOf } from "../schema";
import { C, banner, box, clear, diamond } from "../runtime/draw";
import { HARD_ENTITY_LIMIT, STANDARD_STEPS, Trace, WORLD_H, WORLD_W, fmt, moveAndCollide, overlaps, rng, type Rect, type Sim, type StepAction } from "../runtime/core";

type Cfg = ConfigOf<"timer">;

export function createTimerSim(initial: Cfg, seed = 11) {
  let cfg = initial;
  const player: Rect = { x: 300, y: 320, w: 30, h: 22 };
  let items: (Rect & { vy: number; landed: boolean })[] = [];
  let rand = rng(seed);
  let countdown = cfg.countdownSeconds;
  let countdownRunning = true;
  let spawnLeft = cfg.spawnInterval;
  let spawnRunning = true;
  let countdownTimeouts = 0;
  let spawned = 0;
  let caught = 0;
  let maxAlive = 0;
  let flash = 0;
  const trace = new Trace(8);

  const reset = () => {
    rand = rng(seed);
    items = [];
    player.x = 300;
    countdown = cfg.countdownSeconds;
    countdownRunning = true;
    spawnLeft = cfg.spawnInterval;
    spawnRunning = true;
    flash = 0;
    trace.clear();
  };

  const sim: Sim & { configure(c: Cfg): void; alive(): number } = {
    configure(c) {
      const restartTimers = c.countdownSeconds !== cfg.countdownSeconds || c.countdownOneShot !== cfg.countdownOneShot;
      cfg = c;
      if (restartTimers) reset();
    },
    reset,
    alive: () => items.length,
    step(dt, input) {
      if (input.isJustPressed("restart")) reset();
      const v = input.getVector();
      moveAndCollide(player, v.x * 200 * dt, 0, []);
      flash = Math.max(0, flash - dt);

      if (countdownRunning) {
        countdown -= dt;
        if (countdown <= 0) {
          countdownTimeouts++;
          trace.push("Countdown.timeout");
          if (cfg.countdownOneShot) {
            countdown = 0;
            countdownRunning = false;
            spawnRunning = false; // spawn_timer.stop()
            trace.push("SpawnTimer.stop()");
          } else {
            countdown += cfg.countdownSeconds; // repeating: fires again and again
          }
        }
      }
      if (spawnRunning) {
        spawnLeft -= dt;
        while (spawnLeft <= 0) {
          spawnLeft += cfg.spawnInterval;
          const limit = cfg.capEnabled ? Math.min(cfg.maxEntities, HARD_ENTITY_LIMIT) : HARD_ENTITY_LIMIT;
          if (items.length >= limit) {
            trace.push("SpawnTimer.timeout (cap)");
            continue;
          }
          items.push({ x: 10 + rand() * (WORLD_W - 40), y: -18, w: 18, h: 18, vy: 60 + rand() * 60, landed: false });
          spawned++;
          trace.push("SpawnTimer.timeout → spawn");
        }
      }
      for (const it of items) {
        if (!it.landed) {
          it.y += it.vy * dt;
          if (it.y >= WORLD_H - it.h) {
            it.y = WORLD_H - it.h;
            it.landed = true;
          }
        }
      }
      const before = items.length;
      items = items.filter((it) => !overlaps(player, it));
      if (items.length < before) {
        caught += before - items.length;
        flash = 0.25; // the AnimationPlayer-style feedback
      }
      maxAlive = Math.max(maxAlive, items.length);
    },
    render(ctx) {
      clear(ctx);
      items.forEach((it) => diamond(ctx, it, it.landed ? C.muted : C.coin));
      box(ctx, player, flash > 0 ? C.goal : C.player, "P");
      if (!countdownRunning) banner(ctx, "TIME'S UP", C.hazard);
    },
    summary: () => ({ spawned, caught, maxAlive, countdownTimeouts, alive: items.length }),
    describe: (l) =>
      l === "id"
        ? `Waktu tersisa ${countdown.toFixed(1)} dtk${countdownRunning ? "" : " (berhenti)"}. Objek aktif ${items.length}, tertangkap ${caught}, timeout hitung mundur ${countdownTimeouts} kali. Pemain di x ${fmt(player.x)}.`
        : `Time left ${countdown.toFixed(1)} s${countdownRunning ? "" : " (stopped)"}. Active objects ${items.length}, caught ${caught}, countdown timeouts ${countdownTimeouts}. Player at x ${fmt(player.x)}.`,
    phase: () => (countdownRunning ? "running" : "time_up"),
    hud: () => ({ time: Math.max(0, countdown).toFixed(1), alive: items.length, caught, timeouts: countdownTimeouts }),
    trace: () => trace.list(),
  };
  return sim;
}

export const timerSteps: StepAction[] = [
  STANDARD_STEPS[0],
  STANDARD_STEPS[1],
  { id: "wait5", label: { id: "Tunggu 5 dtk", en: "Wait 5 s" }, hold: [], seconds: 5 },
  { id: "restart", label: { id: "Restart", en: "Restart" }, hold: [], press: ["restart"], seconds: 0.05 },
];

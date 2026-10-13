import type { ConfigOf } from "../schema";
import { SIGNALS } from "../schema";
import { C, banner, box, clear, diamond, outline, text } from "../runtime/draw";
import { STANDARD_STEPS, Trace, fmt, moveAndCollide, overlaps, type Rect, type Sim } from "../runtime/core";

type Cfg = ConfigOf<"signals">;
type Signal = (typeof SIGNALS)[number];

const COIN_SPOTS: Rect[] = [
  { x: 120, y: 80, w: 20, h: 20 },
  { x: 220, y: 280, w: 20, h: 20 },
  { x: 330, y: 70, w: 20, h: 20 },
  { x: 160, y: 190, w: 20, h: 20 },
  { x: 380, y: 250, w: 20, h: 20 },
];
const WALLS: Rect[] = [
  { x: 470, y: 0, w: 20, h: 150 },
  { x: 470, y: 210, w: 20, h: 150 },
];
const DOOR: Rect = { x: 470, y: 150, w: 20, h: 60 };
const EXIT: Rect = { x: 570, y: 150, w: 50, h: 60 };
const START = { x: 40, y: 168 };

export function createSignalsSim(initial: Cfg) {
  let cfg = initial;
  const player: Rect = { x: START.x, y: START.y, w: 24, h: 24 };
  let coins: { r: Rect; taken: boolean; inside: boolean }[] = [];
  let score = 0;
  let doorOpen = false;
  let won = false;
  let goalEmitted = false;
  let exitInside = false;
  let coinEvents = 0;
  let coinsCollected = 0;
  const trace = new Trace(12);

  const act = (signal: Signal, coin?: { taken: boolean }) => {
    const action = cfg.connections[signal];
    trace.push(`${signal} → ${action}`);
    if (action === "add_score") {
      score++;
      if (coin && !cfg.emitWhileOverlapping) {
        coin.taken = true; // like queue_free() after collecting
        coinsCollected++;
      }
    } else if (action === "open_door") doorOpen = true;
    else if (action === "win_game") {
      if (!won) won = true;
    }
    if (score >= cfg.coinsRequired && !goalEmitted) {
      goalEmitted = true;
      act("score.goal_reached");
    }
  };

  const reset = () => {
    coins = COIN_SPOTS.slice(0, cfg.coinsRequired).map((r) => ({ r, taken: false, inside: false }));
    player.x = START.x;
    player.y = START.y;
    score = 0;
    doorOpen = false;
    won = false;
    goalEmitted = false;
    exitInside = false;
    trace.clear();
  };
  reset();

  const sim: Sim & { configure(c: Cfg): void } = {
    configure(c) {
      const resize = c.coinsRequired !== cfg.coinsRequired;
      cfg = c;
      if (resize) reset();
    },
    reset,
    step(dt, input) {
      if (won) return;
      const v = input.getVector();
      moveAndCollide(player, v.x * 150 * dt, v.y * 150 * dt, doorOpen ? WALLS : [...WALLS, DOOR]);
      for (const coin of coins) {
        if (coin.taken) continue;
        const now = overlaps(player, coin.r);
        // body_entered fires on the transition into the area, once.
        if (now && (!coin.inside || cfg.emitWhileOverlapping)) {
          coinEvents++;
          act("coin.body_entered", coin);
        }
        coin.inside = now;
      }
      const inExit = overlaps(player, EXIT);
      if (inExit && !exitInside) act("exit.body_entered");
      exitInside = inExit;
    },
    render(ctx) {
      clear(ctx);
      WALLS.forEach((w) => box(ctx, w, C.wall));
      if (!doorOpen) box(ctx, DOOR, C.door, "▮");
      else outline(ctx, DOOR, C.door, true);
      coins.forEach((c) => !c.taken && diamond(ctx, c.r, C.coin));
      box(ctx, EXIT, "rgba(168,186,138,0.16)");
      outline(ctx, EXIT, C.goal);
      text(ctx, "EXIT", EXIT.x + 25, EXIT.y - 10, C.goal, 11);
      box(ctx, player, C.player, "P");
      if (won) banner(ctx, "WIN!", C.goal);
    },
    summary: () => ({ coinEvents, coinsCollected, score, doorOpened: doorOpen, won }),
    describe: (l) => {
      const left = coins.filter((c) => !c.taken).map((c) => `(${c.r.x}, ${c.r.y})`).join(", ") || "-";
      return l === "id"
        ? `Pemain di (${fmt(player.x)}, ${fmt(player.y)}). Skor ${score}/${cfg.coinsRequired}. Koin tersisa di ${left}. Pintu di x 470, y 150–210: ${doorOpen ? "terbuka" : "tertutup"}. Pintu keluar di (570, 150).${won ? " Menang!" : ""}`
        : `Player at (${fmt(player.x)}, ${fmt(player.y)}). Score ${score}/${cfg.coinsRequired}. Coins left at ${left}. Door at x 470, y 150–210: ${doorOpen ? "open" : "closed"}. Exit at (570, 150).${won ? " Won!" : ""}`;
    },
    phase: () => (won ? "won" : doorOpen ? "door_open" : "playing"),
    hud: () => ({ score: `${score}/${cfg.coinsRequired}`, door: doorOpen ? "open" : "closed" }),
    trace: () => trace.list(),
  };
  return sim;
}

export const signalsSteps = STANDARD_STEPS;

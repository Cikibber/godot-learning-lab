// Shared, DOM-free simulation primitives. Everything here is deterministic so
// it can be unit-tested in Node and recomputed exactly.
import type { Summary } from "../schema";
import type { Locale } from "@/lib/validation/content";

export const WORLD_W = 640;
export const WORLD_H = 360;
export const FIXED_DT = 1 / 60;
export const HARD_ENTITY_LIMIT = 100;

export type Rect = { x: number; y: number; w: number; h: number };

export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Mulberry32: tiny seeded PRNG so spawns and layouts are reproducible. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOVE_ACTIONS = ["move_left", "move_right", "move_up", "move_down"] as const;
export type Action = (typeof MOVE_ACTIONS)[number] | "dash" | "restart";

/**
 * Action-based input, like Godot's Input Map: the simulation asks about
 * action names, never raw keys. "Just pressed" lasts exactly one step.
 */
export class InputState {
  private held = new Set<Action>();
  private pressed = new Set<Action>();

  down(a: Action) {
    if (!this.held.has(a)) this.pressed.add(a);
    this.held.add(a);
  }
  up(a: Action) {
    this.held.delete(a);
  }
  isPressed(a: Action) {
    return this.held.has(a);
  }
  isJustPressed(a: Action) {
    return this.pressed.has(a);
  }
  /** Raw direction from held actions; components are -1, 0, or 1. */
  rawVector() {
    const x = (this.held.has("move_right") ? 1 : 0) - (this.held.has("move_left") ? 1 : 0);
    const y = (this.held.has("move_down") ? 1 : 0) - (this.held.has("move_up") ? 1 : 0);
    return { x, y };
  }
  /** Like Input.get_vector(): length never exceeds 1. */
  getVector() {
    const v = this.rawVector();
    const len = Math.hypot(v.x, v.y);
    return len > 1 ? { x: v.x / len, y: v.y / len } : v;
  }
  endStep() {
    this.pressed.clear();
  }
  clear() {
    this.held.clear();
    this.pressed.clear();
  }
}

/** Moves a box by (dx, dy) one axis at a time, stopping at solid boxes. */
export function moveAndCollide(body: Rect, dx: number, dy: number, solids: Rect[]): { hitX: boolean; hitY: boolean } {
  let hitX = false;
  let hitY = false;
  body.x += dx;
  for (const s of solids) {
    if (overlaps(body, s)) {
      body.x = dx > 0 ? s.x - body.w : s.x + s.w;
      hitX = true;
    }
  }
  body.y += dy;
  for (const s of solids) {
    if (overlaps(body, s)) {
      body.y = dy > 0 ? s.y - body.h : s.y + s.h;
      hitY = true;
    }
  }
  body.x = clamp(body.x, 0, WORLD_W - body.w);
  body.y = clamp(body.y, 0, WORLD_H - body.h);
  return { hitX, hitY };
}

export type StepAction = {
  id: string;
  label: { id: string; en: string };
  hold: Action[];
  press?: Action[];
  seconds: number;
};

/** Every playable activity implements this; React never sees per-frame state. */
export interface Sim {
  reset(): void;
  step(dt: number, input: InputState): void;
  render(ctx: CanvasRenderingContext2D): void;
  summary(): Summary;
  /** Plain-language state for the text/step mode and screen readers. */
  describe(locale: Locale): string;
  /** Coarse state that is worth announcing when it changes. */
  phase(): string;
  /** Small HUD values shown in HTML. */
  hud(): Record<string, string | number>;
  /** Bounded recent event trace (signals, input), newest last. */
  trace(): string[];
}

/** Runs a step action deterministically (used by the text/step mode and tests). */
export function runStepAction(sim: Sim, input: InputState, action: StepAction) {
  input.clear();
  for (const a of action.press ?? []) input.down(a);
  for (const a of action.hold) input.down(a);
  const ticks = Math.round(action.seconds / FIXED_DT);
  for (let i = 0; i < ticks; i++) {
    sim.step(FIXED_DT, input);
    input.endStep();
    if (i === 0) for (const a of action.press ?? []) if (!action.hold.includes(a)) input.up(a);
  }
  input.clear();
}

export class Trace {
  private items: string[] = [];
  constructor(private max = 12) {}
  push(s: string) {
    this.items.push(s);
    if (this.items.length > this.max) this.items.shift();
  }
  list() {
    return this.items.slice();
  }
  clear() {
    this.items = [];
  }
}

export const STANDARD_STEPS: StepAction[] = [
  { id: "left", label: { id: "Kiri 0,25 dtk", en: "Left 0.25 s" }, hold: ["move_left"], seconds: 0.25 },
  { id: "right", label: { id: "Kanan 0,25 dtk", en: "Right 0.25 s" }, hold: ["move_right"], seconds: 0.25 },
  { id: "up", label: { id: "Atas 0,25 dtk", en: "Up 0.25 s" }, hold: ["move_up"], seconds: 0.25 },
  { id: "down", label: { id: "Bawah 0,25 dtk", en: "Down 0.25 s" }, hold: ["move_down"], seconds: 0.25 },
  { id: "wait", label: { id: "Tunggu 1 dtk", en: "Wait 1 s" }, hold: [], seconds: 1 },
];

export const fmt = (n: number) => Math.round(n).toString();

// Lazy loaders: each activity's simulation is its own chunk, fetched only on
// the lesson that uses it.
import type { ActivityConfig, ActivityKind } from "./schema";
import type { Action, Sim, StepAction } from "./runtime/core";

export type LoadedSim = {
  create: (config: ActivityConfig) => Sim & { configure(c: ActivityConfig): void };
  steps: StepAction[];
};

type TimeKind = Exclude<ActivityKind, "scene">;

export const SIM_LOADERS: Record<TimeKind, () => Promise<LoadedSim>> = {
  movement: () => import("./sims/movement").then((m) => ({ create: m.createMovementSim as never, steps: m.movementSteps })),
  collision: () => import("./sims/collision").then((m) => ({ create: m.createCollisionSim as never, steps: m.collisionSteps })),
  input: () => import("./sims/input").then((m) => ({ create: m.createInputSim as never, steps: m.inputSteps })),
  signals: () => import("./sims/signals").then((m) => ({ create: m.createSignalsSim as never, steps: m.signalsSteps })),
  state: () => import("./sims/state").then((m) => ({ create: m.createStateSim as never, steps: m.stateSteps })),
  timer: () => import("./sims/timer").then((m) => ({ create: m.createTimerSim as never, steps: m.timerSteps })),
  loop: () => import("./sims/loop").then((m) => ({ create: m.createLoopSim as never, steps: m.loopSteps })),
};

const BASE_KEYS: Record<string, Action> = {
  ArrowLeft: "move_left",
  KeyA: "move_left",
  ArrowRight: "move_right",
  KeyD: "move_right",
  ArrowUp: "move_up",
  KeyW: "move_up",
  ArrowDown: "move_down",
  KeyS: "move_down",
  Space: "dash",
  KeyR: "restart",
};

/** Key → action binding, like an Input Map; the Control Lab rebinds dash. */
export function keymap(config: ActivityConfig): Record<string, Action> {
  if (config.kind !== "input") return BASE_KEYS;
  const { Space: _space, ...rest } = BASE_KEYS;
  void _space;
  return { ...rest, [config.dashKey]: "dash" };
}

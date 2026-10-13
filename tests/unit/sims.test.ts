// Gate B: deterministic simulation behaviour and registered checks.
import { describe, expect, it } from "vitest";
import { FIXED_DT, InputState, runStepAction, type Action, type Sim } from "@/exercises/runtime/core";
import { createMovementSim } from "@/exercises/sims/movement";
import { createCollisionSim } from "@/exercises/sims/collision";
import { createInputSim } from "@/exercises/sims/input";
import { createSignalsSim } from "@/exercises/sims/signals";
import { createStateSim } from "@/exercises/sims/state";
import { createTimerSim } from "@/exercises/sims/timer";
import { createLoopSim } from "@/exercises/sims/loop";
import { addNode, reparent, removeNode, moveNode } from "@/exercises/sims/scene";
import { globalPosition, runChecks } from "@/exercises/checks";
import { LESSONS } from "@/content";
import type { ConfigOf } from "@/exercises/schema";

const loopInitial = LESSONS.find((l) => l.key === "mini-game")!.activity.initialConfig as ConfigOf<"loop">;

function hold(sim: Sim, actions: Action[], seconds: number, input = new InputState()) {
  input.clear();
  actions.forEach((a) => input.down(a));
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++) {
    sim.step(FIXED_DT, input);
    input.endStep();
  }
  input.clear();
}

describe("movement", () => {
  it("moves speed × time regardless of step count", () => {
    const sim = createMovementSim({ kind: "movement", v: 1, speed: 120, useDelta: true });
    const x0 = Number(sim.hud().x);
    hold(sim, ["move_right"], 1);
    expect(Number(sim.hud().x) - x0).toBeCloseTo(120, 0);
  });
  it("with delta 30/60 FPS ghosts match; without delta 60 FPS goes twice as far", () => {
    const withDelta = createMovementSim({ kind: "movement", v: 1, speed: 100, useDelta: true });
    hold(withDelta, [], 2);
    const [a, b] = withDelta.ghostDistances();
    expect(a).toBeCloseTo(b, 0);
    const noDelta = createMovementSim({ kind: "movement", v: 1, speed: 100, useDelta: false });
    hold(noDelta, [], 2);
    const [c, d] = noDelta.ghostDistances();
    expect(d / c).toBeCloseTo(2, 1);
    expect(noDelta.summary().comparedWithoutDelta).toBe(true);
  });
  it("reaches the target only by moving there", () => {
    const sim = createMovementSim({ kind: "movement", v: 1, speed: 300, useDelta: true });
    hold(sim, ["move_right"], 2);
    hold(sim, ["move_down"], 0.15);
    expect(sim.summary().reachedTarget).toBe(true);
  });
});

describe("collision", () => {
  const go = (maskWater: boolean) => {
    const sim = createCollisionSim({ kind: "collision", v: 1, speed: 160, maskWalls: true, maskWater });
    hold(sim, ["move_down"], 0.04); // line up with the water gap (y 150–222)
    hold(sim, ["move_right"], 4);
    return sim;
  };
  it("water blocks when it is in the mask and the player stops at the wall", () => {
    const sim = go(true);
    expect(Number(sim.hud().x)).toBeLessThanOrEqual(276);
    expect(sim.summary().waterHits).toBeGreaterThan(0);
  });
  it("removing water from the mask allows the path and reaches the goal", () => {
    const sim = go(false);
    expect(Number(sim.hud().x)).toBeGreaterThan(324);
    expect(sim.summary().reachedGoal).toBe(true);
  });
  it("counts a held push against a wall as one hit, not one per frame", () => {
    const sim = createCollisionSim({ kind: "collision", v: 1, speed: 160, maskWalls: true, maskWater: true });
    hold(sim, ["move_up"], 1);
    hold(sim, ["move_right"], 2);
    expect(sim.summary().wallHits).toBe(1);
  });
});

describe("input", () => {
  it("raw diagonal is ~1.41×, normalized is 1.00×", () => {
    const raw = createInputSim({ kind: "input", v: 1, normalizeDiagonal: false, dashMode: "held", dashKey: "Space" });
    hold(raw, ["move_right", "move_down"], 0.6);
    expect(raw.summary().diagonalSpeedRatio).toBeCloseTo(1.41, 2);
    const norm = createInputSim({ kind: "input", v: 1, normalizeDiagonal: true, dashMode: "held", dashKey: "Space" });
    hold(norm, ["move_right", "move_down"], 0.6);
    expect(norm.summary().diagonalSpeedRatio).toBeLessThanOrEqual(1.01);
    expect(norm.summary().diagonalTicks).toBeGreaterThanOrEqual(30);
  });
  it("held dash fires every step; just-pressed fires once per press", () => {
    const held = createInputSim({ kind: "input", v: 1, normalizeDiagonal: true, dashMode: "held", dashKey: "Space" });
    hold(held, ["dash"], 0.5);
    expect(held.summary()).toMatchObject({ dashPresses: 1, dashActivations: 30 });
    const once = createInputSim({ kind: "input", v: 1, normalizeDiagonal: true, dashMode: "just_pressed", dashKey: "Space" });
    hold(once, ["dash"], 0.5);
    expect(once.summary()).toMatchObject({ dashPresses: 1, dashActivations: 1 });
  });
});

describe("signals", () => {
  const base: ConfigOf<"signals"> = {
    kind: "signals", v: 1, coinsRequired: 1, emitWhileOverlapping: false,
    connections: { "coin.body_entered": "add_score", "score.goal_reached": "open_door", "exit.body_entered": "win_game" },
  };
  // Path from start (40,168) to coin 0 at (120,80): up then right, then wait on it.
  const toCoin = (sim: Sim) => {
    hold(sim, ["move_up"], 0.6);
    hold(sim, ["move_right"], 0.55);
    hold(sim, [], 1);
  };
  it("body_entered fires once while standing on the coin", () => {
    const sim = createSignalsSim(base);
    toCoin(sim);
    expect(sim.summary()).toMatchObject({ coinEvents: 1, score: 1, doorOpened: true });
  });
  it("the overlapping bug fires repeatedly", () => {
    const sim = createSignalsSim({ ...base, emitWhileOverlapping: true });
    toCoin(sim);
    expect(sim.summary().coinEvents as number).toBeGreaterThan(30);
  });
  it("correct connections open the door and allow winning; trace records order", () => {
    const sim = createSignalsSim(base);
    toCoin(sim);
    hold(sim, ["move_down"], 0.6);
    hold(sim, ["move_right"], 3.5);
    expect(sim.summary().won).toBe(true);
    expect(sim.trace()).toEqual(["coin.body_entered → add_score", "score.goal_reached → open_door", "exit.body_entered → win_game"]);
  });
  it("without open_door the closed door blocks the exit", () => {
    const sim = createSignalsSim({ ...base, connections: { ...base.connections, "score.goal_reached": "none" } });
    toCoin(sim);
    hold(sim, ["move_down"], 0.6);
    hold(sim, ["move_right"], 3.5);
    expect(sim.summary().won).toBe(false);
  });
});

describe("state", () => {
  it("stale restart keeps lives at zero and re-loses; clean restart resets", () => {
    const stale = createStateSim({ kind: "state", v: 1, lives: 1, goal: 3, resetScoreOnRestart: false, resetLivesOnRestart: false });
    for (let i = 0; i < 40 && stale.phase() !== "lost"; i++) {
      hold(stale, ["move_left"], 0.5);
      hold(stale, ["move_right"], 0.5);
    }
    expect(stale.phase()).toBe("lost");
    stale.restart();
    expect(stale.phase()).toBe("lost");
    expect(stale.summary().staleRestarts).toBe(1);

    const clean = createStateSim({ kind: "state", v: 1, lives: 1, goal: 3, resetScoreOnRestart: true, resetLivesOnRestart: true });
    for (let i = 0; i < 40 && clean.phase() !== "lost"; i++) {
      hold(clean, ["move_left"], 0.5);
      hold(clean, ["move_right"], 0.5);
    }
    clean.restart();
    expect(clean.phase()).toBe("playing");
    expect(clean.summary()).toMatchObject({ cleanRestarts: 1, score: 0, lives: 1 });
  });
});

describe("timer", () => {
  it("one-shot countdown fires once and stops spawning; repeating fires again", () => {
    const one = createTimerSim({ kind: "timer", v: 1, countdownSeconds: 10, countdownOneShot: true, spawnInterval: 1, capEnabled: true, maxEntities: 5 });
    hold(one, [], 25);
    expect(one.summary().countdownTimeouts).toBe(1);
    const spawned = one.summary().spawned;
    hold(one, [], 5);
    expect(one.summary().spawned).toBe(spawned);
    const rep = createTimerSim({ kind: "timer", v: 1, countdownSeconds: 10, countdownOneShot: false, spawnInterval: 1, capEnabled: true, maxEntities: 5 });
    hold(rep, [], 25);
    expect(rep.summary().countdownTimeouts).toBe(2);
  });
  it("cap bounds live entities; uncapped still stops at the hard limit", () => {
    const capped = createTimerSim({ kind: "timer", v: 1, countdownSeconds: 60, countdownOneShot: true, spawnInterval: 0.5, capEnabled: true, maxEntities: 8 });
    hold(capped, [], 30);
    expect(capped.summary().maxAlive).toBeLessThanOrEqual(8);
    const open = createTimerSim({ kind: "timer", v: 1, countdownSeconds: 60, countdownOneShot: false, spawnInterval: 0.5, capEnabled: false, maxEntities: 8 });
    hold(open, [], 59);
    expect(open.summary().maxAlive).toBe(100);
  });
  it("is deterministic for the same seed", () => {
    const a = createTimerSim({ kind: "timer", v: 1, countdownSeconds: 20, countdownOneShot: true, spawnInterval: 0.7, capEnabled: true, maxEntities: 10 });
    const b = createTimerSim({ kind: "timer", v: 1, countdownSeconds: 20, countdownOneShot: true, spawnInterval: 0.7, capEnabled: true, maxEntities: 10 });
    hold(a, ["move_left"], 6);
    hold(b, ["move_left"], 6);
    expect(a.summary()).toEqual(b.summary());
    expect(a.describe("en")).toEqual(b.describe("en"));
  });
});

describe("mini-game loop", () => {
  it("buggy exit rule opens early; buggy restart keeps coins taken", () => {
    const sim = createLoopSim({ kind: "loop", v: 1, exitRule: "score_gt_zero", restartRule: "keep_coins", lives: 3 });
    hold(sim, ["move_up"], 0.75);
    hold(sim, ["move_right"], 0.6);
    expect(sim.summary()).toMatchObject({ score: 1, exitOpenedEarly: true });
    sim.restart();
    expect(sim.summary()).toMatchObject({ score: 0, cleanRestarts: 0 });
  });
  it("fixed rules give a clean restart", () => {
    const sim = createLoopSim({ kind: "loop", v: 1, exitRule: "score_ge_total", restartRule: "reset_coins", lives: 3 });
    hold(sim, ["move_up"], 0.75);
    hold(sim, ["move_right"], 0.6);
    sim.restart();
    expect(sim.summary()).toMatchObject({ exitOpenedEarly: false, cleanRestarts: 1 });
  });
});

describe("scene composer", () => {
  const initial = LESSONS[0].activity.initialConfig as ConfigOf<"scene">;
  it("prevents cycles and computes global positions", () => {
    let c = reparent(initial, "n2", "n1");
    c = reparent(c, "n1", "n2"); // would create a cycle: ignored
    expect(c.nodes.find((n) => n.id === "n1")!.parent).toBeNull();
    c = reparent(c, "n3", "n2");
    expect(globalPosition(c.nodes, "n3")).toEqual({ x: 140, y: 100 });
    c = moveNode(c, "n1", 10, 0);
    expect(globalPosition(c.nodes, "n3")).toEqual({ x: 150, y: 100 });
  });
  it("structure and prediction checks pass only when correct", () => {
    expect(runChecks(["scene.structure"], initial, {})[0].passed).toBe(false);
    let c = reparent(reparent(initial, "n2", "n1"), "n3", "n2");
    c = addNode(c, "CollisionShape2D", "n2");
    expect(runChecks(["scene.structure", "scene.predict_global"], { ...c, prediction: { x: 140, y: 100 } }, {}).map((r) => r.passed)).toEqual([true, true]);
    expect(runChecks(["scene.predict_global"], { ...c, prediction: { x: 100, y: 80 } }, {})[0].passed).toBe(false);
    expect(removeNode(c, "n2").nodes.find((n) => n.id === "n3")!.parent).toBe("n1");
  });
});

describe("checks registry", () => {
  it("initial configs fail every config check (there is something to learn)", () => {
    for (const l of LESSONS.slice(1)) {
      const results = runChecks(l.checks, l.activity.initialConfig, {});
      expect(results.some((r) => !r.passed), l.key).toBe(true);
    }
  });
  it("rejects checks from another activity kind", () => {
    const movement = LESSONS[1].activity.initialConfig;
    expect(runChecks(["loop.win_path"], movement, { wins: 5 })[0].passed).toBe(false);
  });
  it("step actions are deterministic", () => {
    const a = createLoopSim(loopInitial);
    const b = createLoopSim(loopInitial);
    const ia = new InputState();
    const ib = new InputState();
    for (const step of ["right", "right", "up", "wait"]) {
      const action = { id: step, label: { id: "", en: "" }, hold: step === "wait" ? [] : [step === "up" ? "move_up" : "move_right"] as Action[], seconds: 0.25 };
      runStepAction(a, ia, action);
      runStepAction(b, ib, action);
    }
    expect(a.describe("id")).toBe(b.describe("id"));
  });
});

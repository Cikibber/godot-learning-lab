// Registry of predefined, versioned check functions. Content refers to these
// by ID only. The same functions run in the browser (formative feedback) and
// on the server (recomputation before saving and when a teacher reviews).
//
// "config" checks are fully recomputable from the saved configuration.
// "summary" checks depend on what happened during play; the server validates
// their shape and bounds but they remain student-supplied evidence.
import type { ActivityConfig, ActivityKind, ConfigOf, SceneNode, Summary } from "./schema";

type CheckDef<K extends ActivityKind> = {
  kind: K;
  source: "config" | "summary";
  run: (config: ConfigOf<K>, summary: Summary) => boolean;
};

const num = (s: Summary, k: string) => (typeof s[k] === "number" ? (s[k] as number) : 0);
const flag = (s: Summary, k: string) => s[k] === true;

export function globalPosition(nodes: SceneNode[], id: string): { x: number; y: number } | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let x = 0;
  let y = 0;
  let cur = byId.get(id);
  let guard = 0;
  while (cur && guard++ < 12) {
    x += cur.x;
    y += cur.y;
    cur = cur.parent ? byId.get(cur.parent) : undefined;
  }
  return guard > 11 ? null : { x, y };
}

/** The CharacterBody2D that has both a Sprite2D and a CollisionShape2D child, under a root Node2D. */
export function findPlayer(nodes: SceneNode[]): SceneNode | undefined {
  return nodes.find((n) => {
    if (n.type !== "CharacterBody2D" || !n.parent) return false;
    const parent = nodes.find((p) => p.id === n.parent);
    if (!parent || parent.type !== "Node2D" || parent.parent !== null) return false;
    const kids = nodes.filter((c) => c.parent === n.id).map((c) => c.type);
    return kids.includes("Sprite2D") && kids.includes("CollisionShape2D");
  });
}

export const CHECKS = {
  "scene.structure": {
    kind: "scene",
    source: "config",
    run: (c) => findPlayer(c.nodes) !== undefined,
  } satisfies CheckDef<"scene">,
  "scene.predict_global": {
    kind: "scene",
    source: "config",
    run: (c) => {
      const player = findPlayer(c.nodes);
      const sprite = player && c.nodes.find((n) => n.parent === player.id && n.type === "Sprite2D");
      const g = sprite && globalPosition(c.nodes, sprite.id);
      return !!g && !!c.prediction && c.prediction.x === g.x && c.prediction.y === g.y;
    },
  } satisfies CheckDef<"scene">,

  "movement.reach_target": {
    kind: "movement",
    source: "summary",
    run: (_c, s) => flag(s, "reachedTarget"),
  } satisfies CheckDef<"movement">,
  "movement.speed_changed": {
    kind: "movement",
    source: "config",
    run: (c) => c.speed !== 120,
  } satisfies CheckDef<"movement">,
  "movement.delta_compared": {
    kind: "movement",
    source: "summary",
    run: (c, s) => c.useDelta && flag(s, "comparedWithoutDelta"),
  } satisfies CheckDef<"movement">,

  "collision.blocked": {
    kind: "collision",
    source: "summary",
    run: (_c, s) => num(s, "wallHits") > 0,
  } satisfies CheckDef<"collision">,
  "collision.mask_configured": {
    kind: "collision",
    source: "config",
    run: (c) => c.maskWalls && !c.maskWater,
  } satisfies CheckDef<"collision">,
  "collision.reach_goal": {
    kind: "collision",
    source: "summary",
    run: (_c, s) => flag(s, "reachedGoal"),
  } satisfies CheckDef<"collision">,

  "input.normalized": {
    kind: "input",
    source: "config",
    run: (c) => c.normalizeDiagonal,
  } satisfies CheckDef<"input">,
  "input.diagonal_tested": {
    kind: "input",
    source: "summary",
    run: (_c, s) => num(s, "diagonalTicks") >= 30 && num(s, "diagonalSpeedRatio") <= 1.01,
  } satisfies CheckDef<"input">,
  "input.just_pressed": {
    kind: "input",
    source: "config",
    run: (c) => c.dashMode === "just_pressed",
  } satisfies CheckDef<"input">,

  "signals.connections": {
    kind: "signals",
    source: "config",
    run: (c) =>
      c.connections["coin.body_entered"] === "add_score" &&
      c.connections["score.goal_reached"] === "open_door" &&
      c.connections["exit.body_entered"] === "win_game",
  } satisfies CheckDef<"signals">,
  "signals.single_entry": {
    kind: "signals",
    source: "config",
    run: (c) => !c.emitWhileOverlapping,
  } satisfies CheckDef<"signals">,
  "signals.won": {
    kind: "signals",
    source: "summary",
    run: (_c, s) => flag(s, "won"),
  } satisfies CheckDef<"signals">,

  "state.reset_clean": {
    kind: "state",
    source: "config",
    run: (c) => c.resetScoreOnRestart && c.resetLivesOnRestart,
  } satisfies CheckDef<"state">,
  "state.reached_won": {
    kind: "state",
    source: "summary",
    run: (_c, s) => num(s, "wins") > 0,
  } satisfies CheckDef<"state">,
  "state.reached_lost": {
    kind: "state",
    source: "summary",
    run: (_c, s) => num(s, "losses") > 0,
  } satisfies CheckDef<"state">,
  "state.restart_tested": {
    kind: "state",
    source: "summary",
    run: (_c, s) => num(s, "cleanRestarts") > 0,
  } satisfies CheckDef<"state">,

  "timer.oneshot_countdown": {
    kind: "timer",
    source: "config",
    run: (c) => c.countdownOneShot,
  } satisfies CheckDef<"timer">,
  "timer.bounded_spawn": {
    kind: "timer",
    source: "config",
    run: (c) => c.capEnabled && c.maxEntities <= 30,
  } satisfies CheckDef<"timer">,
  "timer.ran_to_timeout": {
    kind: "timer",
    source: "summary",
    run: (_c, s) => num(s, "countdownTimeouts") >= 1,
  } satisfies CheckDef<"timer">,

  "loop.bug_exit_fixed": {
    kind: "loop",
    source: "config",
    run: (c) => c.exitRule === "score_ge_total",
  } satisfies CheckDef<"loop">,
  "loop.bug_restart_fixed": {
    kind: "loop",
    source: "config",
    run: (c) => c.restartRule === "reset_coins",
  } satisfies CheckDef<"loop">,
  "loop.win_path": {
    kind: "loop",
    source: "summary",
    run: (_c, s) => num(s, "wins") > 0,
  } satisfies CheckDef<"loop">,
  "loop.lose_path": {
    kind: "loop",
    source: "summary",
    run: (_c, s) => num(s, "losses") > 0,
  } satisfies CheckDef<"loop">,
  "loop.restart_path": {
    kind: "loop",
    source: "summary",
    run: (_c, s) => num(s, "cleanRestarts") > 0,
  } satisfies CheckDef<"loop">,
} as const;

export type CheckId = keyof typeof CHECKS;

export function isCheckId(id: string): id is CheckId {
  return Object.hasOwn(CHECKS, id);
}

export function runChecks(ids: readonly string[], config: ActivityConfig, summary: Summary) {
  return ids.map((id) => {
    if (!isCheckId(id)) return { id, passed: false, source: "config" as const };
    const def = CHECKS[id] as CheckDef<ActivityKind>;
    const passed = def.kind === config.kind && (def.run as (c: ActivityConfig, s: Summary) => boolean)(config, summary);
    return { id, passed, source: def.source };
  });
}

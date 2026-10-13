// Versioned, discriminated configuration schemas for the eight activities.
// Content files provide an initial config; students change only these bounded
// fields. Nothing here can carry executable content.
import { z } from "zod";

export const ACTIVITY_KINDS = [
  "scene",
  "movement",
  "collision",
  "input",
  "signals",
  "state",
  "timer",
  "loop",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const SCENE_NODE_TYPES = [
  "Node2D",
  "CharacterBody2D",
  "Sprite2D",
  "CollisionShape2D",
  "Camera2D",
  "Label",
] as const;

const sceneNode = z.object({
  id: z.string().regex(/^n[0-9]{1,2}$/),
  type: z.enum(SCENE_NODE_TYPES),
  name: z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,23}$/),
  parent: z.string().regex(/^n[0-9]{1,2}$/).nullable(),
  x: z.number().int().min(-400).max(400),
  y: z.number().int().min(-400).max(400),
});
export type SceneNode = z.infer<typeof sceneNode>;

export const sceneConfig = z.object({
  kind: z.literal("scene"),
  v: z.literal(1),
  nodes: z.array(sceneNode).min(1).max(10),
  prediction: z
    .object({ x: z.number().int().min(-2000).max(2000), y: z.number().int().min(-2000).max(2000) })
    .nullable(),
});

export const movementConfig = z.object({
  kind: z.literal("movement"),
  v: z.literal(1),
  speed: z.number().int().min(40).max(400),
  useDelta: z.boolean(),
});

export const collisionConfig = z.object({
  kind: z.literal("collision"),
  v: z.literal(1),
  speed: z.number().int().min(60).max(300),
  maskWalls: z.boolean(),
  maskWater: z.boolean(),
});

export const BINDABLE_KEYS = ["KeyA", "KeyD", "KeyW", "KeyS", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyJ"] as const;

export const inputConfig = z.object({
  kind: z.literal("input"),
  v: z.literal(1),
  normalizeDiagonal: z.boolean(),
  dashMode: z.enum(["held", "just_pressed"]),
  dashKey: z.enum(["Space", "KeyJ"]),
});

export const SIGNALS = ["coin.body_entered", "score.goal_reached", "exit.body_entered"] as const;
export const ACTIONS = ["none", "add_score", "open_door", "win_game", "play_sound"] as const;

export const signalsConfig = z.object({
  kind: z.literal("signals"),
  v: z.literal(1),
  coinsRequired: z.number().int().min(1).max(5),
  emitWhileOverlapping: z.boolean(),
  connections: z.object({
    "coin.body_entered": z.enum(ACTIONS),
    "score.goal_reached": z.enum(ACTIONS),
    "exit.body_entered": z.enum(ACTIONS),
  }),
});

export const stateConfig = z.object({
  kind: z.literal("state"),
  v: z.literal(1),
  lives: z.number().int().min(1).max(5),
  goal: z.number().int().min(1).max(10),
  resetScoreOnRestart: z.boolean(),
  resetLivesOnRestart: z.boolean(),
});

export const timerConfig = z.object({
  kind: z.literal("timer"),
  v: z.literal(1),
  countdownSeconds: z.number().int().min(10).max(60),
  countdownOneShot: z.boolean(),
  spawnInterval: z.number().min(0.5).max(5),
  capEnabled: z.boolean(),
  maxEntities: z.number().int().min(1).max(30),
});

export const EXIT_FIXES = ["score_gt_zero", "always", "score_ge_total"] as const;
export const RESTART_FIXES = ["keep_coins", "reset_coins"] as const;

export const loopConfig = z.object({
  kind: z.literal("loop"),
  v: z.literal(1),
  exitRule: z.enum(EXIT_FIXES),
  restartRule: z.enum(RESTART_FIXES),
  lives: z.number().int().min(1).max(5),
});

export const activityConfig = z.discriminatedUnion("kind", [
  sceneConfig,
  movementConfig,
  collisionConfig,
  inputConfig,
  signalsConfig,
  stateConfig,
  timerConfig,
  loopConfig,
]);
export type ActivityConfig = z.infer<typeof activityConfig>;
export type ConfigOf<K extends ActivityKind> = Extract<ActivityConfig, { kind: K }>;

// Bounded summary: a handful of scalar facts, never telemetry.
export const summarySchema = z
  .record(z.string().regex(/^[a-zA-Z]{1,32}$/), z.union([z.number().finite(), z.string().max(80), z.boolean()]))
  .refine((r) => Object.keys(r).length <= 24, "too many summary fields");
export type Summary = z.infer<typeof summarySchema>;

export const checkResultSchema = z.object({
  id: z.string().max(40),
  passed: z.boolean(),
});
export type CheckResult = z.infer<typeof checkResultSchema>;

export const evidenceSchema = z.object({
  contentVersion: z.number().int().positive(),
  config: activityConfig,
  checkResults: z.array(checkResultSchema).max(20),
  summary: summarySchema,
});
export type Evidence = z.infer<typeof evidenceSchema>;

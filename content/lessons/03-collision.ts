import type { LessonContent } from "@/lib/validation/content";
import { GODOT_VERSION, t } from "./helpers";

export const BODY_MOVE = `extends CharacterBody2D

@export var speed: float = 160.0

func _physics_process(_delta: float) -> void:
    var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = direction * speed
    move_and_slide()
`;

export const lesson: LessonContent = {
  key: "collision",
  version: 1,
  module: 3,
  kind: "collision",
  godotVersion: GODOT_VERSION,
  title: t("Tabrakan", "Collisions"),
  summary: t(
    "Bergerak di antara dinding, lalu atur layer dan mask agar air tidak menghalangi.",
    "Move between walls, then set layers and masks so water stops blocking you.",
  ),
  minutes: { explain: 10, practice: 15 },
  objective: t(
    "Menjelaskan `CharacterBody2D`, `velocity`, `move_and_slide()`, dan collision layer/mask.",
    "Explain `CharacterBody2D`, `velocity`, `move_and_slide()`, and collision layers/masks.",
  ),
  whyGodot: t(
    "Dinding, lantai, dan musuh di Godot bekerja lewat tabrakan. Layer dan mask menentukan siapa menabrak siapa.",
    "Walls, floors, and enemies in Godot work through collisions. Layers and masks decide who collides with whom.",
  ),
  explanation: [
    { type: "p", text: t(
      "`CharacterBody2D` adalah node yang kamu gerakkan dengan kode dan berhenti saat menabrak. Ia butuh anak `CollisionShape2D` agar punya bentuk.",
      "`CharacterBody2D` is a node you move with code that stops when it hits something. It needs a `CollisionShape2D` child to have a shape.",
    ) },
    { type: "p", text: t(
      "`velocity` adalah kecepatan dalam piksel per detik. `move_and_slide()` sudah memakai langkah waktu fisika, jadi JANGAN kalikan velocity dengan delta.",
      "`velocity` is speed in pixels per second. `move_and_slide()` already uses the physics timestep, so DO NOT multiply velocity by delta.",
    ) },
    { type: "p", text: t(
      "Kode fisika ditulis di `_physics_process`, yang berjalan dengan laju tetap (default 60 kali per detik).",
      "Physics code goes in `_physics_process`, which runs at a fixed rate (60 times per second by default).",
    ) },
    { type: "list", items: [
      t("Collision layer: di layer mana objek ini berada.", "Collision layer: which layers this object is on."),
      t("Collision mask: layer mana yang dideteksi/ditabrak objek ini.", "Collision mask: which layers this object detects/collides with."),
    ] },
  ],
  workedExample: [
    { type: "code", code: BODY_MOVE, caption: t("Pengendali top-down dengan `CharacterBody2D`", "Top-down controller with `CharacterBody2D`") },
    { type: "callout", tone: "warning", text: t(
      "Bandingkan dengan Modul 2: `Node2D` memakai `position += ... * delta`. `CharacterBody2D` memakai `velocity` tanpa delta lalu `move_and_slide()`. Dua model gerak yang berbeda.",
      "Compare with Module 2: `Node2D` uses `position += ... * delta`. `CharacterBody2D` uses `velocity` without delta, then `move_and_slide()`. Two different movement models.",
    ) },
  ],
  activity: {
    name: t("Lab Tabrakan", "Collision Lab"),
    instructions: [
      t("Gerakkan pemain dan tabrak dinding abu-abu. Perhatikan pemain berhenti.", "Move the player and bump into the grey walls. Notice the player stops."),
      t("Kolam biru ada di layer 2 (Air). Pemain saat ini mendeteksi layer 1 (Dinding) dan layer 2.", "The blue pool is on layer 2 (Water). The player currently detects layer 1 (Walls) and layer 2."),
      t("Ubah mask pemain agar bisa melewati air tetapi tetap tertahan dinding, lalu capai bendera.", "Change the player's mask so it can pass through water but is still blocked by walls, then reach the flag."),
    ],
    hints: [
      t("Hanya mask pemain yang perlu diubah. Dinding harus tetap memblokir.", "Only the player's mask needs to change. Walls must keep blocking."),
      t("Jalan lewat atas terlalu sempit; jalan pintas ada di kolam.", "The top route is too narrow; the shortcut goes through the pool."),
    ],
    initialConfig: { kind: "collision", v: 1, speed: 160, maskWalls: true, maskWater: true },
    limits: { maxEntities: 20, maxSeconds: 1200 },
  },
  checks: ["collision.blocked", "collision.mask_configured", "collision.reach_goal"],
  checkLabels: {
    "collision.blocked": t("Pernah tertahan dinding", "Was blocked by a wall"),
    "collision.mask_configured": t("Mask: Dinding aktif, Air nonaktif", "Mask: Walls on, Water off"),
    "collision.reach_goal": t("Mencapai bendera", "Reached the flag"),
  },
  fidelity: {
    teaches: t("Gerak terblokir, layer dan mask, serta velocity dalam piksel per detik.", "Blocked motion, layers and masks, and velocity in pixels per second."),
    differs: [
      t("Ini pemecah kotak sejajar sumbu (AABB) sederhana, BUKAN mesin fisika Godot.", "This is a simple axis-aligned box (AABB) solver, NOT Godot's physics engine."),
      t("Tidak ada lereng, sudut lantai, rotasi, atau perilaku `move_and_slide()` yang persis.", "There are no slopes, floor angles, rotation, or exact `move_and_slide()` behaviour."),
      t("Godot punya 32 layer; di sini hanya dua.", "Godot has 32 layers; here there are only two."),
    ],
  },
  misconceptions: [
    t("Velocity harus dikalikan delta sebelum move_and_slide(). (Salah.)", "Velocity must be multiplied by delta before move_and_slide(). (Wrong.)"),
    t("Layer dan mask itu sama. (Layer = di mana aku; mask = apa yang kudeteksi.)", "Layer and mask are the same. (Layer = where I am; mask = what I detect.)"),
  ],
  quiz: {
    prompt: t("Apa yang salah pada kode ini?", "What is wrong with this code?"),
    code: "func _physics_process(delta: float) -> void:\n    velocity = direction * speed * delta\n    move_and_slide()",
    options: [
      t("Tidak ada yang salah.", "Nothing is wrong."),
      t("velocity tidak boleh dikalikan delta; move_and_slide() sudah memakai langkah waktu.", "velocity should not be multiplied by delta; move_and_slide() already uses the timestep."),
      t("move_and_slide() harus dipanggil di _ready().", "move_and_slide() must be called in _ready()."),
    ],
    answer: 1,
    explanation: t("Dengan delta, pemain bergerak sekitar 60 kali lebih lambat dari yang diharapkan.", "With delta, the player moves about 60 times slower than intended."),
  },
  reflection: t(
    "Jelaskan dengan kata-katamu sendiri perbedaan collision layer dan collision mask, memakai contoh dari lab.",
    "Explain in your own words the difference between collision layer and collision mask, using an example from the lab.",
  ),
  transfer: {
    steps: [
      t("Buka scene Player (CharacterBody2D) dari Modul 1. Beri `CollisionShape2D` bentuk RectangleShape2D.", "Open the Player scene (CharacterBody2D) from Module 1. Give `CollisionShape2D` a RectangleShape2D shape."),
      t("Lampirkan skrip di bawah. Pastikan aksi Input Map dari Modul 2 ada.", "Attach the script below. Make sure the Input Map actions from Module 2 exist."),
      t("Buat dinding dengan `StaticBody2D` + `CollisionShape2D`.", "Create walls with `StaticBody2D` + `CollisionShape2D`."),
      t("Di Inspector → Collision, ubah Layer dan Mask lalu uji kapan pemain tertahan.", "In Inspector → Collision, change Layer and Mask and test when the player is blocked."),
    ],
    snippet: BODY_MOVE,
    question: t(
      "Mengapa skrip ini memakai `_physics_process` dan tidak mengalikan `velocity` dengan delta?",
      "Why does this script use `_physics_process` and not multiply `velocity` by delta?",
    ),
  },
};

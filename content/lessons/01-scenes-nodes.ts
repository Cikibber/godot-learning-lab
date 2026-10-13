import type { LessonContent } from "@/lib/validation/content";
import { GODOT_VERSION, t } from "./helpers";

export const lesson: LessonContent = {
  key: "scenes-nodes",
  version: 1,
  module: 1,
  kind: "scene",
  godotVersion: GODOT_VERSION,
  title: t("Scene dan node", "Scenes and nodes"),
  summary: t(
    "Susun pohon node kecil dan lihat bagaimana posisi anak mengikuti induknya.",
    "Arrange a small node tree and see how a child's position follows its parent.",
  ),
  minutes: { explain: 8, practice: 15 },
  objective: t(
    "Menjelaskan hubungan induk-anak node dan perbedaan posisi lokal dan global.",
    "Explain parent-child node relationships and the difference between local and global position.",
  ),
  whyGodot: t(
    "Setiap game Godot dibangun dari node yang disusun menjadi scene. Pemain, musuh, dan HUD semuanya scene.",
    "Every Godot game is built from nodes arranged into scenes. The player, enemies, and HUD are all scenes.",
  ),
  explanation: [
    { type: "p", text: t(
      "Node adalah blok bangunan terkecil di Godot. Setiap node punya tugas: `Sprite2D` menampilkan gambar, `CollisionShape2D` memberi bentuk tabrakan, `CharacterBody2D` bergerak dan bertabrakan.",
      "A node is Godot's smallest building block. Each node has a job: `Sprite2D` shows an image, `CollisionShape2D` provides a collision shape, `CharacterBody2D` moves and collides.",
    ) },
    { type: "p", text: t(
      "Node disusun sebagai pohon. Satu pohon yang disimpan disebut scene. Scene bisa di-instance (dipakai ulang) di dalam scene lain, misalnya scene Player di dalam scene Level.",
      "Nodes are arranged as a tree. A saved tree is called a scene. A scene can be instanced (reused) inside another scene, for example a Player scene inside a Level scene.",
    ) },
    { type: "list", items: [
      t("`position` adalah posisi lokal: relatif terhadap induk.", "`position` is the local position: relative to the parent."),
      t("`global_position` adalah posisi di dunia: posisi induk ditambah posisi lokal (untuk kasus tanpa rotasi/skala).", "`global_position` is the world position: the parent's position plus the local position (when there is no rotation/scale)."),
      t("Saat induk bergerak, semua anaknya ikut bergerak.", "When a parent moves, all its children move with it."),
    ] },
  ],
  workedExample: [
    { type: "p", text: t(
      "Main (Node2D) di (40, 30). Player di dalam Main dengan posisi lokal (100, 80). Posisi global Player = (40+100, 30+80) = (140, 110).",
      "Main (Node2D) is at (40, 30). Player is inside Main with local position (100, 80). Player's global position = (40+100, 30+80) = (140, 110).",
    ) },
    { type: "code", code: "Main (Node2D)\n└─ Player (CharacterBody2D)\n   ├─ Sprite2D\n   └─ CollisionShape2D", caption: t("Struktur scene Player yang umum", "A common Player scene structure") },
  ],
  activity: {
    name: t("Penyusun Scene", "Scene Composer"),
    instructions: [
      t("Jadikan Player (CharacterBody2D) anak dari Main.", "Make Player (CharacterBody2D) a child of Main."),
      t("Pastikan Player punya anak Sprite2D dan CollisionShape2D. Tambahkan node jika perlu.", "Make sure Player has a Sprite2D and a CollisionShape2D child. Add nodes if needed."),
      t("Geser Main dan perhatikan posisi global anak-anaknya.", "Move Main and watch its children's global positions."),
      t("Tulis prediksi posisi global Sprite2D, lalu jalankan pemeriksaan.", "Enter your prediction of the Sprite2D global position, then run the checks."),
    ],
    hints: [
      t("Pilih node, lalu pilih induk barunya dari daftar \"Induk\".", "Select a node, then choose its new parent from the \"Parent\" list."),
      t("Posisi global = jumlah posisi lokal node dan semua leluhurnya.", "Global position = the sum of the local positions of the node and all its ancestors."),
    ],
    initialConfig: {
      kind: "scene",
      v: 1,
      nodes: [
        { id: "n1", type: "Node2D", name: "Main", parent: null, x: 40, y: 30 },
        { id: "n2", type: "CharacterBody2D", name: "Player", parent: null, x: 100, y: 80 },
        { id: "n3", type: "Sprite2D", name: "Sprite2D", parent: "n1", x: 0, y: -10 },
      ],
      prediction: null,
    },
    limits: { maxEntities: 10, maxSeconds: 1200 },
  },
  checks: ["scene.structure", "scene.predict_global"],
  checkLabels: {
    "scene.structure": t("Main → Player (CharacterBody2D) → Sprite2D + CollisionShape2D", "Main → Player (CharacterBody2D) → Sprite2D + CollisionShape2D"),
    "scene.predict_global": t("Prediksi posisi global Sprite2D tepat", "Sprite2D global position prediction is correct"),
  },
  fidelity: {
    teaches: t("Hubungan induk-anak dan posisi lokal versus global.", "Parent-child relationships and local versus global position."),
    differs: [
      t("Ini model sebagian. Tidak ada SceneTree lengkap, siklus hidup node, rotasi, skala, atau Inspector.", "This is a partial model. There is no full SceneTree, node lifecycle, rotation, scale, or Inspector."),
      t("Editor Godot asli memakai dock Scene dan Inspector; di sini hanya tombol dan daftar.", "The real Godot editor uses the Scene dock and Inspector; here there are only buttons and lists."),
    ],
  },
  misconceptions: [
    t("Posisi yang tertulis di Inspector selalu posisi di layar. (Salah: itu posisi lokal.)", "The position in the Inspector is always the screen position. (Wrong: it is the local position.)"),
    t("Scene dan node adalah hal yang berbeda sama sekali. (Scene adalah pohon node yang disimpan.)", "Scenes and nodes are completely different things. (A scene is a saved tree of nodes.)"),
  ],
  quiz: {
    prompt: t("Apa yang dicetak kode ini?", "What does this code print?"),
    code: "# Parent is at (50, 0). This node's position is (10, 20).\nprint(global_position)",
    options: [t("(10, 20)", "(10, 20)"), t("(60, 20)", "(60, 20)"), t("(50, 0)", "(50, 0)")],
    answer: 1,
    explanation: t("Global = induk (50, 0) + lokal (10, 20) = (60, 20).", "Global = parent (50, 0) + local (10, 20) = (60, 20)."),
  },
  reflection: t(
    "Mengapa memisahkan Player menjadi scene sendiri berguna saat membuat beberapa level?",
    "Why is it useful to make Player its own scene when building several levels?",
  ),
  transfer: {
    steps: [
      t("Buat scene baru dengan root `CharacterBody2D`, beri nama Player.", "Create a new scene with a `CharacterBody2D` root named Player."),
      t("Tambahkan anak `Sprite2D` dan `CollisionShape2D`. Simpan sebagai player.tscn.", "Add `Sprite2D` and `CollisionShape2D` children. Save as player.tscn."),
      t("Buat scene Main (`Node2D`) dan instance player.tscn dengan tombol rantai (Instantiate Child Scene).", "Create a Main scene (`Node2D`) and instance player.tscn with the chain button (Instantiate Child Scene)."),
      t("Ubah posisi Main di Inspector dan amati Player ikut bergerak.", "Change Main's position in the Inspector and watch Player move with it."),
    ],
    snippet: null,
    question: t(
      "Di Godot, setelah meng-instance Player, apa yang terjadi pada Player saat kamu menggeser Main? Jelaskan dengan istilah posisi lokal dan global.",
      "In Godot, after instancing Player, what happens to Player when you move Main? Explain using local and global position.",
    ),
  },
};

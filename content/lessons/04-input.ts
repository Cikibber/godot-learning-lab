import type { LessonContent } from "@/lib/validation/content";
import { GODOT_VERSION, t } from "./helpers";

export const INPUT_SNIPPET = `extends CharacterBody2D

@export var speed: float = 160.0
@export var dash_speed: float = 480.0

func _physics_process(_delta: float) -> void:
    var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = direction * speed
    if Input.is_action_just_pressed("dash"):
        velocity = direction * dash_speed
    move_and_slide()
`;

export const lesson: LessonContent = {
  key: "input-feel",
  version: 1,
  module: 4,
  kind: "input",
  godotVersion: GODOT_VERSION,
  title: t("Input dan rasa kontrol", "Input and player feel"),
  summary: t(
    "Perbaiki gerakan diagonal yang terlalu cepat dan bedakan tombol ditahan dengan baru ditekan.",
    "Fix diagonal movement that is too fast and tell held keys from just-pressed keys.",
  ),
  minutes: { explain: 8, practice: 15 },
  objective: t(
    "Memakai aksi bernama, menormalkan arah diagonal, dan membedakan `is_action_pressed` dengan `is_action_just_pressed`.",
    "Use named actions, normalize diagonal direction, and distinguish `is_action_pressed` from `is_action_just_pressed`.",
  ),
  whyGodot: t(
    "Kontrol yang terasa adil membuat game menyenangkan. Pemain menyadari jika berjalan diagonal lebih cepat.",
    "Controls that feel fair make a game fun. Players notice when walking diagonally is faster.",
  ),
  explanation: [
    { type: "p", text: t(
      "Jika kanan = (1, 0) dan bawah = (0, 1), maka kanan+bawah = (1, 1). Panjang vektor itu sekitar 1,41, jadi pemain bergerak 41% lebih cepat secara diagonal.",
      "If right = (1, 0) and down = (0, 1), then right+down = (1, 1). That vector's length is about 1.41, so the player moves 41% faster diagonally.",
    ) },
    { type: "p", text: t(
      "Menormalkan vektor membuat panjangnya 1. `Input.get_vector()` sudah mengembalikan vektor yang panjangnya paling banyak 1.",
      "Normalizing a vector makes its length 1. `Input.get_vector()` already returns a vector with length at most 1.",
    ) },
    { type: "list", items: [
      t("`Input.is_action_pressed(\"dash\")`: benar selama tombol ditahan (setiap frame).", "`Input.is_action_pressed(\"dash\")`: true while the key is held (every frame)."),
      t("`Input.is_action_just_pressed(\"dash\")`: benar hanya pada frame saat tombol mulai ditekan.", "`Input.is_action_just_pressed(\"dash\")`: true only on the frame the key goes down."),
    ] },
  ],
  workedExample: [
    { type: "code", code: INPUT_SNIPPET, caption: t("Dash sekali per tekan dengan `is_action_just_pressed`", "One dash per press with `is_action_just_pressed`") },
  ],
  activity: {
    name: t("Lab Kontrol", "Control Lab"),
    instructions: [
      t("Gerakkan pemain diagonal (misalnya kanan + bawah) dan lihat rasio kecepatan diagonal.", "Move the player diagonally (e.g. right + down) and look at the diagonal speed ratio."),
      t("Aktifkan \"Normalkan diagonal\" dan uji lagi.", "Turn on \"Normalize diagonal\" and test again."),
      t("Tahan tombol dash. Bandingkan mode \"ditahan\" dengan \"baru ditekan\" di jejak input.", "Hold the dash key. Compare \"held\" mode with \"just pressed\" in the input trace."),
    ],
    hints: [
      t("Rasio 1,41 berarti diagonal lebih cepat. Targetnya 1,00.", "A ratio of 1.41 means diagonal is faster. The target is 1.00."),
      t("Dash yang adil terjadi sekali per tekan.", "A fair dash happens once per press."),
    ],
    initialConfig: { kind: "input", v: 1, normalizeDiagonal: false, dashMode: "held", dashKey: "Space" },
    limits: { maxEntities: 4, maxSeconds: 1200 },
  },
  checks: ["input.normalized", "input.diagonal_tested", "input.just_pressed"],
  checkLabels: {
    "input.normalized": t("Diagonal dinormalkan", "Diagonal is normalized"),
    "input.diagonal_tested": t("Diuji diagonal dengan rasio ≤ 1,01", "Tested diagonally with ratio ≤ 1.01"),
    "input.just_pressed": t("Dash memakai \"baru ditekan\"", "Dash uses \"just pressed\""),
  },
  fidelity: {
    teaches: t("Aksi bernama, normalisasi vektor, dan perbedaan ditahan/baru ditekan.", "Named actions, vector normalization, and held versus just-pressed."),
    differs: [
      t("Pemetaan tombol di sini terbatas; Input Map Godot mendukung banyak perangkat dan deadzone.", "Key mapping here is limited; Godot's Input Map supports many devices and deadzones."),
      t("Status \"baru ditekan\" dihitung per langkah simulasi browser, bukan frame mesin Godot.", "\"Just pressed\" is computed per browser simulation step, not per Godot engine frame."),
    ],
  },
  misconceptions: [
    t("Menjumlahkan dua arah selalu memberi kecepatan yang sama. (Diagonal jadi ~1,41×.)", "Adding two directions always gives the same speed. (Diagonal becomes ~1.41×.)"),
    t("is_action_pressed cocok untuk lompat atau dash. (Itu akan aktif setiap frame.)", "is_action_pressed is right for jump or dash. (It would trigger every frame.)"),
  ],
  quiz: {
    prompt: t("Fungsi mana yang cocok untuk menembak sekali per tekan tombol?", "Which function fits firing once per key press?"),
    code: null,
    options: [
      t("Input.is_action_pressed(\"fire\")", "Input.is_action_pressed(\"fire\")"),
      t("Input.is_action_just_pressed(\"fire\")", "Input.is_action_just_pressed(\"fire\")"),
      t("Input.get_vector(\"fire\", \"fire\", \"fire\", \"fire\")", "Input.get_vector(\"fire\", \"fire\", \"fire\", \"fire\")"),
    ],
    answer: 1,
    explanation: t("just_pressed hanya benar pada frame saat tombol mulai ditekan.", "just_pressed is only true on the frame the key goes down."),
  },
  reflection: t(
    "Apa yang dirasakan pemain jika diagonal lebih cepat atau dash aktif terus saat ditahan? Bagaimana kamu memperbaikinya?",
    "How would a player feel if diagonal were faster or the dash fired continuously while held? How did you fix it?",
  ),
  transfer: {
    steps: [
      t("Tambahkan aksi `dash` di Input Map dan pasangkan Spasi.", "Add a `dash` action to the Input Map and assign Space."),
      t("Perbarui skrip Player dengan contoh di bawah.", "Update the Player script with the example below."),
      t("Ganti sementara `is_action_just_pressed` dengan `is_action_pressed` dan rasakan bedanya.", "Temporarily swap `is_action_just_pressed` for `is_action_pressed` and feel the difference."),
    ],
    snippet: INPUT_SNIPPET,
    question: t(
      "Mengapa `Input.get_vector()` membuat gerakan diagonal adil, dan kapan kamu memilih `is_action_just_pressed`?",
      "Why does `Input.get_vector()` make diagonal movement fair, and when do you choose `is_action_just_pressed`?",
    ),
  },
};

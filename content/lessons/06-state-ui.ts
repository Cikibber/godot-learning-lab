import type { LessonContent } from "@/lib/validation/content";
import { GODOT_VERSION, t } from "./helpers";

export const STATE_SNIPPET = `extends Node

enum State { PLAYING, WON, LOST }

@export var start_lives: int = 3
@export var goal: int = 5

var state: State = State.PLAYING
var score: int = 0
var lives: int = 0

@onready var label: Label = $CanvasLayer/Label

func _ready() -> void:
    restart()

func restart() -> void:
    score = 0
    lives = start_lives
    state = State.PLAYING
    update_hud()

func add_point() -> void:
    if state != State.PLAYING:
        return
    score += 1
    if score >= goal:
        state = State.WON
    update_hud()

func lose_life() -> void:
    if state != State.PLAYING:
        return
    lives -= 1
    if lives <= 0:
        state = State.LOST
    update_hud()

func update_hud() -> void:
    label.text = "Score: %d  Lives: %d" % [score, lives]
`;

export const lesson: LessonContent = {
  key: "state-ui",
  version: 1,
  module: 6,
  kind: "state",
  godotVersion: GODOT_VERSION,
  title: t("State game dan UI", "Game state and UI"),
  summary: t(
    "Atur nyawa dan target, temukan bug skor lama saat restart, dan tampilkan HUD.",
    "Set lives and a goal, find the stale-score restart bug, and show a HUD.",
  ),
  minutes: { explain: 8, practice: 15 },
  objective: t(
    "Mengelola state bermain/menang/kalah, memperbarui `Label` di `CanvasLayer`, dan me-restart tanpa data lama.",
    "Manage playing/won/lost states, update a `Label` in a `CanvasLayer`, and restart without stale data.",
  ),
  whyGodot: t(
    "Setiap game butuh awal, kemenangan, kekalahan, dan restart yang bersih.",
    "Every game needs a start, a win, a loss, and a clean restart.",
  ),
  explanation: [
    { type: "p", text: t(
      "State adalah \"mode\" game saat ini: PLAYING, WON, atau LOST. Kode memeriksa state sebelum bertindak, misalnya tidak menambah skor setelah kalah.",
      "State is the game's current \"mode\": PLAYING, WON, or LOST. Code checks the state before acting, for example not adding score after losing.",
    ) },
    { type: "p", text: t(
      "HUD dibuat dengan node `Control` seperti `Label`, biasanya di dalam `CanvasLayer` agar tetap di layar saat kamera bergerak.",
      "A HUD is made with `Control` nodes like `Label`, usually inside a `CanvasLayer` so it stays on screen when the camera moves.",
    ) },
    { type: "callout", tone: "warning", text: t(
      "Bug umum: tombol restart mengubah state ke PLAYING tetapi lupa mengembalikan skor dan nyawa. Pemain memulai dengan data lama.",
      "Common bug: the restart button sets state to PLAYING but forgets to reset score and lives. The player starts with stale data.",
    ) },
  ],
  workedExample: [
    { type: "code", code: STATE_SNIPPET, caption: t("Pengelola state sederhana dengan HUD", "A simple state manager with a HUD") },
  ],
  activity: {
    name: t("Lab State", "State Lab"),
    instructions: [
      t("Atur nyawa dan target bintang, lalu mainkan sampai menang.", "Set lives and the star goal, then play until you win."),
      t("Mainkan lagi dan sengaja kalah dengan menabrak bahaya merah.", "Play again and lose on purpose by touching the red hazards."),
      t("Tekan Restart. Apakah skor dan nyawa kembali benar? Perbaiki pengaturan restart.", "Press Restart. Do score and lives reset correctly? Fix the restart settings."),
    ],
    hints: [
      t("Restart yang bersih: skor 0 dan nyawa sesuai pengaturan.", "A clean restart: score 0 and lives as configured."),
      t("Kamu kebal sebentar setelah kehilangan nyawa.", "You are briefly invulnerable after losing a life."),
    ],
    initialConfig: { kind: "state", v: 1, lives: 3, goal: 5, resetScoreOnRestart: false, resetLivesOnRestart: false },
    limits: { maxEntities: 16, maxSeconds: 1200 },
  },
  checks: ["state.reset_clean", "state.reached_won", "state.reached_lost", "state.restart_tested"],
  checkLabels: {
    "state.reset_clean": t("Restart mengembalikan skor dan nyawa", "Restart resets score and lives"),
    "state.reached_won": t("Mencapai state MENANG", "Reached the WON state"),
    "state.reached_lost": t("Mencapai state KALAH", "Reached the LOST state"),
    "state.restart_tested": t("Restart bersih berhasil diuji", "A clean restart was tested"),
  },
  fidelity: {
    teaches: t("State eksplisit, transisi, HUD, dan reset yang bersih.", "Explicit state, transitions, HUD, and clean reset."),
    differs: [
      t("HUD di sini adalah HTML biasa, bukan node `Control` Godot.", "The HUD here is plain HTML, not Godot `Control` nodes."),
      t("Penjadwalan browser dan jeda tab dapat berbeda dari waktu mesin.", "Browser scheduling and tab pausing can differ from engine time."),
    ],
  },
  misconceptions: [
    t("Mengubah state ke PLAYING sudah cukup untuk restart. (Data juga harus di-reset.)", "Setting state to PLAYING is enough to restart. (Data must be reset too.)"),
    t("HUD harus digambar ulang dengan kode setiap frame. (Perbarui saat nilai berubah.)", "The HUD must be redrawn in code every frame. (Update when values change.)"),
  ],
  quiz: {
    prompt: t("Di contoh kode, mengapa `add_point()` memeriksa `state != State.PLAYING`?", "In the example, why does `add_point()` check `state != State.PLAYING`?"),
    code: "func add_point() -> void:\n    if state != State.PLAYING:\n        return\n    score += 1",
    options: [
      t("Agar skor tidak bertambah setelah menang atau kalah.", "So the score does not increase after winning or losing."),
      t("Agar kode berjalan lebih cepat.", "So the code runs faster."),
      t("Karena GDScript mewajibkannya.", "Because GDScript requires it."),
    ],
    answer: 0,
    explanation: t("Pemeriksaan state mencegah perubahan data saat game sudah selesai.", "The state check prevents data changes once the game is over."),
  },
  reflection: t(
    "Jelaskan bug restart yang kamu temukan dan bagaimana kamu membuktikan perbaikannya.",
    "Explain the restart bug you found and how you proved the fix.",
  ),
  transfer: {
    steps: [
      t("Tambahkan `CanvasLayer` dengan `Label` ke scene Main.", "Add a `CanvasLayer` with a `Label` to the Main scene."),
      t("Lampirkan skrip contoh ke node Main dan sesuaikan path `$CanvasLayer/Label`.", "Attach the example script to the Main node and adjust the `$CanvasLayer/Label` path."),
      t("Panggil `add_point()` dari signal koin dan `restart()` dari tombol (`Button` → signal `pressed`).", "Call `add_point()` from the coin signal and `restart()` from a button (`Button` → `pressed` signal)."),
    ],
    snippet: STATE_SNIPPET,
    question: t(
      "Apa saja yang harus di-reset di fungsi `restart()`, dan bagaimana kamu menguji bahwa tidak ada data lama yang tersisa?",
      "What must be reset in the `restart()` function, and how do you test that no stale data remains?",
    ),
  },
};

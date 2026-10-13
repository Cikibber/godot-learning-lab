import type { LessonContent } from "@/lib/validation/content";
import { GODOT_VERSION, t } from "./helpers";

export const EXIT_SNIPPET = `extends Area2D

@export var coins_total: int = 4

var coins_collected: int = 0

func _ready() -> void:
    body_entered.connect(_on_body_entered)

func on_coin_collected() -> void:
    coins_collected += 1

func _on_body_entered(body: Node2D) -> void:
    if body.name == "Player" and coins_collected >= coins_total:
        get_tree().change_scene_to_file("res://win.tscn")
`;

export const lesson: LessonContent = {
  key: "mini-game",
  version: 1,
  module: 8,
  kind: "loop",
  godotVersion: GODOT_VERSION,
  title: t("Game lengkap dan debugging", "Complete loop and debugging"),
  summary: t(
    "Gabungkan semua konsep menjadi game kumpulkan-dan-keluar, lalu perbaiki dua bug.",
    "Combine every concept into a collect-and-exit game, then fix two bugs.",
  ),
  minutes: { explain: 8, practice: 20 },
  objective: t(
    "Mengintegrasikan scene, input, tabrakan, signal, state, dan timer serta men-debug dengan pengujian terencana.",
    "Integrate scenes, input, collision, signals, state, and timers, and debug with planned tests.",
  ),
  whyGodot: t(
    "Proyek akhirmu adalah satu loop lengkap seperti ini. Debugging adalah bagian normal dari membuat game.",
    "Your final project is one complete loop like this. Debugging is a normal part of making games.",
  ),
  explanation: [
    { type: "p", text: t(
      "Loop game: mulai → kumpulkan koin sambil menghindari bahaya → pintu keluar terbuka → menang. Jika nyawa habis → kalah. Restart → mulai lagi bersih.",
      "Game loop: start → collect coins while avoiding hazards → exit opens → win. If lives run out → lose. Restart → start again cleanly.",
    ) },
    { type: "p", text: t(
      "Uji setiap jalur dengan sengaja: jalur menang, jalur kalah, dan restart. Satu jalur yang lolos tidak membuktikan jalur lain benar.",
      "Test every path on purpose: the win path, the lose path, and restart. One passing path does not prove the others are correct.",
    ) },
    { type: "list", items: [
      t("Bug 1: pintu keluar terbuka terlalu cepat.", "Bug 1: the exit opens too early."),
      t("Bug 2: setelah restart, koin yang sudah diambil tidak kembali.", "Bug 2: after restart, collected coins do not come back."),
    ] },
  ],
  workedExample: [
    { type: "code", code: EXIT_SNIPPET, caption: t("Pintu keluar yang memeriksa semua koin sudah terkumpul", "An exit that checks all coins have been collected") },
    { type: "p", text: t(
      "Ubah satu hal, uji lagi, lalu catat hasilnya. Ini cara debugging yang dapat diulang.",
      "Change one thing, test again, then record the result. This is repeatable debugging.",
    ) },
  ],
  activity: {
    name: t("Lab Mini-game", "Mini-game Lab"),
    instructions: [
      t("Mainkan game. Temukan kapan pintu keluar terbuka dan apa yang terjadi setelah restart.", "Play the game. Find when the exit opens and what happens after restart."),
      t("Pilih perbaikan yang benar untuk aturan pintu keluar dan aturan restart.", "Choose the right fix for the exit rule and the restart rule."),
      t("Buktikan: menang sekali, kalah sekali, dan lakukan restart bersih.", "Prove it: win once, lose once, and do a clean restart."),
    ],
    hints: [
      t("Pintu harus menunggu SEMUA koin, bukan hanya satu.", "The exit must wait for ALL coins, not just one."),
      t("Restart bersih mengembalikan koin, skor, nyawa, dan posisi.", "A clean restart restores coins, score, lives, and position."),
    ],
    initialConfig: { kind: "loop", v: 1, exitRule: "score_gt_zero", restartRule: "keep_coins", lives: 3 },
    limits: { maxEntities: 20, maxSeconds: 1200 },
  },
  checks: ["loop.bug_exit_fixed", "loop.bug_restart_fixed", "loop.win_path", "loop.lose_path", "loop.restart_path"],
  checkLabels: {
    "loop.bug_exit_fixed": t("Bug 1 diperbaiki: pintu menunggu semua koin", "Bug 1 fixed: exit waits for all coins"),
    "loop.bug_restart_fixed": t("Bug 2 diperbaiki: restart mengembalikan koin", "Bug 2 fixed: restart restores coins"),
    "loop.win_path": t("Jalur menang diuji", "Win path tested"),
    "loop.lose_path": t("Jalur kalah diuji", "Lose path tested"),
    "loop.restart_path": t("Restart bersih diuji", "Clean restart tested"),
  },
  fidelity: {
    teaches: t("Integrasi konsep, pengujian jalur, dan debugging terencana.", "Concept integration, path testing, and planned debugging."),
    differs: [
      t("Blok-blok game sudah tetap; di Godot kamu membuat scene dan skrip sendiri.", "The game blocks are fixed; in Godot you build your own scenes and scripts."),
      t("Tabrakan memakai kotak sederhana, bukan fisika Godot.", "Collisions use simple boxes, not Godot physics."),
    ],
  },
  misconceptions: [
    t("Jika menang berhasil sekali, game sudah benar. (Uji juga kalah dan restart.)", "If winning works once, the game is correct. (Also test losing and restart.)"),
    t("Bug selalu menimbulkan error. (Banyak bug hanya perilaku yang salah.)", "Bugs always cause errors. (Many bugs are just wrong behaviour.)"),
  ],
  quiz: {
    prompt: t("Kondisi mana yang benar untuk membuka pintu keluar setelah semua koin terkumpul?", "Which condition correctly opens the exit after all coins are collected?"),
    code: null,
    options: [
      t("coins_collected > 0", "coins_collected > 0"),
      t("coins_collected >= coins_total", "coins_collected >= coins_total"),
      t("coins_total >= 0", "coins_total >= 0"),
    ],
    answer: 1,
    explanation: t("Pintu harus menunggu sampai jumlah terkumpul mencapai total.", "The exit must wait until the collected count reaches the total."),
  },
  reflection: t(
    "Jelaskan dua bug yang kamu perbaiki: gejalanya, penyebabnya, dan bagaimana kamu menguji perbaikannya.",
    "Explain the two bugs you fixed: the symptom, the cause, and how you tested the fix.",
  ),
  transfer: {
    steps: [
      t("Buat ulang loop kecil di Godot: Player, 3–4 Coin (instance), Hazard, Exit, dan HUD.", "Recreate a tiny loop in Godot: Player, 3–4 Coin instances, a Hazard, an Exit, and a HUD."),
      t("Pakai contoh Exit di bawah dan hubungkan signal koin ke `on_coin_collected()`.", "Use the Exit example below and connect the coin signal to `on_coin_collected()`."),
      t("Uji jalur menang, kalah, dan restart. Catat setiap bug yang kamu temukan.", "Test the win, lose, and restart paths. Record every bug you find."),
    ],
    snippet: EXIT_SNIPPET,
    question: t(
      "Saat membuat ulang loop ini di Godot, bug apa yang kamu temui (atau bisa terjadi) dan bagaimana kamu memperbaikinya?",
      "When recreating this loop in Godot, what bugs did you meet (or could happen) and how did you fix them?",
    ),
  },
};

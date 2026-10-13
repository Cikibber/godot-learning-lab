import type { LessonContent } from "@/lib/validation/content";
import { GODOT_VERSION, t } from "./helpers";

export const COIN_SNIPPET = `extends Area2D

signal collected

func _ready() -> void:
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
    if body.name == "Player":
        collected.emit()
        queue_free()
`;

export const lesson: LessonContent = {
  key: "signals",
  version: 1,
  module: 5,
  kind: "signals",
  godotVersion: GODOT_VERSION,
  title: t("Signal dan interaksi", "Signals and interactions"),
  summary: t(
    "Hubungkan peristiwa (signal) ke reaksi: koin menambah skor, skor membuka pintu.",
    "Connect events (signals) to reactions: coins add score, score opens the door.",
  ),
  minutes: { explain: 8, practice: 15 },
  objective: t(
    "Menghubungkan signal seperti `body_entered` dari `Area2D` ke fungsi reaksi dan menelusuri urutan peristiwa.",
    "Connect signals such as `Area2D`'s `body_entered` to reaction functions and trace event order.",
  ),
  whyGodot: t(
    "Signal membuat node saling memberi tahu tanpa saling bergantung erat. Koin tidak perlu tahu cara kerja HUD.",
    "Signals let nodes notify each other without being tightly coupled. A coin does not need to know how the HUD works.",
  ),
  explanation: [
    { type: "p", text: t(
      "Signal adalah pesan \"sesuatu terjadi\". `Area2D` memancarkan `body_entered` SATU KALI saat sebuah body mulai masuk, bukan terus-menerus selama tumpang tindih.",
      "A signal is a \"something happened\" message. `Area2D` emits `body_entered` ONCE when a body starts entering, not continuously while overlapping.",
    ) },
    { type: "p", text: t(
      "Kamu bisa menghubungkan signal di tab Node (dock Signals) atau dengan kode `signal_name.connect(callback)`.",
      "You can connect signals in the Node tab (Signals dock) or in code with `signal_name.connect(callback)`.",
    ) },
    { type: "list", items: [
      t("Peristiwa: koin dimasuki pemain → reaksi: tambah skor.", "Event: coin entered by player → reaction: add score."),
      t("Peristiwa: skor mencapai target → reaksi: buka pintu.", "Event: score reaches goal → reaction: open door."),
      t("Peristiwa: pintu keluar dimasuki → reaksi: menang.", "Event: exit entered → reaction: win."),
    ] },
  ],
  workedExample: [
    { type: "code", code: COIN_SNIPPET, caption: t("Koin `Area2D` yang memancarkan signal `collected`", "An `Area2D` coin that emits a `collected` signal") },
  ],
  activity: {
    name: t("Lab Signal", "Signal Lab"),
    instructions: [
      t("Pilih reaksi untuk tiap signal di panel Koneksi.", "Choose a reaction for each signal in the Connections panel."),
      t("Kumpulkan koin, buka pintu, dan capai pintu keluar. Lihat jejak peristiwa.", "Collect coins, open the door, and reach the exit. Watch the event trace."),
      t("Coba aktifkan \"Pancarkan terus saat tumpang tindih\" dan diam di atas koin. Lalu matikan lagi.", "Try turning on \"Emit continuously while overlapping\" and stand on a coin. Then turn it off again."),
    ],
    hints: [
      t("Pintu hanya terbuka lewat reaksi \"buka pintu\".", "The door only opens through the \"open door\" reaction."),
      t("Jika skor naik terus saat diam, signal dipancarkan berulang. Itu bug.", "If the score keeps rising while standing still, the signal is repeating. That is a bug."),
    ],
    initialConfig: {
      kind: "signals",
      v: 1,
      coinsRequired: 3,
      emitWhileOverlapping: false,
      connections: { "coin.body_entered": "add_score", "score.goal_reached": "none", "exit.body_entered": "none" },
    },
    limits: { maxEntities: 12, maxSeconds: 1200 },
  },
  checks: ["signals.connections", "signals.single_entry", "signals.won"],
  checkLabels: {
    "signals.connections": t("Koin→tambah skor, target skor→buka pintu, pintu keluar→menang", "Coin→add score, score goal→open door, exit→win"),
    "signals.single_entry": t("Signal hanya saat masuk, tidak berulang", "Signal only on entry, not repeating"),
    "signals.won": t("Menang lewat pintu keluar", "Won through the exit"),
  },
  fidelity: {
    teaches: t("Peristiwa, koneksi ke reaksi, dan urutan peristiwa.", "Events, connections to reactions, and event order."),
    differs: [
      t("Ini pengirim peristiwa sederhana, bukan implementasi signal Godot atau siklus hidup objek.", "This is a simple event dispatcher, not Godot's signal implementation or object lifecycle."),
      t("Pilihan koneksi sudah ditentukan; di Godot kamu menulis fungsi sendiri.", "Connection choices are predefined; in Godot you write your own functions."),
    ],
  },
  misconceptions: [
    t("body_entered aktif setiap frame selama tumpang tindih. (Hanya sekali saat masuk.)", "body_entered fires every frame while overlapping. (Only once on entry.)"),
    t("Koin harus memanggil HUD langsung. (Lebih baik memancarkan signal.)", "The coin must call the HUD directly. (Emitting a signal is better.)"),
  ],
  quiz: {
    prompt: t("Baris mana yang menghubungkan signal body_entered ke fungsi?", "Which line connects the body_entered signal to a function?"),
    code: null,
    options: [
      t("body_entered.connect(_on_body_entered)", "body_entered.connect(_on_body_entered)"),
      t("_on_body_entered.connect(body_entered)", "_on_body_entered.connect(body_entered)"),
      t("emit(body_entered)", "emit(body_entered)"),
    ],
    answer: 0,
    explanation: t("Format: signal.connect(fungsi_penerima).", "Format: signal.connect(receiver_function)."),
  },
  reflection: t(
    "Tuliskan urutan peristiwa dari jejak saat kamu menang. Mengapa urutan itu penting?",
    "Write the order of events from the trace when you won. Why does that order matter?",
  ),
  transfer: {
    steps: [
      t("Buat scene Coin: `Area2D` dengan `Sprite2D` dan `CollisionShape2D`.", "Create a Coin scene: `Area2D` with `Sprite2D` and `CollisionShape2D`."),
      t("Lampirkan skrip di bawah. Pastikan body Player bernama \"Player\".", "Attach the script below. Make sure the Player body is named \"Player\"."),
      t("Di scene Main, hubungkan signal `collected` ke fungsi yang menambah skor (tab Node → Signals).", "In the Main scene, connect the `collected` signal to a function that adds score (Node tab → Signals)."),
    ],
    snippet: COIN_SNIPPET,
    question: t(
      "Apa perbedaan \"masuk area\" dan \"tumpang tindih terus-menerus\", dan signal mana yang kamu pakai untuk mengambil koin?",
      "What is the difference between \"entering an area\" and \"overlapping continuously\", and which signal do you use to pick up a coin?",
    ),
  },
};

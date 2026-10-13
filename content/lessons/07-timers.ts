import type { LessonContent } from "@/lib/validation/content";
import { GODOT_VERSION, t } from "./helpers";

export const TIMER_SNIPPET = `extends Node2D

@export var item_scene: PackedScene
@export var max_items: int = 10

@onready var countdown: Timer = $Countdown
@onready var spawn_timer: Timer = $SpawnTimer

func _ready() -> void:
    countdown.one_shot = true
    countdown.timeout.connect(_on_countdown_timeout)
    spawn_timer.timeout.connect(_on_spawn_timer_timeout)
    countdown.start(30.0)
    spawn_timer.start(1.5)

func _on_spawn_timer_timeout() -> void:
    if get_tree().get_nodes_in_group("items").size() >= max_items:
        return
    var item := item_scene.instantiate()
    item.add_to_group("items")
    add_child(item)

func _on_countdown_timeout() -> void:
    spawn_timer.stop()
    print("Time's up!")
`;

export const lesson: LessonContent = {
  key: "timers",
  version: 1,
  module: 7,
  kind: "timer",
  godotVersion: GODOT_VERSION,
  title: t("Waktu dan umpan balik", "Time and feedback"),
  summary: t(
    "Atur hitung mundur dan timer kemunculan, lalu cegah objek muncul tanpa batas.",
    "Set a countdown and a spawn timer, then stop objects from spawning without limit.",
  ),
  minutes: { explain: 8, practice: 15 },
  objective: t(
    "Memakai node `Timer` dengan `timeout`, membedakan one-shot dan berulang, dan membatasi jumlah objek.",
    "Use the `Timer` node with `timeout`, distinguish one-shot from repeating, and cap the number of objects.",
  ),
  whyGodot: t(
    "Timer mengatur ritme game: musuh muncul, power-up habis, dan waktu permainan berakhir.",
    "Timers set a game's rhythm: enemies spawn, power-ups expire, and play time ends.",
  ),
  explanation: [
    { type: "p", text: t(
      "Node `Timer` menghitung mundur `wait_time` detik lalu memancarkan signal `timeout`.",
      "The `Timer` node counts down `wait_time` seconds, then emits the `timeout` signal.",
    ) },
    { type: "list", items: [
      t("`one_shot = true`: berhenti setelah satu kali timeout. Cocok untuk hitung mundur permainan.", "`one_shot = true`: stops after one timeout. Good for a game countdown."),
      t("`one_shot = false`: berulang terus. Cocok untuk memunculkan objek secara berkala.", "`one_shot = false`: repeats forever. Good for spawning objects periodically."),
    ] },
    { type: "p", text: t(
      "Timer berulang tanpa batas jumlah objek dapat membuat ratusan objek dan memperlambat laptop. Selalu beri batas.",
      "A repeating timer with no object limit can create hundreds of objects and slow a laptop. Always set a limit.",
    ) },
    { type: "callout", tone: "tip", text: t(
      "Umpan balik kecil (berkedip, berubah warna) dibuat di Godot dengan `AnimationPlayer` atau `Tween`. Lab ini hanya menunjukkan konsepnya.",
      "Small feedback (flashing, colour change) is made in Godot with `AnimationPlayer` or `Tween`. This lab only shows the concept.",
    ) },
  ],
  workedExample: [
    { type: "code", code: TIMER_SNIPPET, caption: t("Hitung mundur one-shot dan kemunculan berulang yang dibatasi", "One-shot countdown and capped repeating spawns") },
  ],
  activity: {
    name: t("Lab Timer", "Timer Lab"),
    instructions: [
      t("Atur lama hitung mundur dan jarak kemunculan, lalu tangkap bintang yang jatuh.", "Set the countdown length and spawn interval, then catch the falling stars."),
      t("Matikan batas objek dan jarak kemunculan terkecil. Amati jumlah objek.", "Turn off the object cap and use the smallest spawn interval. Watch the object count."),
      t("Perbaiki: hitung mundur one-shot dan batas objek aktif. Biarkan waktu habis.", "Fix it: one-shot countdown and the object cap on. Let the time run out."),
    ],
    hints: [
      t("Jika hitung mundur tidak one-shot, \"waktu habis\" terjadi berulang kali.", "If the countdown is not one-shot, \"time's up\" happens again and again."),
      t("Batas keras lab adalah 100 objek untuk melindungi laptop.", "The lab's hard limit is 100 objects to protect the laptop."),
    ],
    initialConfig: { kind: "timer", v: 1, countdownSeconds: 20, countdownOneShot: false, spawnInterval: 1.5, capEnabled: false, maxEntities: 10 },
    limits: { maxEntities: 100, maxSeconds: 1200 },
  },
  checks: ["timer.oneshot_countdown", "timer.bounded_spawn", "timer.ran_to_timeout"],
  checkLabels: {
    "timer.oneshot_countdown": t("Hitung mundur one-shot", "Countdown is one-shot"),
    "timer.bounded_spawn": t("Kemunculan dibatasi (≤ 30)", "Spawning is capped (≤ 30)"),
    "timer.ran_to_timeout": t("Hitung mundur berjalan sampai timeout", "The countdown ran to timeout"),
  },
  fidelity: {
    teaches: t("Timeout, one-shot versus berulang, dan kemunculan terbatas.", "Timeouts, one-shot versus repeating, and bounded spawning."),
    differs: [
      t("Timer dihitung per langkah simulasi browser; Godot memakai waktu idle atau fisika dan bisa dijeda berbeda.", "Timers count per browser simulation step; Godot uses idle or physics time and pauses differently."),
      t("Tidak ada AnimationPlayer di sini; kedipan hanyalah gambar sederhana.", "There is no AnimationPlayer here; flashes are simple drawing."),
    ],
  },
  misconceptions: [
    t("Timer berhenti sendiri setelah timeout. (Hanya jika one_shot = true.)", "A Timer stops by itself after timeout. (Only if one_shot = true.)"),
    t("Memunculkan objek tidak perlu dibatasi. (Bisa membuat game lambat.)", "Spawning does not need a limit. (It can make the game slow.)"),
  ],
  quiz: {
    prompt: t("Timer dengan wait_time = 2 dan one_shot = false berjalan 7 detik. Berapa kali timeout?", "A Timer with wait_time = 2 and one_shot = false runs for 7 seconds. How many timeouts?"),
    code: null,
    options: [t("1", "1"), t("3", "3"), t("7", "7")],
    answer: 1,
    explanation: t("Timeout pada detik 2, 4, dan 6 = 3 kali.", "Timeouts at seconds 2, 4, and 6 = 3 times."),
  },
  reflection: t(
    "Apa yang terjadi pada jumlah objek tanpa batas, dan bagaimana batas melindungi pemain dengan laptop lambat?",
    "What happened to the object count without a cap, and how does a cap protect players with slow laptops?",
  ),
  transfer: {
    steps: [
      t("Tambahkan dua node `Timer`: Countdown dan SpawnTimer.", "Add two `Timer` nodes: Countdown and SpawnTimer."),
      t("Lampirkan skrip contoh dan pilih scene item di Inspector.", "Attach the example script and choose an item scene in the Inspector."),
      t("Tambahkan `AnimationPlayer` sederhana untuk membuat item berkedip saat muncul.", "Add a simple `AnimationPlayer` to make items flash when they appear."),
    ],
    snippet: TIMER_SNIPPET,
    question: t(
      "Kapan kamu memakai Timer one-shot dan kapan berulang? Mengapa kemunculan objek perlu batas?",
      "When do you use a one-shot Timer and when a repeating one? Why does spawning need a limit?",
    ),
  },
};

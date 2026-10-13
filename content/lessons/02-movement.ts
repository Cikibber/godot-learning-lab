import type { LessonContent } from "@/lib/validation/content";
import { GODOT_VERSION, t } from "./helpers";

export const NODE2D_MOVE = `extends Node2D

@export var speed: float = 120.0

func _process(delta: float) -> void:
    var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    position += direction * speed * delta
`;

export const lesson: LessonContent = {
  key: "movement",
  version: 1,
  module: 2,
  kind: "movement",
  godotVersion: GODOT_VERSION,
  title: t("Koordinat dan gerakan", "Coordinates and movement"),
  summary: t(
    "Gerakkan persegi dengan aksi input dan pahami mengapa kecepatan dikalikan delta.",
    "Move a rectangle with input actions and understand why speed is multiplied by delta.",
  ),
  minutes: { explain: 8, practice: 15 },
  objective: t(
    "Menggerakkan objek dengan `Vector2`, aksi input, dan kecepatan dalam piksel per detik.",
    "Move an object with `Vector2`, input actions, and speed in pixels per second.",
  ),
  whyGodot: t(
    "Hampir semua game butuh gerakan yang sama cepatnya di komputer cepat maupun lambat. Delta membuat itu terjadi.",
    "Almost every game needs movement that is equally fast on fast and slow computers. Delta makes that happen.",
  ),
  explanation: [
    { type: "p", text: t(
      "Di Godot 2D, sumbu x ke kanan dan sumbu y ke BAWAH. `Vector2(1, 0)` berarti ke kanan, `Vector2(0, 1)` berarti ke bawah.",
      "In Godot 2D, the x axis points right and the y axis points DOWN. `Vector2(1, 0)` means right, `Vector2(0, 1)` means down.",
    ) },
    { type: "p", text: t(
      "`_process(delta)` dipanggil setiap frame. `delta` adalah jumlah detik sejak frame sebelumnya, misalnya 0,016 pada 60 FPS atau 0,033 pada 30 FPS.",
      "`_process(delta)` is called every frame. `delta` is the number of seconds since the previous frame, for example 0.016 at 60 FPS or 0.033 at 30 FPS.",
    ) },
    { type: "p", text: t(
      "Jika speed = 120 piksel/detik, maka `position += direction * speed * delta` memindahkan objek 120 piksel per detik berapa pun FPS-nya.",
      "If speed = 120 pixels/second, `position += direction * speed * delta` moves the object 120 pixels per second at any FPS.",
    ) },
    { type: "callout", tone: "tip", text: t(
      "Nama aksi seperti \"move_left\" dibuat di Project → Project Settings → Input Map. Kode memakai nama aksi, bukan tombol tertentu.",
      "Action names like \"move_left\" are created in Project → Project Settings → Input Map. Code uses action names, not specific keys.",
    ) },
  ],
  workedExample: [
    { type: "code", code: NODE2D_MOVE, caption: t("Gerakan langsung pada `Node2D` memakai delta", "Direct `Node2D` movement using delta") },
    { type: "p", text: t(
      "Dalam 2 detik pada 30 FPS: 60 frame × 120 × 0,0333 ≈ 240 piksel. Pada 60 FPS: 120 frame × 120 × 0,0167 ≈ 240 piksel. Sama!",
      "In 2 seconds at 30 FPS: 60 frames × 120 × 0.0333 ≈ 240 pixels. At 60 FPS: 120 frames × 120 × 0.0167 ≈ 240 pixels. The same!",
    ) },
  ],
  activity: {
    name: t("Lab Gerakan", "Movement Lab"),
    instructions: [
      t("Klik area permainan atau tekan Mulai, lalu gerakkan persegi dengan panah/WASD atau tombol di layar.", "Click the play area or press Start, then move the square with arrows/WASD or the on-screen buttons."),
      t("Ubah kecepatan dengan slider dan capai zona target hijau.", "Change the speed with the slider and reach the green target zone."),
      t("Lihat panel perbandingan: matikan \"Pakai delta\", amati, lalu nyalakan lagi.", "Watch the comparison panel: turn \"Use delta\" off, observe, then turn it back on."),
    ],
    hints: [
      t("Tanpa delta, objek di 60 FPS bergerak dua kali lebih jauh daripada di 30 FPS.", "Without delta, the object at 60 FPS moves twice as far as at 30 FPS."),
      t("Tekan Escape untuk melepas fokus keyboard dari permainan.", "Press Escape to release keyboard focus from the game."),
    ],
    initialConfig: { kind: "movement", v: 1, speed: 120, useDelta: true },
    limits: { maxEntities: 4, maxSeconds: 1200 },
  },
  checks: ["movement.reach_target", "movement.speed_changed", "movement.delta_compared"],
  checkLabels: {
    "movement.reach_target": t("Mencapai zona target", "Reached the target zone"),
    "movement.speed_changed": t("Mencoba kecepatan selain 120", "Tried a speed other than 120"),
    "movement.delta_compared": t("Membandingkan tanpa delta, lalu kembali memakai delta", "Compared without delta, then switched delta back on"),
  },
  fidelity: {
    teaches: t("Vektor arah, aksi input bernama, dan gerakan berbasis waktu.", "Direction vectors, named input actions, and time-based movement."),
    differs: [
      t("Ini JavaScript, bukan mesin Godot. Skala koordinat hanya ilustrasi.", "This is JavaScript, not the Godot engine. The coordinate scale is illustrative."),
      t("Panel 30/60 FPS disimulasikan dalam langkah tetap; FPS asli browser bisa berbeda.", "The 30/60 FPS panel is simulated inside a fixed step; the browser's real FPS can differ."),
    ],
  },
  misconceptions: [
    t("Kecepatan tanpa delta sudah cukup. (Gerakan akan tergantung FPS.)", "Speed without delta is fine. (Movement would depend on FPS.)"),
    t("Sumbu y positif ke atas. (Di Godot 2D, y positif ke bawah.)", "Positive y points up. (In Godot 2D, positive y points down.)"),
  ],
  quiz: {
    prompt: t("Baris mana yang membuat gerakan tidak tergantung FPS?", "Which line makes movement independent of FPS?"),
    code: null,
    options: [
      t("position += direction * speed", "position += direction * speed"),
      t("position += direction * speed * delta", "position += direction * speed * delta"),
      t("position = direction * delta", "position = direction * delta"),
    ],
    answer: 1,
    explanation: t("Mengalikan dengan delta mengubah piksel/detik menjadi piksel untuk frame ini.", "Multiplying by delta converts pixels/second into pixels for this frame."),
  },
  reflection: t(
    "Ceritakan apa yang kamu lihat di panel perbandingan ketika delta dimatikan. Mengapa itu masalah bagi pemain dengan laptop lambat?",
    "Describe what you saw in the comparison panel when delta was off. Why is that a problem for players with slow laptops?",
  ),
  transfer: {
    steps: [
      t("Buka Project Settings → Input Map. Tambahkan aksi move_left, move_right, move_up, move_down dan pasangkan tombol.", "Open Project Settings → Input Map. Add actions move_left, move_right, move_up, move_down and assign keys."),
      t("Buat `Node2D` dengan anak `Sprite2D` dan lampirkan skrip di bawah.", "Create a `Node2D` with a `Sprite2D` child and attach the script below."),
      t("Jalankan scene (F6) dan ubah `speed` di Inspector.", "Run the scene (F6) and change `speed` in the Inspector."),
    ],
    snippet: NODE2D_MOVE,
    question: t(
      "Apa arti `delta` di `_process(delta)`, dan apa yang terjadi jika kamu menghapus `* delta` dari skrip?",
      "What does `delta` mean in `_process(delta)`, and what happens if you remove `* delta` from the script?",
    ),
  },
};

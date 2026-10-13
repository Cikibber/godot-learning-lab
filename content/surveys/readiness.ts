import type { SurveyContent } from "@/lib/validation/content";
import { t } from "../lessons/helpers";

const preferNot = { value: "prefer_not", label: t("Memilih tidak menjawab", "Prefer not to answer") };

export const readiness: SurveyContent = {
  key: "readiness",
  version: 1,
  minutes: 7,
  title: t("Survei kesiapan, minat, dan akses", "Readiness, interests, and access survey"),
  intro: t(
    "Survei ini membantu guru menyesuaikan pelajaran dan jadwal komputer sekolah. Tidak dinilai. Jawaban \"tidak yakin\" itu wajar.",
    "This survey helps your teacher adapt lessons and school-computer scheduling. It is not graded. Answering \"not sure\" is fine.",
  ),
  privacy: t(
    "Jawabanmu terlihat oleh gurumu dengan namamu. Teman sekelas tidak dapat melihatnya. Survei ini TIDAK anonim.",
    "Your teacher can see your answers with your name. Classmates cannot see them. This survey is NOT anonymous.",
  ),
  questions: [
    {
      id: "R1", type: "single", required: true,
      prompt: t("Seberapa banyak pengalamanmu membuat game?", "How much experience do you have making games?"),
      options: [
        { value: "none", label: t("Belum pernah", "None") },
        { value: "tutorial", label: t("Pernah mengikuti tutorial", "Followed a tutorial") },
        { value: "small_game", label: t("Pernah membuat game kecil", "Made a small game") },
        { value: "other", label: t("Lainnya", "Other") },
      ],
      followUp: { label: t("Jelaskan singkat (opsional)", "Short description (optional)"), maxLength: 100, forOption: "other" },
    },
    {
      id: "R2", type: "single", required: true,
      prompt: t("Pernahkah kamu memakai Godot?", "Have you used Godot before?"),
      options: [
        { value: "never", label: t("Belum pernah", "Never") },
        { value: "opened", label: t("Pernah membukanya", "Opened it") },
        { value: "tutorial", label: t("Pernah menyelesaikan tutorial", "Completed a tutorial") },
        { value: "built", label: t("Pernah membuat sesuatu", "Built something") },
      ],
    },
    {
      id: "R3", type: "scale", required: true,
      prompt: t("Seberapa nyaman kamu membaca kode sederhana?", "How comfortable are you reading simple code?"),
      scale: {
        low: t("1 = sama sekali tidak nyaman", "1 = not comfortable at all"),
        high: t("5 = sangat nyaman", "5 = very comfortable"),
        extra: [{ value: "not_sure", label: t("Tidak yakin", "Not sure") }],
      },
    },
    {
      id: "R4", type: "multi", required: false, max: 3,
      prompt: t("Jenis game apa yang kamu minati? Pilih paling banyak tiga.", "Which kinds of games interest you? Choose up to three."),
      options: [
        { value: "puzzle", label: t("Puzzle", "Puzzle") },
        { value: "platformer", label: t("Platformer", "Platformer") },
        { value: "top_down", label: t("Petualangan top-down", "Top-down adventure") },
        { value: "arcade", label: t("Arcade", "Arcade") },
        { value: "simulation", label: t("Simulasi", "Simulation") },
        { value: "story", label: t("Cerita", "Story") },
        { value: "other", label: t("Lainnya", "Other") },
      ],
    },
    {
      id: "R5", type: "text", required: false, max: 200,
      prompt: t("Sebutkan satu game yang kamu sukai dan satu mekanik yang kamu suka.", "Name one game you enjoy and one mechanic you like."),
      help: t("Jangan tulis nama akun atau username.", "Do not write account names or usernames."),
    },
    {
      id: "R6", type: "single", required: true,
      prompt: t("Perangkat apa yang biasanya bisa kamu pakai untuk latihan sekolah?", "What device can you usually use for school practice?"),
      options: [
        { value: "personal_laptop", label: t("Laptop pribadi", "Personal laptop") },
        { value: "shared_laptop", label: t("Laptop bersama", "Shared laptop") },
        { value: "school_only", label: t("Hanya komputer sekolah", "School computer only") },
        { value: "other", label: t("Lainnya", "Other") },
        { value: "unsure", label: t("Tidak yakin", "Unsure") },
      ],
    },
    {
      id: "R7", type: "single", required: true,
      prompt: t("Apa yang terjadi saat kamu mencoba menjalankan Godot?", "What happens when you try running Godot?"),
      options: [
        { value: "not_tried", label: t("Belum mencoba", "Haven't tried") },
        { value: "works_well", label: t("Berjalan baik", "Works well") },
        { value: "slow", label: t("Lambat", "Slow") },
        { value: "crashes", label: t("Crash / tertutup sendiri", "Crashes") },
        { value: "cannot_install", label: t("Tidak bisa dipasang", "Cannot install") },
        { value: "unsure", label: t("Tidak yakin", "Unsure") },
      ],
    },
    {
      id: "R8", type: "single", required: false,
      prompt: t("Bisakah kamu biasanya mengakses internet untuk latihan di luar kelas?", "Can you usually access the internet for practice outside class?"),
      options: [
        { value: "reliably", label: t("Ya, dengan lancar", "Reliably") },
        { value: "sometimes", label: t("Kadang-kadang", "Sometimes") },
        { value: "school_only", label: t("Hanya di sekolah", "Only at school") },
        preferNot,
      ],
    },
    {
      id: "R9", type: "multi", required: false, max: 2,
      prompt: t("Kegiatan mana yang paling menarik? Pilih paling banyak dua.", "Which activities sound most interesting? Choose up to two."),
      options: [
        { value: "programming", label: t("Pemrograman", "Programming") },
        { value: "game_design", label: t("Desain game", "Game design") },
        { value: "art", label: t("Seni/gambar", "Art") },
        { value: "audio", label: t("Audio", "Audio") },
        { value: "testing", label: t("Pengujian", "Testing") },
        { value: "organizing", label: t("Mengatur tim", "Organizing") },
      ],
    },
    {
      id: "R10", type: "scale", required: false,
      prompt: t("Seberapa percaya diri kamu bekerja dalam tim kecil?", "How confident are you about working in a small team?"),
      scale: {
        low: t("1 = tidak percaya diri", "1 = not confident"),
        high: t("5 = sangat percaya diri", "5 = very confident"),
        extra: [preferNot],
      },
    },
    {
      id: "R11", type: "text", required: false, max: 300,
      prompt: t("Adakah dukungan di kelas yang akan membantumu berpartisipasi?", "Is there a classroom support that would help you participate?"),
      help: t(
        "Opsional dan hanya untuk gurumu. Jangan tuliskan detail medis; guru dapat menindaklanjuti lewat jalur sekolah.",
        "Optional and only for your teacher. Do not write medical details; your teacher can follow up through school channels.",
      ),
    },
    {
      id: "R12", type: "text", required: false, max: 300,
      prompt: t("Apa yang ingin kamu pelajari atau buat semester ini?", "What would you like to learn or make this semester?"),
    },
  ],
};

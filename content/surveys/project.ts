import type { SurveyContent } from "@/lib/validation/content";
import { t } from "../lessons/helpers";

export const project: SurveyContent = {
  key: "project",
  version: 1,
  minutes: 10,
  title: t("Survei minat proyek dan persiapan tim", "Project interests and team preparation survey"),
  intro: t(
    "Ubah semangatmu menjadi ide proyek yang bisa selesai. Guru akan membentuk tim; setiap tim lalu menulis satu proposal.",
    "Turn your enthusiasm into a project idea that can be finished. Your teacher forms teams; each team then writes one proposal.",
  ),
  privacy: t(
    "Jawabanmu hanya terlihat oleh guru, sampai kamu sendiri memasukkan ide yang disepakati ke proposal tim. Pilihan teman bersifat saran dan tidak dijamin.",
    "Only your teacher sees your answers, until you choose to put an agreed idea into your team proposal. Teammate preferences are suggestions and are not guaranteed.",
  ),
  questions: [
    { id: "P1", type: "text", required: true, max: 80,
      prompt: t("Beri judul sementara untuk ide game-mu.", "Give your game idea a working title.") },
    { id: "P2", type: "text", required: true, max: 250,
      prompt: t("Dalam satu kalimat, apa yang dilakukan pemain berulang kali?", "In one sentence, what does the player do repeatedly?") },
    {
      id: "P3", type: "single", required: true,
      prompt: t("Format game 2D pemula mana yang paling cocok?", "Which beginner 2D format fits best?"),
      options: [
        { value: "collect_exit", label: t("Kumpulkan-dan-keluar", "Collect-and-exit") },
        { value: "dodge_survive", label: t("Hindari-dan-bertahan", "Dodge-survive") },
        { value: "simple_puzzle", label: t("Puzzle sederhana", "Simple puzzle") },
        { value: "top_down_explore", label: t("Eksplorasi top-down", "Top-down exploration") },
        { value: "other", label: t("Lainnya (perlu persetujuan guru)", "Other (requires teacher approval)") },
      ],
      followUp: { label: t("Jelaskan format lainnya", "Describe the other format"), maxLength: 150, forOption: "other" },
    },
    {
      id: "P4", type: "pair", required: true,
      prompt: t(
        "Apa syarat menang? Apa syarat kalah, atau mengapa tidak perlu syarat kalah?",
        "What is the win condition? What is the lose condition, or why is no lose condition appropriate?",
      ),
      pair: { a: t("Syarat menang", "Win condition"), b: t("Syarat kalah (atau alasan tidak ada)", "Lose condition (or why none)"), maxLength: 200 },
    },
    { id: "P5", type: "textlist", required: true, max: 3, min: 1, itemMaxLength: 120,
      prompt: t("Tuliskan paling banyak tiga fitur penting.", "List up to three essential features.") },
    { id: "P6", type: "textlist", required: false, max: 2, itemMaxLength: 120,
      prompt: t("Tuliskan paling banyak dua fitur tambahan (opsional).", "List up to two optional stretch features.") },
    {
      id: "P7", type: "multi", required: true, min: 1,
      prompt: t("Konsep Godot apa yang akan kamu pakai?", "What Godot concepts will you use?"),
      options: [
        { value: "scenes_nodes", label: t("Scene/node", "Scenes/nodes") },
        { value: "input", label: t("Input", "Input") },
        { value: "collision", label: t("Tabrakan", "Collision") },
        { value: "signals", label: t("Signal", "Signals") },
        { value: "ui", label: t("UI", "UI") },
        { value: "timers", label: t("Timer", "Timers") },
        { value: "other", label: t("Lainnya", "Other") },
      ],
    },
    {
      id: "P8", type: "multi", required: true, min: 2, max: 2,
      prompt: t("Peran mana yang ingin kamu coba? Pilih dua dan jelaskan salah satunya.", "Which roles would you like to try? Choose two and explain one."),
      options: [
        { value: "programming", label: t("Pemrograman", "Programming") },
        { value: "game_design", label: t("Desain game", "Game design") },
        { value: "art", label: t("Seni", "Art") },
        { value: "audio", label: t("Audio", "Audio") },
        { value: "testing", label: t("Pengujian", "Testing") },
        { value: "documentation", label: t("Dokumentasi/organisasi", "Documentation/organizing") },
      ],
      followUp: { label: t("Jelaskan salah satu pilihanmu (opsional)", "Explain one of your choices (optional)"), maxLength: 200 },
    },
    {
      id: "P9", type: "classmates", required: false, max: 3,
      prompt: t("Dengan teman sekelas mana kamu ingin bekerja?", "Which classmates would you prefer to work with?"),
      help: t("Opsional, hanya terlihat oleh guru, dan tidak dijamin.", "Optional, visible only to your teacher, and not guaranteed."),
    },
    {
      id: "P10", type: "single", required: true,
      prompt: t("Apakah kamu bersedia ditempatkan di kelompok pilihan guru?", "Are you open to a teacher-assigned group?"),
      options: [
        { value: "yes", label: t("Ya", "Yes") },
        { value: "discuss", label: t("Ingin membicarakannya secara pribadi", "Would like to discuss privately") },
      ],
    },
    {
      id: "P11", type: "sessions", required: true,
      prompt: t(
        "Kapan kamu bisa memakai komputer sekolah yang mampu selama sesi sekolah yang disetujui?",
        "When can you use a capable school computer during approved school sessions?",
      ),
      help: t("Hanya sesi sekolah. Kami tidak menanyakan jadwal di rumah.", "School sessions only. We do not ask about home schedules."),
    },
    {
      id: "P12", type: "single", required: true,
      prompt: t("Seni/audio apa yang akan kamu pakai, dan dari mana asalnya?", "What art/audio will you use, and where will it come from?"),
      options: [
        { value: "original", label: t("Buatan sendiri", "Original") },
        { value: "teacher_pack", label: t("Paket aset dari guru", "Teacher asset pack") },
        { value: "licensed", label: t("Sumber berlisensi yang sesuai", "Appropriately licensed source") },
      ],
      followUp: { label: t("Sumber (opsional)", "Source (optional)"), maxLength: 200 },
    },
    { id: "P13", type: "text", required: true, max: 400,
      prompt: t(
        "Apa yang bisa menghalangi penyelesaian, dan versi lebih sederhana apa yang tetap berhasil?",
        "What might prevent completion, and what simpler version would still work?",
      ) },
    { id: "P14", type: "text", required: false, max: 300,
      prompt: t("Bantuan apa yang kamu butuhkan sebelum mulai?", "What help do you need before starting?") },
  ],
};

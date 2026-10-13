// Gate D, vertical slice: class + enrollment approval, movement lesson played
// in step mode, draft save/reload, submit, teacher review, student revision,
// and cross-user denial — all through the real backend and RLS.
import { expect, test } from "@playwright/test";
import { provision, signIn } from "./helpers";

test("movement lesson end to end", async ({ browser }) => {
  const teacher = await provision("guru", "teacher");
  const student = await provision("siswa", "student");
  const stranger = await provision("asing", "student");

  // Teacher creates a class, adds and publishes the movement lesson, makes a code.
  const tp = await signIn(browser, teacher.email);
  await tp.getByLabel("Nama kelas").fill("Kelas E2E");
  await tp.getByRole("button", { name: "Buat kelas" }).click();
  await expect(tp.getByRole("heading", { name: "Kelas E2E" })).toBeVisible();
  const classUrl = tp.url();
  await tp.getByRole("button", { name: "Buat kode" }).click();
  const code = (await tp.locator("p.font-mono").textContent())!.trim();
  expect(code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);

  await tp.goto(`${classUrl}/assignments`);
  await tp.getByLabel("Tambahkan konten").selectOption({ label: "Modul 2: Koordinat dan gerakan (v1)" });
  await tp.getByRole("button", { name: "Tambah tugas" }).click();
  await tp.getByLabel("Terbitkan").check();
  await tp.getByRole("button", { name: "Simpan" }).click();
  await expect(tp.getByText(/· Diterbitkan/)).toBeVisible();

  // Student redeems the code and waits for approval.
  const sp = await signIn(browser, student.email);
  await sp.getByLabel("Kode kelas").fill(code);
  await sp.getByRole("button", { name: "Kirim permintaan" }).click();
  await expect(sp.getByText("permintaanmu sudah dikirim")).toBeVisible();
  await sp.reload();
  await expect(sp.getByText("Menunggu persetujuan")).toBeVisible();

  await tp.goto(classUrl);
  await tp.getByRole("button", { name: "Setujui" }).click();
  await expect(tp.getByRole("cell", { name: "0/1" })).toBeVisible();

  // Student plays the activity in text/step mode (frame-rate independent).
  await sp.reload();
  await sp.getByRole("link", { name: "Buka" }).click();
  await expect(sp.getByText("Simulasi browser untuk konsep Godot. GDScript tidak dijalankan di sini.")).toBeVisible();
  const lessonUrl = sp.url();
  await sp.getByRole("button", { name: "Mode teks/langkah" }).click();
  await sp.getByLabel(/Kecepatan/).fill("400");
  for (let i = 0; i < 6; i++) await sp.getByRole("button", { name: "Kanan 0,25 dtk" }).click();
  await expect(sp.getByText("Target tercapai.")).toBeVisible();
  await sp.getByLabel("Pakai delta").uncheck();
  await sp.getByRole("button", { name: "Tunggu 1 dtk" }).click();
  await sp.getByRole("button", { name: "Tunggu 1 dtk" }).click();
  await sp.getByLabel("Pakai delta").check();
  await sp.getByRole("button", { name: "Jalankan pemeriksaan" }).click();
  await expect(sp.getByText("Latihan lulus!")).toBeVisible();

  await sp.getByLabel("position += direction * speed * delta").check();
  await sp.getByLabel("Refleksi").fill("Tanpa delta, kotak 60 FPS bergerak dua kali lebih jauh dari 30 FPS.");
  await sp.getByLabel("Pertanyaan transfer ke Godot").fill("Delta adalah detik sejak frame sebelumnya.");
  await sp.getByRole("button", { name: "Simpan sekarang" }).click();
  await expect(sp.getByText("Tersimpan.")).toBeVisible();

  // Draft survives a reload.
  await sp.reload();
  await expect(sp.getByLabel("Refleksi")).toHaveValue(/dua kali lebih jauh/);

  // The stranger cannot open this lesson.
  const xp = await signIn(browser, stranger.email);
  const denied = await xp.goto(lessonUrl);
  expect(denied?.status()).toBe(404);

  await sp.getByRole("button", { name: "Kirim ke guru" }).click();
  await sp.getByRole("button", { name: "Ya, kirim" }).click();
  await expect(sp.getByText(/^.?Latihan lulus$/).first()).toBeVisible();
  await expect(sp.getByText("Menunggu tinjauan guru.")).toBeVisible();

  // Teacher reviews and requests revision.
  await tp.goto(`${classUrl}/reviews`);
  await tp.getByRole("link", { name: student.name }).click();
  await expect(tp.getByText("terverifikasi").first()).toBeVisible();
  await tp.getByLabel("Minta revisi").check();
  await tp.getByLabel("Umpan balik untuk siswa").fill("Bagus. Tambahkan contoh CharacterBody2D.");
  await tp.getByRole("button", { name: "Simpan tinjauan" }).click();
  await expect(tp.getByText("Tinjauan disimpan.")).toBeVisible();

  // Student sees feedback and starts a revision; the first submission stays.
  await sp.reload();
  await expect(sp.getByText("Bagus. Tambahkan contoh CharacterBody2D.")).toBeVisible();
  await expect(sp.getByText(/^.?Perlu revisi$/).first()).toBeVisible();
  await sp.getByRole("button", { name: "Mulai revisi" }).click();
  await expect(sp.getByRole("button", { name: "Simpan sekarang" })).toBeVisible();
  await expect(sp.getByText("Percobaan 1", { exact: false })).toBeVisible();
  await expect(sp.getByLabel("Refleksi")).toHaveValue(/dua kali lebih jauh/);
});

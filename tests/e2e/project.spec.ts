// Gate D, project workflow: both surveys, private teacher views, team
// formation, proposal changes → new version → approval, milestone with
// school link, private contribution, rubric visibility, and CSV export.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { provision, signIn } from "./helpers";

const group = (p: Page, name: RegExp) => p.getByRole("group", { name });

test("surveys, teams, proposal, milestones, rubric, export", async ({ browser }) => {
  const teacher = await provision("guruproyek", "teacher");
  const students = await Promise.all(["ani", "budi", "cici", "dodi"].map((n) => provision(n, "student")));

  const tp = await signIn(browser, teacher.email);
  await tp.getByLabel("Nama kelas").fill("Kelas Proyek");
  await tp.getByRole("button", { name: "Buat kelas" }).click();
  await expect(tp.getByRole("heading", { name: "Kelas Proyek" })).toBeVisible();
  const classUrl = tp.url();
  await tp.getByLabel("Sesi", { exact: true }).fill("Selasa 13.00 Lab 2");
  await tp.getByRole("button", { name: "Tambah", exact: true }).click();
  await expect(tp.getByText("Selasa 13.00 Lab 2")).toBeVisible();
  await tp.getByRole("button", { name: "Buat kode" }).click();
  const code = (await tp.locator("p.font-mono").textContent())!.trim();

  await tp.goto(`${classUrl}/assignments`);
  for (const label of ["Survei kesiapan, minat, dan akses (v1)", "Survei minat proyek dan persiapan tim (v1)"]) {
    await tp.getByLabel("Tambahkan konten").selectOption({ label });
    await tp.getByRole("button", { name: "Tambah tugas" }).click();
    await expect(tp.locator("li.card").last()).toContainText(label.replace(" (v1)", ""));
  }
  for (const card of await tp.locator("li.card").all()) {
    await card.getByLabel("Terbitkan").check();
    await card.getByRole("button", { name: "Simpan" }).click();
    await expect(card).toContainText("· Diterbitkan");
  }

  const pages: Page[] = [];
  for (const s of students) {
    const p = await signIn(browser, s.email);
    await p.getByLabel("Kode kelas").fill(code);
    await p.getByRole("button", { name: "Kirim permintaan" }).click();
    await expect(p.getByText("permintaanmu sudah dikirim")).toBeVisible();
    pages.push(p);
  }
  await tp.goto(classUrl);
  for (let i = 0; i < 4; i++) {
    await tp.getByRole("button", { name: "Setujui" }).first().click();
    await expect(tp.getByRole("button", { name: "Setujui" })).toHaveCount(3 - i);
  }

  // Readiness survey (required questions only) for the first student.
  const [a, b, c] = pages;
  await a.goto("/student");
  await a.getByRole("link", { name: "Survei kesiapan, minat, dan akses" }).first().click();
  await expect(a.getByText("Survei ini TIDAK anonim.")).toBeVisible();
  await group(a, /pengalamanmu membuat game/).getByLabel("Belum pernah").check();
  await group(a, /memakai Godot/).getByLabel("Pernah membukanya").check();
  await group(a, /membaca kode sederhana/).getByLabel("3", { exact: true }).check();
  await group(a, /Perangkat apa/).getByLabel("Laptop bersama").check();
  await group(a, /menjalankan Godot/).getByLabel("Lambat").check();
  await group(a, /dukungan di kelas/).getByRole("textbox").fill("Privat: duduk dekat papan.");
  await a.getByRole("button", { name: "Kirim survei" }).click();
  await expect(a.getByText(/Versi 1 terkirim/)).toBeVisible();

  // Project survey with a teammate preference.
  await a.goto("/student");
  await a.getByRole("link", { name: "Survei minat proyek dan persiapan tim" }).first().click();
  await group(a, /judul sementara/).getByRole("textbox").fill("Kebun Koin");
  await group(a, /berulang kali/).getByRole("textbox").fill("Mengambil koin sambil menghindari lebah.");
  await group(a, /game 2D pemula/).getByLabel("Kumpulkan-dan-keluar").check();
  await a.getByLabel("Syarat menang").fill("Semua koin lalu keluar");
  await a.getByLabel("Syarat kalah (atau alasan tidak ada)").fill("Tiga kali tersengat");
  await a.getByLabel("Butir 1").first().fill("Gerak");
  await group(a, /Konsep Godot apa/).getByLabel("Signal").check();
  await group(a, /Peran mana/).getByLabel("Seni").check();
  await group(a, /Peran mana/).getByLabel("Pengujian").check();
  await group(a, /teman sekelas mana/).getByLabel(students[1].name).check();
  await group(a, /ditempatkan di kelompok/).getByLabel("Ya", { exact: true }).check();
  await group(a, /komputer sekolah yang mampu/).getByLabel("Selasa 13.00 Lab 2").check();
  await group(a, /Seni\/audio apa/).getByLabel("Paket aset dari guru").check();
  await group(a, /menghalangi penyelesaian/).getByRole("textbox").fill("Lebah sulit; versi tanpa lebah tetap bisa.");
  await a.getByRole("button", { name: "Kirim survei" }).click();
  await expect(a.getByText(/Versi 1 terkirim/)).toBeVisible();

  // Teacher survey summary: counts real records, private text not aggregated.
  await tp.goto(`${classUrl}/surveys`);
  await expect(tp.getByText("1 dari 4 siswa sudah mengirim; 0 masih draf.")).toBeVisible();
  await expect(tp.getByText("Privat: duduk dekat papan.")).toHaveCount(0);
  await tp.getByRole("link", { name: students[0].name }).click();
  await expect(tp.getByText("Privat: duduk dekat papan.")).toBeVisible();

  // Team formation: three members; the teacher sees private preferences.
  await tp.goto(`${classUrl}/teams`);
  await tp.getByLabel("Nama tim baru").fill("Tim Komet");
  await tp.getByRole("button", { name: "Buat tim" }).click();
  for (const s of students.slice(0, 3)) {
    await tp.getByLabel("Tambah siswa").selectOption({ label: s.name });
    await tp.getByRole("button", { name: "Tambah", exact: true }).click();
    await expect(tp.locator("section.card").first()).toContainText(s.name);
  }
  await expect(tp.getByText("✓ 3 anggota")).toBeVisible();

  // Proposal: student A drafts and submits.
  await a.goto(`${classUrl.replace("/teacher/", "/student/")}/project`);
  await expect(a.getByText(students[1].name, { exact: false })).toBeVisible();
  await a.getByRole("button", { name: "Mulai proposal" }).click();
  const fill: [RegExp, string][] = [
    [/^Judul/, "Kebun Koin"], [/^Pitch/, "Kumpulkan koin lalu keluar."], [/^Loop inti/, "Gerak, ambil koin, hindari lebah."],
    [/^Kontrol/, "Panah/WASD"], [/^Aturan menang/, "Menang semua koin; kalah tiga sengatan."], [/^Konsep\/node/, "CharacterBody2D, Area2D, Timer"],
    [/^Rencana aset/, "Paket aset guru"], [/^Rotasi peran/, "Bergiliran tiap minggu"], [/^Sesi komputer/, "Selasa Lab 2"],
    [/^Risiko terbesar/, "Lebah sulit → lebah diam"], [/^Daftar periksa/, "Menang, kalah, restart"],
  ];
  for (const [label, value] of fill) await a.getByLabel(label).fill(value);
  for (let i = 1; i <= 3; i++) {
    await a.getByLabel(`Tiga fitur wajib ${i}`).fill(`Fitur ${i}`);
    await a.getByLabel(`Tiga milestone ${i}`).fill(`Milestone ${i}`);
  }
  await a.getByRole("button", { name: "Kirim proposal" }).click();
  await expect(a.getByText("Menunggu keputusan guru.")).toBeVisible();

  await tp.goto(`${classUrl}/projects`);
  await tp.getByLabel("Minta perubahan").check();
  await tp.locator("#pfb").fill("Kurangi musuh menjadi satu jenis.");
  await tp.getByRole("button", { name: "Simpan keputusan" }).click();
  await expect(tp.getByText("Tersimpan.")).toBeVisible();

  // Teammate B makes version 2; teacher approves that exact version.
  const bp = b;
  await bp.goto(`${classUrl.replace("/teacher/", "/student/")}/project`);
  await expect(bp.getByText("Kurangi musuh menjadi satu jenis.")).toBeVisible();
  await bp.getByRole("button", { name: "Buat versi baru" }).click();
  await bp.getByLabel(/^Risiko terbesar/).fill("Hanya satu jenis lebah.");
  await bp.getByRole("button", { name: "Kirim proposal" }).click();
  await expect(bp.getByText("v2")).toBeVisible();
  await tp.goto(`${classUrl}/projects`);
  await expect(tp.getByText("v2").first()).toBeVisible();
  await tp.getByLabel("Setujui versi ini").check();
  await tp.locator("#pfb").fill("Disetujui.");
  await tp.getByRole("button", { name: "Simpan keputusan" }).click();
  await expect(tp.getByText("Tersimpan.")).toBeVisible();

  // Milestone with a school link, plus a private contribution.
  await a.reload();
  await a.getByRole("button", { name: "Mulai milestone" }).first().click();
  await a.getByLabel(/^Kemajuan/).fill("Player bergerak dan mengambil koin.");
  await a.getByLabel("Tautan sumber/ekspor (penyimpanan sekolah) 1").fill("javascript:alert(1)");
  await a.getByRole("button", { name: "Kirim milestone" }).click();
  await expect(a.getByText("Harus berupa tautan https yang valid.")).toBeVisible();
  await a.getByLabel("Tautan sumber/ekspor (penyimpanan sekolah) 1").fill("https://drive.school.example/komet");
  await a.getByRole("button", { name: "Kirim milestone" }).click();
  await expect(a.getByRole("link", { name: "drive.school.example" })).toBeVisible();
  await a.locator("#contrib-prototype").fill("Saya membuat scene Player dan Coin.");
  await a.getByRole("button", { name: "Simpan kontribusi" }).first().click();
  await expect(a.getByText("Tersimpan.")).toBeVisible();

  await c.goto(`${classUrl.replace("/teacher/", "/student/")}/project`);
  await expect(c.locator("#contrib-prototype")).toHaveValue(""); // teammates never see it

  await tp.goto(`${classUrl}/projects`);
  await tp.getByLabel("Terima").first().check();
  await tp.locator("#fb-prototype").fill("Prototipe berjalan.");
  await tp.locator("#ob-prototype").fill(`${students[0].name} membuat instance scene Coin di Godot.`);
  await tp.getByRole("button", { name: "Simpan keputusan" }).click();
  await expect(tp.getByText("Tersimpan.")).toBeVisible();
  await tp.getByRole("group", { name: /Nilai tim/ }).getByLabel("Loop inti yang bisa dimainkan (0–20)", { exact: true }).fill("18");
  await tp.getByLabel("Kontribusi dan kolaborasi (0–15)", { exact: true }).first().fill("12");
  await tp.getByLabel("Kontribusi dan kolaborasi (0–15)", { exact: true }).nth(1).fill("9");
  await tp.getByRole("button", { name: "Simpan nilai" }).click();
  await expect(tp.getByText("Tersimpan.")).toBeVisible();

  await a.reload();
  await expect(a.getByRole("cell", { name: "18/20" })).toBeVisible();
  await expect(a.getByRole("cell", { name: "12/15" })).toBeVisible();
  await expect(a.getByRole("cell", { name: "9/15" })).toHaveCount(0); // teammate's individual score hidden

  // Teacher CSV export: download, no emails, formula-safe.
  await tp.goto(classUrl);
  const [download] = await Promise.all([tp.waitForEvent("download"), tp.getByRole("button", { name: "CSV survei" }).click()]);
  const csv = readFileSync((await download.path())!, "utf8");
  expect(csv).toContain("survey:readiness");
  expect(csv).not.toContain("@example.test");
  expect(csv).not.toContain("Privat: duduk dekat papan.");
});

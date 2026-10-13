// Gate E: automated accessibility, keyboard behaviour, all eight activities,
// responsive layout, localization switch, and measured transfer/timing.
// Measurements here come from THIS machine with emulated throttling; they do
// not replace testing on the representative school laptop.
import { mkdirSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { fixtureClass, signIn } from "./helpers";

let fx: Awaited<ReturnType<typeof fixtureClass>>;
test.beforeAll(async () => {
  fx = await fixtureClass();
});

async function axe(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = r.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`);
  expect(summary, `axe violations on ${label}`).toEqual([]);
}

test("automated accessibility on key routes (desktop and phone)", async ({ browser }) => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 375, height: 740 }]) {
    const anonCtx = await browser.newContext({ viewport });
    const anon = await anonCtx.newPage();
    for (const path of ["/", "/sign-in", "/privacy"]) {
      await anon.goto(path);
      await axe(anon, `${path} @${viewport.width}`);
    }
    const sp = await signIn(browser, fx.student.email);
    await sp.setViewportSize(viewport);
    for (const path of ["/student", `/student/classes/${fx.classId}`, `/student/lessons/${fx.lessonAssignments[1]}`, `/student/lessons/${fx.lessonAssignments[0]}`, `/student/surveys/${fx.surveyAssignment}`, `/student/classes/${fx.classId}/project`]) {
      await sp.goto(path);
      await sp.waitForLoadState("networkidle");
      await axe(sp, `${path} @${viewport.width}`);
      const overflow = await sp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal scroll on ${path} @${viewport.width}`).toBeLessThanOrEqual(1);
    }
    const tp = await signIn(browser, fx.teacher.email);
    await tp.setViewportSize(viewport);
    for (const tab of ["", "/assignments", "/reviews", "/surveys", "/teams", "/projects"]) {
      await tp.goto(`/teacher/classes/${fx.classId}${tab}`);
      await axe(tp, `teacher${tab || "/overview"} @${viewport.width}`);
    }
    await tp.goto("/teacher/plan");
    await axe(tp, "plan");
  }
});

test("keyboard: activity captures keys only while focused; Escape releases", async ({ browser }) => {
  const sp = await signIn(browser, fx.student.email);
  await sp.goto(`/student/lessons/${fx.lessonAssignments[1]}`);
  const canvas = sp.locator("canvas");
  await expect(canvas).toBeVisible();
  // Arrow keys outside the canvas scroll the page normally (not captured).
  await sp.locator("body").press("ArrowDown");
  expect(await sp.evaluate(() => document.activeElement?.tagName)).not.toBe("CANVAS");
  await canvas.focus();
  await expect(sp.getByText("Keyboard aktif di permainan. Tekan Escape untuk keluar.")).toBeVisible();
  await canvas.press("Escape");
  expect(await sp.evaluate(() => document.activeElement?.tagName)).not.toBe("CANVAS");
  // Skip link is the first tab stop.
  await sp.goto("/student");
  await sp.keyboard.press("Tab");
  await expect(sp.getByRole("link", { name: "Lompat ke konten utama" })).toBeFocused();
});

test("all eight activities load, step, and run their checks", async ({ browser }) => {
  const sp = await signIn(browser, fx.student.email);
  const errors: string[] = [];
  sp.on("pageerror", (e) => errors.push(e.message));
  for (const [i, id] of fx.lessonAssignments.entries()) {
    await sp.goto(`/student/lessons/${id}`);
    if (i === 0) {
      await sp.getByLabel("Induk").selectOption({ label: "(akar)" });
      await sp.getByRole("button", { name: "Jalankan pemeriksaan" }).click();
    } else {
      await sp.getByRole("button", { name: "Mode teks/langkah" }).click();
      await sp.locator(".card button.btn-sm").first().click();
      await expect(sp.locator("p[aria-live=polite].font-mono")).not.toBeEmpty();
      await sp.getByRole("button", { name: "Jalankan pemeriksaan" }).click();
    }
    await expect(sp.locator("#checks-h + ul li").first(), `module ${i + 1}`).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("language switch keeps unsent work and identifiers", async ({ browser }) => {
  const sp = await signIn(browser, fx.student.email);
  await sp.goto(`/student/lessons/${fx.lessonAssignments[2]}`);
  await sp.getByLabel("Refleksi").fill("Layer adalah tempatku; mask adalah yang kudeteksi.");
  await sp.getByLabel("Bahasa").selectOption("en");
  await expect(sp.getByText("Browser simulation of a Godot concept. GDScript does not run here.")).toBeVisible();
  await expect(sp.getByLabel("Reflection")).toHaveValue(/mask adalah/);
  await expect(sp.getByText("move_and_slide()").first()).toBeVisible();
  await sp.getByLabel("Language").selectOption("id");
  await expect(sp.getByText("Simulasi browser untuk konsep Godot.").first()).toBeVisible();
});

test("performance measurements (throttled: 5 Mbps / 150 ms, 4× CPU)", async ({ browser }) => {
  const sp = await signIn(browser, fx.student.email);
  const ctx = sp.context();
  const cdp = await ctx.newCDPSession(sp);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 625_000, uploadThroughput: 250_000 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const sizes = new Map<string, number>();
  cdp.on("Network.loadingFinished", (e) => sizes.set(e.requestId, e.encodedDataLength));
  const urls = new Map<string, string>();
  cdp.on("Network.responseReceived", (e) => urls.set(e.requestId, e.response.url));

  const t0 = Date.now();
  await sp.goto(`/student/lessons/${fx.lessonAssignments[1]}`, { waitUntil: "commit" });
  await sp.getByRole("heading", { level: 1 }).waitFor();
  const readable = Date.now() - t0;
  await sp.getByRole("button", { name: "Mulai" }).waitFor();
  const usable = Date.now() - t0;
  await sp.waitForLoadState("networkidle");
  const all = [...sizes.entries()].map(([id, bytes]) => ({ url: urls.get(id) ?? "", bytes }));
  const total = all.reduce((n, r) => n + r.bytes, 0);
  const simChunk = all.filter((r) => r.url.includes("/_next/static/chunks/")).sort((a, b) => b.bytes - a.bytes);

  // Cold cache disabled again for warm navigation measurement.
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
  await sp.goto(`/student/classes/${fx.classId}`);
  const w0 = Date.now();
  await sp.getByRole("link", { name: /Koordinat dan gerakan/ }).click();
  await sp.getByRole("button", { name: "Mulai" }).waitFor();
  const warm = Date.now() - w0;

  // Frame rate while the movement sim runs under 4× CPU throttling.
  await sp.getByRole("button", { name: "Mulai" }).click();
  const fps = await sp.evaluate(async () => {
    let n = 0;
    const t = performance.now();
    await new Promise<void>((r) => { const f = () => { n++; if (performance.now() - t < 3000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    return Math.round(n / 3);
  });
  const heap = await sp.evaluate(() => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null);

  const result = { measuredAt: new Date().toISOString(), conditions: "dev machine, Chromium, 5 Mbps down / 150 ms latency / 4x CPU throttle", lessonColdTotalBytes: total, readableMs: readable, usableMs: usable, warmNavigationMs: warm, rafFpsUnderThrottle: fps, usedJSHeapBytes: heap, largestChunks: simChunk.slice(0, 6).map((c) => ({ file: c.url.split("/").pop(), bytes: c.bytes })) };
  mkdirSync(".local-logs", { recursive: true });
  writeFileSync(".local-logs/perf.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  expect(total).toBeLessThan(700_000); // 500 KB core + 200 KB activity budget
  expect(usable).toBeLessThan(5_000);
});

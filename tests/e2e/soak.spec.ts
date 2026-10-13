// 15-minute play/reset/navigation soak. Opt-in: SOAK=1 npx playwright test soak
// Samples JS heap (after forced GC) and window/document listener counts.
import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { fixtureClass, signIn } from "./helpers";

test.skip(!process.env.SOAK, "set SOAK=1 to run the 15-minute soak");
test.setTimeout(20 * 60_000);

test("15-minute activity soak", async ({ browser }) => {
  const fx = await fixtureClass();
  const sp = await signIn(browser, fx.student.email);
  const cdp = await sp.context().newCDPSession(sp);
  const samples: { minute: number; heapMB: number; listeners: number; page: string }[] = [];
  const kinds = fx.lessonAssignments.slice(1); // seven time-based sims
  const end = Date.now() + 15 * 60_000;
  let minute = 0;
  let lastSample = 0;
  let i = 0;
  while (Date.now() < end) {
    const id = kinds[i++ % kinds.length];
    await sp.goto(`/student/lessons/${id}`);
    await sp.getByRole("button", { name: "Mulai" }).click();
    const canvas = sp.locator("canvas");
    for (let k = 0; k < 4; k++) {
      await canvas.press("ArrowRight", { delay: 400 });
      await canvas.press("ArrowDown", { delay: 300 });
    }
    await sp.getByRole("button", { name: "Atur ulang" }).click();
    await sp.getByRole("button", { name: "Jalankan pemeriksaan" }).click();
    if (Date.now() - lastSample > 60_000) {
      lastSample = Date.now();
      await cdp.send("HeapProfiler.collectGarbage");
      const heap = await sp.evaluate(() => (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize);
      const { result: win } = await cdp.send("Runtime.evaluate", { expression: "window" });
      const { result: doc } = await cdp.send("Runtime.evaluate", { expression: "document" });
      const lw = await cdp.send("DOMDebugger.getEventListeners", { objectId: win.objectId! });
      const ld = await cdp.send("DOMDebugger.getEventListeners", { objectId: doc.objectId! });
      samples.push({ minute: minute++, heapMB: Math.round((heap / 1048576) * 10) / 10, listeners: lw.listeners.length + ld.listeners.length, page: id.slice(0, 8) });
      console.log(JSON.stringify(samples.at(-1)));
    }
  }
  mkdirSync(".local-logs", { recursive: true });
  writeFileSync(".local-logs/soak.json", JSON.stringify(samples, null, 2));
  const first = samples[1] ?? samples[0];
  const last = samples.at(-1)!;
  // Bounded: listener count stable and heap growth well under 2x after warm-up.
  expect(last.listeners).toBeLessThanOrEqual(first.listeners + 2);
  expect(last.heapMB).toBeLessThan(first.heapMB * 2);
});

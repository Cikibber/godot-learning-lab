// Browser loop: fixed simulation step, bounded catch-up, decoupled render rate,
// hidden-tab pause. Rendering never changes simulation results.
import { FIXED_DT } from "./core";

export type LoopOptions = {
  step: (dt: number) => void;
  render: () => void;
  /** Render rate cap; 30 helps slow laptops without changing the simulation. */
  renderFps: () => 30 | 60;
};

const MAX_STEPS_PER_FRAME = 8; // keeps ~8 FPS devices at real time; beyond that, drop backlog
const MAX_ELAPSED = 0.25;

export function createLoop(o: LoopOptions) {
  let raf = 0;
  let running = false;
  let last = 0;
  let acc = 0;
  let lastRender = 0;

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) {
      last = now;
      return;
    }
    acc += Math.min((now - last) / 1000, MAX_ELAPSED);
    last = now;
    let n = 0;
    while (acc >= FIXED_DT && n < MAX_STEPS_PER_FRAME) {
      o.step(FIXED_DT);
      acc -= FIXED_DT;
      n++;
    }
    if (n === MAX_STEPS_PER_FRAME) acc = 0; // drop backlog instead of spiralling
    if (now - lastRender >= 1000 / o.renderFps() - 2) {
      o.render();
      lastRender = now;
    }
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return running;
    },
  };
}

/** Sizes the backing store independently of CSS, with a capped pixel ratio. */
export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number, maxDpr = 1.5) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

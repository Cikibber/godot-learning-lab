// Tiny drawing helpers. Colours are paired with shapes/labels so meaning
// never depends on colour alone.
import { WORLD_H, WORLD_W, type Rect } from "./core";

// Matches the workshop palette in app/globals.css (CSS does not reach Canvas).
export const C = {
  bg: "#1c221e",
  grid: "#283029",
  panel: "#2a312c",
  ink: "#f0ebdd",
  onFill: "#17201a",
  player: "#8fb3c9",
  wall: "#727e74",
  water: "#4f88a6",
  goal: "#a8ba8a",
  coin: "#d0aa65",
  hazard: "#e49a87",
  door: "#a8805a",
  muted: "#7f897f",
  select: "#d0aa65",
};

export function clear(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 40; x < WORLD_W; x += 40) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, WORLD_H);
  }
  for (let y = 40; y < WORLD_H; y += 40) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(WORLD_W, y + 0.5);
  }
  ctx.stroke();
}

export function box(ctx: CanvasRenderingContext2D, r: Rect, fill: string, label?: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // Thin dark edge keeps shapes crisp against the grid.
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (label) text(ctx, label, r.x + r.w / 2, r.y + r.h / 2, C.onFill);
}

export function outline(ctx: CanvasRenderingContext2D, r: Rect, stroke: string, dashed = false) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [6, 4] : []);
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  ctx.setLineDash([]);
}

export function diamond(ctx: CanvasRenderingContext2D, r: Rect, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(r.x + r.w / 2, r.y);
  ctx.lineTo(r.x + r.w, r.y + r.h / 2);
  ctx.lineTo(r.x + r.w / 2, r.y + r.h);
  ctx.lineTo(r.x, r.y + r.h / 2);
  ctx.closePath();
  ctx.fill();
}

export function triangle(ctx: CanvasRenderingContext2D, r: Rect, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(r.x + r.w / 2, r.y);
  ctx.lineTo(r.x + r.w, r.y + r.h);
  ctx.lineTo(r.x, r.y + r.h);
  ctx.closePath();
  ctx.fill();
}

export function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = C.ink, size = 13) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s, x, y);
}

export function banner(ctx: CanvasRenderingContext2D, s: string, color: string) {
  ctx.fillStyle = "rgba(25,30,27,0.94)";
  ctx.fillRect(WORLD_W / 2 - 150, WORLD_H / 2 - 26, 300, 52);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(WORLD_W / 2 - 150, WORLD_H / 2 - 26, 300, 52);
  text(ctx, s, WORLD_W / 2, WORLD_H / 2, color, 20);
}

import type { Localized } from "@/lib/validation/content";

/** Localized text: Bahasa Indonesia first (default), then English. */
export const t = (id: string, en: string): Localized => ({ id, en });

export const GODOT_VERSION = "4.6";

export const NOTICE = t(
  "Simulasi browser untuk konsep Godot. GDScript tidak dijalankan di sini.",
  "Browser simulation of a Godot concept. GDScript does not run here.",
);

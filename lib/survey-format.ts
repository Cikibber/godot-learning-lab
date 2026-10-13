import type { Question, Locale } from "@/lib/validation/content";

/** Human-readable text for one stored answer (individual views and CSV). */
export function formatAnswer(q: Question, raw: unknown, locale: Locale, names: Map<string, string>, sessions: Map<string, string>, unsure: string): string {
  if (!raw || typeof raw !== "object") return "";
  const a = raw as Record<string, unknown>;
  const opt = (v: unknown) =>
    q.options?.find((o) => o.value === v)?.label[locale] ?? q.scale?.extra.find((o) => o.value === v)?.label[locale] ?? String(v);
  const text = typeof a.text === "string" && a.text ? ` — ${a.text}` : "";
  switch (q.type) {
    case "single":
      return `${opt(a.choice)}${text}`;
    case "multi":
      return `${((a.choices as string[]) ?? []).map(opt).join(", ")}${text}`;
    case "sessions":
      return ((a.choices as string[]) ?? []).map((c) => (c === "unsure" ? unsure : sessions.get(c) ?? "?")).join(", ");
    case "classmates":
      return ((a.choices as string[]) ?? []).map((c) => names.get(c) ?? "?").join(", ");
    case "scale":
      return typeof a.value === "number" ? String(a.value) : opt(a.value);
    case "text":
      return String(a.text ?? "");
    case "textlist":
      return ((a.items as string[]) ?? []).filter(Boolean).join(" | ");
    case "pair":
      return `${q.pair?.a[locale]}: ${a.a ?? ""} / ${q.pair?.b[locale]}: ${a.b ?? ""}`;
  }
}

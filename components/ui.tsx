import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Block, Localized, Locale } from "@/lib/validation/content";

export const loc = (l: Localized, locale: Locale) => l[locale];

/** Renders `backticks` as code; everything else as escaped text (no HTML). */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return <>{parts.map((p, i) => (p.startsWith("`") && p.endsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : p))}</>;
}

export function Blocks({ blocks, locale }: { blocks: Block[]; locale: Locale }) {
  return (
    <div className="prose-lesson space-y-3">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i}><RichText text={b.text[locale]} /></p>;
          case "list":
            return (
              <ul key={i} className="list-disc space-y-1 pl-6">
                {b.items.map((it, j) => <li key={j}><RichText text={it[locale]} /></li>)}
              </ul>
            );
          case "code":
            return <CodeBlock key={i} code={b.code} caption={b.caption[locale]} />;
          case "callout":
            return (
              <p key={i} className={`flex max-w-[68ch] gap-3 rounded-[3px] border p-3 ${b.tone === "warning" ? "border-warn/50 bg-warn/[0.07]" : "border-line-strong bg-raised"}`}>
                <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-[2px] font-mono text-xs font-bold ${b.tone === "warning" ? "bg-warn text-on-brand" : "bg-brand text-on-brand"}`}>{b.tone === "warning" ? "!" : "i"}</span>
                <span><RichText text={b.text[locale]} /></span>
              </p>
            );
        }
      })}
    </div>
  );
}

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure className="max-w-[80ch] overflow-hidden rounded-[3px] border border-line">
      <div className="flex items-center justify-between border-b border-line bg-raised px-3 py-1 font-mono text-xs text-muted">
        <span>GDScript</span>
        <span aria-hidden="true" className="flex gap-1"><span className="size-2 rounded-full bg-line-strong" /><span className="size-2 rounded-full bg-line-strong" /></span>
      </div>
      <pre className="overflow-x-auto bg-recess p-3 text-sm leading-relaxed text-ink" tabIndex={0}>
        <code className="language-gdscript" translate="no">{code}</code>
      </pre>
      {caption && <figcaption className="border-t border-line bg-recess px-3 py-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

export type StatusKey = "not_started" | "draft" | "submitted" | "practice_passed" | "needs_revision" | "accepted" | "pending" | "approved" | "rejected" | "withdrawn" | "changes_requested";

// Meaning is carried by symbol + label; colour only reinforces it.
const STATUS_STYLE: Record<StatusKey, { icon: string; cls: string }> = {
  not_started: { icon: "○", cls: "border-line-strong text-muted" },
  draft: { icon: "✎", cls: "border-dashed border-muted/70 text-ink" },
  submitted: { icon: "↑", cls: "border-info/70 text-info" },
  practice_passed: { icon: "◆", cls: "border-info/70 bg-info/10 text-info" },
  needs_revision: { icon: "↺", cls: "border-bad/70 bg-bad/10 text-bad" },
  accepted: { icon: "✓", cls: "border-ok/70 bg-ok/10 text-ok" },
  pending: { icon: "…", cls: "border-warn/70 text-warn" },
  approved: { icon: "✓", cls: "border-ok/70 bg-ok/10 text-ok" },
  rejected: { icon: "✕", cls: "border-bad/70 text-bad" },
  withdrawn: { icon: "–", cls: "border-line-strong text-muted" },
  changes_requested: { icon: "↺", cls: "border-bad/70 bg-bad/10 text-bad" },
};

export async function StatusBadge({ status }: { status: StatusKey }) {
  const t = await getTranslations("status");
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-[3px] border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${s.cls}`}>
      <span aria-hidden="true" className="font-mono">{s.icon}</span>
      {t(status)}
    </span>
  );
}

export function PageHeader({ title, subtitle, back, children }: { title: string; subtitle?: ReactNode; back?: { href: string; label: string }; children?: ReactNode }) {
  return (
    <div className="mb-6 space-y-2">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <span aria-hidden="true">‹</span> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="h1">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[3px] border border-dashed border-line-strong bg-recess/60 px-4 py-3 text-muted">{children}</p>;
}

/** Formats an instant in the class timezone (not the server's). */
export function When({ iso, tz, locale }: { iso: string | null; tz: string; locale: Locale }) {
  if (!iso) return null;
  const s = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(new Date(iso));
  return <time dateTime={iso}>{s}</time>;
}

export function Alert({ tone = "info", children }: { tone?: "info" | "ok" | "bad"; children: ReactNode }) {
  const cls = tone === "ok" ? "border-ok/50 bg-ok/[0.08]" : tone === "bad" ? "border-bad/60 bg-bad/[0.08]" : "border-line-strong bg-raised";
  const mark = tone === "ok" ? "✓" : tone === "bad" ? "!" : "i";
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={`flex gap-3 rounded-[3px] border p-3 ${cls}`}>
      <span aria-hidden="true" className={`font-mono font-bold ${tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : "text-muted"}`}>{mark}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

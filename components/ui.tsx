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
              <p key={i} className={`rounded-md border p-3 ${b.tone === "warning" ? "border-warn/40 bg-warn/10" : "border-brand/40 bg-brand/5"}`}>
                <span aria-hidden="true">{b.tone === "warning" ? "⚠ " : "💡 "}</span>
                <RichText text={b.text[locale]} />
              </p>
            );
        }
      })}
    </div>
  );
}

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure>
      <pre className="overflow-x-auto rounded-md bg-[#1f2430] p-3 text-sm leading-relaxed text-[#f4f1ea]" tabIndex={0}>
        <code className="language-gdscript" translate="no">{code}</code>
      </pre>
      {caption && <figcaption className="hint">{caption}</figcaption>}
    </figure>
  );
}

export type StatusKey = "not_started" | "draft" | "submitted" | "practice_passed" | "needs_revision" | "accepted" | "pending" | "approved" | "rejected" | "withdrawn" | "changes_requested";

const STATUS_STYLE: Record<StatusKey, { icon: string; cls: string }> = {
  not_started: { icon: "○", cls: "border-ink/30 text-muted" },
  draft: { icon: "✎", cls: "border-warn text-warn" },
  submitted: { icon: "↑", cls: "border-brand text-brand" },
  practice_passed: { icon: "◆", cls: "border-brand text-brand" },
  needs_revision: { icon: "↺", cls: "border-bad text-bad" },
  accepted: { icon: "✓", cls: "border-ok text-ok" },
  pending: { icon: "…", cls: "border-warn text-warn" },
  approved: { icon: "✓", cls: "border-ok text-ok" },
  rejected: { icon: "✕", cls: "border-bad text-bad" },
  withdrawn: { icon: "–", cls: "border-ink/30 text-muted" },
  changes_requested: { icon: "↺", cls: "border-bad text-bad" },
};


export async function StatusBadge({ status }: { status: StatusKey }) {
  const t = await getTranslations("status");
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${s.cls}`}>
      <span aria-hidden="true">{s.icon}</span>
      {t(status)}
    </span>
  );
}

export function PageHeader({ title, subtitle, back, children }: { title: string; subtitle?: ReactNode; back?: { href: string; label: string }; children?: ReactNode }) {
  return (
    <div className="mb-6 space-y-2">
      {back && <Link href={back.href} className="link text-sm">← {back.label}</Link>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">{title}</h1>
          {subtitle && <p className="text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-line p-4 text-muted">{children}</p>;
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
  const cls = tone === "ok" ? "border-ok/40 bg-ok/10" : tone === "bad" ? "border-bad/40 bg-bad/10" : "border-brand/40 bg-brand/5";
  return <div role={tone === "bad" ? "alert" : "status"} className={`rounded-md border p-3 ${cls}`}>{children}</div>;
}

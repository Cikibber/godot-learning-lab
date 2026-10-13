// Small line-art motifs, one per Godot topic, so each module is recognizable
// at a glance. Static SVG, currentColor strokes, decorative (aria-hidden).
import type { ActivityKind } from "@/exercises/schema";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const PATHS: Record<ActivityKind, React.ReactNode> = {
  // Scene tree: root with two children, one nested.
  scene: (
    <>
      <rect x="20" y="5" width="8" height="8" rx="1" {...S} />
      <path d="M24 13v6M12 19h24M12 19v6M36 19v6M36 33v6" {...S} />
      <circle cx="12" cy="29" r="4" {...S} />
      <circle cx="36" cy="29" r="4" {...S} />
      <rect x="32" y="39" width="8" height="6" rx="1" {...S} />
    </>
  ),
  // Movement: body travels along a path to a target zone.
  movement: (
    <>
      <rect x="4" y="28" width="10" height="10" rx="1" {...S} />
      <path d="M17 33h12" {...S} strokeDasharray="3 3" />
      <path d="M27 29l4 4-4 4" {...S} />
      <rect x="34" y="24" width="10" height="18" rx="1" {...S} strokeDasharray="3 2" />
      <path d="M4 14h40" {...S} opacity="0.5" />
      <path d="M8 10v8M18 10v8M28 10v8M38 10v8" {...S} opacity="0.5" />
    </>
  ),
  // Collision: body stopped against a wall.
  collision: (
    <>
      <rect x="28" y="6" width="8" height="36" {...S} />
      <path d="M29 12l6 6M29 22l6 6M29 32l6 6" {...S} opacity="0.6" />
      <rect x="12" y="20" width="14" height="14" rx="1" {...S} />
      <path d="M6 27h4M8 22l2 2M8 32l2-2" {...S} />
    </>
  ),
  // Input: direction pad with a normalized diagonal.
  input: (
    <>
      <path d="M18 6h12v12h12v12H30v12H18V30H6V18h12z" {...S} />
      <path d="M24 24l9-9" {...S} />
      <path d="M27 15h6v6" {...S} />
    </>
  ),
  // Signals: emitter → connection → receiver.
  signals: (
    <>
      <circle cx="10" cy="24" r="5" {...S} />
      <path d="M17 17a10 10 0 0 1 0 14M21 13a16 16 0 0 1 0 22" {...S} />
      <path d="M24 24h10" {...S} strokeDasharray="2 3" />
      <rect x="34" y="18" width="10" height="12" rx="1" {...S} />
    </>
  ),
  // State: three states with transitions.
  state: (
    <>
      <circle cx="10" cy="14" r="6" {...S} />
      <circle cx="38" cy="14" r="6" {...S} />
      <circle cx="24" cy="38" r="6" {...S} />
      <path d="M16 14h14M35 19l-8 13M19 33l-7-13" {...S} />
      <path d="M27 11l3 3-3 3" {...S} />
    </>
  ),
  // Timer: dial with a hand and ticks.
  timer: (
    <>
      <circle cx="24" cy="26" r="16" {...S} />
      <path d="M20 5h8M24 5v5M24 26l7-7" {...S} />
      <path d="M24 13v2M37 26h-2M24 39v-2M11 26h2" {...S} opacity="0.6" />
    </>
  ),
  // Game loop: start → play → win/lose → restart.
  loop: (
    <>
      <path d="M38 18a16 16 0 1 0 2 12" {...S} />
      <path d="M40 10v8h-8" {...S} />
      <rect x="18" y="20" width="12" height="12" rx="1" {...S} />
      <path d="M22 24l5 2-5 2z" {...S} />
    </>
  ),
};

export function Motif({ kind, size = 48, className = "" }: { kind: ActivityKind; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      {PATHS[kind]}
    </svg>
  );
}

/** Lab mark: a tiny scene tree on a workshop plate. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="4" fill="var(--color-recess)" stroke="var(--color-line-strong)" />
      <path d="M16 11v4M9 15h14M9 15v4M23 15v4" fill="none" stroke="var(--color-muted)" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="12.5" y="5.5" width="7" height="6" rx="1" fill="var(--color-warn)" />
      <circle cx="9" cy="22.5" r="3.4" fill="var(--color-brand)" />
      <rect x="19.6" y="19.2" width="6.8" height="6.8" rx="1" fill="none" stroke="var(--color-brand)" strokeWidth="1.6" />
    </svg>
  );
}

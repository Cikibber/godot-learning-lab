// Static illustration of the practice workspace (Movement Lab): toolbar,
// scene dock, viewport with a body heading for the target zone. Decorative;
// the caption next to it carries the meaning.
export function PracticePreview() {
  const grid = [];
  for (let x = 120; x <= 400; x += 28) grid.push(<path key={`x${x}`} d={`M${x} 56V256`} />);
  for (let y = 56; y <= 256; y += 28) grid.push(<path key={`y${y}`} d={`M104 ${y}H404`} />);
  return (
    <svg viewBox="0 0 420 280" className="block h-auto w-full" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="418" height="278" rx="6" fill="var(--color-recess)" stroke="var(--color-line-strong)" />
      {/* toolbar */}
      <rect x="1" y="1" width="418" height="36" rx="6" fill="var(--color-raised)" />
      <rect x="1" y="30" width="418" height="7" fill="var(--color-raised)" />
      <path d="M1 37H419" stroke="var(--color-line)" />
      <rect x="12" y="10" width="54" height="18" rx="2" fill="none" stroke="var(--color-brand)" />
      <path d="M21 14l7 5-7 5z" fill="var(--color-brand)" />
      <rect x="72" y="10" width="40" height="18" rx="2" fill="none" stroke="var(--color-line-strong)" />
      <rect x="118" y="10" width="62" height="18" rx="2" fill="var(--color-brand)" />
      <path d="M126 19l3 3 6-6" fill="none" stroke="var(--color-on-brand)" strokeWidth="2" />
      {/* scene dock */}
      <rect x="10" y="48" width="84" height="214" rx="2" fill="var(--color-panel)" stroke="var(--color-line)" />
      <rect x="18" y="58" width="9" height="9" rx="1" fill="var(--color-warn)" />
      <rect x="32" y="60" width="44" height="5" rx="1" fill="var(--color-muted)" opacity="0.7" />
      <path d="M22 70v26M22 82h10M22 96h10" stroke="var(--color-line-strong)" fill="none" />
      <circle cx="37" cy="82" r="4" fill="var(--color-brand)" />
      <rect x="45" y="80" width="34" height="5" rx="1" fill="var(--color-muted)" opacity="0.6" />
      <rect x="33" y="92" width="8" height="8" rx="1" fill="none" stroke="var(--color-brand)" strokeWidth="1.5" />
      <rect x="45" y="94" width="28" height="5" rx="1" fill="var(--color-muted)" opacity="0.6" />
      <rect x="18" y="116" width="66" height="1" fill="var(--color-line)" />
      <rect x="18" y="128" width="40" height="4" rx="1" fill="var(--color-muted)" opacity="0.45" />
      <rect x="18" y="138" width="56" height="10" rx="1" fill="var(--color-recess)" stroke="var(--color-line)" />
      <rect x="18" y="138" width="34" height="10" rx="1" fill="var(--color-brand)" opacity="0.5" />
      {/* viewport */}
      <rect x="104" y="48" width="306" height="214" rx="2" fill="#1c221e" stroke="var(--color-line)" />
      <g stroke="#283029">{grid}</g>
      <rect x="330" y="160" width="56" height="56" fill="var(--color-brand)" opacity="0.16" />
      <rect x="331" y="161" width="54" height="54" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M160 188H316" stroke="var(--color-warn)" strokeWidth="2" strokeDasharray="4 5" fill="none" />
      <path d="M310 182l8 6-8 6" stroke="var(--color-warn)" strokeWidth="2" fill="none" />
      <rect x="128" y="174" width="26" height="26" fill="#8fb3c9" stroke="rgba(0,0,0,0.45)" />
      <text x="141" y="191" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="12" fill="#17201a">P</text>
      <text x="358" y="152" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="10" fill="var(--color-brand)">target</text>
      <text x="114" y="66" fontFamily="ui-monospace, monospace" fontSize="10" fill="var(--color-muted)">speed 120 px/s</text>
    </svg>
  );
}

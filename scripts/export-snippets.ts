// Writes every seeded GDScript snippet into a scratch Godot project so the
// pinned editor can parse them: see docs/GODOT_VERIFICATION.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { LESSONS } from "../content";

const dir = process.argv[2] ?? ".local-logs/godot-check";
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/project.godot`, 'config_version=5\n\n[application]\nconfig/name="snippet-check"\n');
for (const l of LESSONS) {
  const snippets = [l.transfer.snippet, ...l.workedExample.flatMap((b) => (b.type === "code" && b.code.startsWith("extends") ? [b.code] : []))];
  [...new Set(snippets.filter(Boolean))].forEach((s, i) => writeFileSync(`${dir}/m${l.module}_${i}.gd`, s!));
}

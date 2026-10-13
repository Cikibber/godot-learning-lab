// CSV with spreadsheet formula-injection neutralization: cells starting with
// = + - @ tab or CR get a leading apostrophe so they are shown as text.
const DANGEROUS = /^[=+\-@\t\r]/;

export function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (DANGEROUS.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

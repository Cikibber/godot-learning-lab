// Timezone-aware conversion between a class-local "YYYY-MM-DDTHH:mm" value
// (from <input type="datetime-local">) and a UTC instant. Independent of the
// host machine's timezone.
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function offsetMs(instant: Date, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(instant).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - instant.getTime();
}

export function localToUtc(local: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m || !isValidTimeZone(tz)) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes handle DST transitions where the offset changes.
  let t = guess - offsetMs(new Date(guess), tz);
  t = guess - offsetMs(new Date(t), tz);
  return new Date(t);
}

export function utcToLocalInput(iso: string | null, tz: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const shifted = new Date(d.getTime() + offsetMs(d, tz));
  return shifted.toISOString().slice(0, 16);
}

/** True when the instant has passed. Request-time check for server components. */
export const isPast = (iso: string | null | undefined): boolean => !!iso && Date.parse(iso) <= Date.now();
export const nowMs = () => Date.now();

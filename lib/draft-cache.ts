// Short-interruption safety net for unsent work. sessionStorage only (gone
// when the tab closes), user-scoped, size-bounded, expiring, and cleared on
// sign-out. Never stores tokens. Not an offline sync system.
const PREFIX = "gll:draft:";
const TTL_MS = 6 * 60 * 60 * 1000;
const MAX_BYTES = 64 * 1024;

const key = (userId: string, scope: string) => `${PREFIX}${userId}:${scope}`;

export function saveLocalDraft(userId: string, scope: string, value: unknown) {
  try {
    const s = JSON.stringify({ at: Date.now(), value });
    if (s.length > MAX_BYTES) return;
    sessionStorage.setItem(key(userId, scope), s);
  } catch {
    // Storage full or disabled: the server draft remains the source of truth.
  }
}

export function loadLocalDraft<T>(userId: string, scope: string): { at: number; value: T } | null {
  try {
    const raw = sessionStorage.getItem(key(userId, scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; value: T };
    if (Date.now() - parsed.at > TTL_MS) {
      sessionStorage.removeItem(key(userId, scope));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLocalDraft(userId: string, scope: string) {
  try {
    sessionStorage.removeItem(key(userId, scope));
  } catch {}
}

/** Called on sign-out and account switch. */
export function clearAllLocalDrafts() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {}
}

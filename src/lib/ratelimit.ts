// Простой лимит попыток в памяти процесса — достаточно для одного VPS.
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60_000;
const LIMIT = 10;

export function tooManyAttempts(key: string): boolean {
  const b = buckets.get(key);
  if (!b || b.resetAt < Date.now()) return false;
  return b.count >= LIMIT;
}

export function registerFailure(key: string) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    b.count++;
  }
  if (buckets.size > 1000) {
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }
}

export function clearFailures(key: string) {
  buckets.delete(key);
}

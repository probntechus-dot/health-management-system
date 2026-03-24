/**
 * Simple in-memory client-side cache for server action results.
 *
 * Prevents redundant DB round-trips when navigating between pages
 * (e.g. /clinic-admin → /settings → /clinic-admin).  Mutations
 * call `invalidate(key)` so the next read fetches fresh data.
 *
 * No TTL — entries live until explicitly invalidated by a mutation.
 */

const store = new Map<string, unknown>()

export function getCached<T>(key: string): T | null {
  const data = store.get(key)
  if (data === undefined) return null
  return data as T
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, data)
}

export function invalidateCache(key: string): void {
  store.delete(key)
}

/** Invalidate all keys that start with the given prefix. */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

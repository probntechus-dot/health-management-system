/**
 * Simple in-memory client-side cache for server action results.
 *
 * Prevents redundant DB round-trips when navigating between pages
 * (e.g. /clinic-admin → /settings → /clinic-admin).  Mutations
 * call `invalidate(key)` so the next read fetches fresh data.
 *
 * Entries can optionally carry a TTL (via `setCacheWithTTL`).
 * Plain `setCache` entries live until explicitly invalidated.
 */

type CacheEntry<T> = {
  data: T
  expiresAt: number | null // null = no expiry
}

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, expiresAt: null })
}

/** Store a value that automatically expires after `ttlMs` milliseconds. */
export function setCacheWithTTL<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
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

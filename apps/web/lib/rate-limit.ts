/**
 * Simple in-memory rate limiter using a Map.
 * Not suitable for multi-server deployments (use Redis in production),
 * but sufficient for a single-server clinic management system.
 *
 * Keyed by IP address (or any string identifier).
 */

interface RateLimitEntry {
  count: number
  resetTime: number // Unix ms timestamp when the window resets
}

const store = new Map<string, RateLimitEntry>()

/**
 * Check if a key has exceeded the allowed request count within the window.
 *
 * @param key        - Identifier (e.g. IP address)
 * @param limit      - Max requests allowed per window (default: 10)
 * @param windowMs   - Window duration in ms (default: 60_000 = 1 minute)
 * @returns { allowed: true } or { allowed: false, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetTime) {
    // First request or window has expired — start a fresh window
    store.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetTime - now }
  }

  // Increment within the current window
  entry.count++
  return { allowed: true }
}

/**
 * Periodically clean up expired entries to prevent unbounded Map growth.
 * Runs every 5 minutes in the background.
 */
function startCleanup() {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetTime) store.delete(key)
    }
  }, 5 * 60_000)
}

// Only start cleanup in server environment
if (typeof setInterval !== 'undefined') {
  startCleanup()
}

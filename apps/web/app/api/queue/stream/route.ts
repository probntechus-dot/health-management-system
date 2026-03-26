import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getClinicEmitter, QUEUE_EVENT } from '@/lib/events'
import { checkRateLimit } from '@/lib/rate-limit'
import type { QueueEvent } from '@/lib/events'

export const dynamic = 'force-dynamic'

// Short-term in-memory cache for SSE session validation results.
// Keyed by `${userId}:${sessionVersion}`. Entry is valid for 30 seconds.
// On reconnect within that window (e.g. navigation remount) we skip the DB
// query — the user was valid 30s ago and session_version hasn't changed.
// A deactivated user or bumped session_version produces a different key,
// so they always miss the cache and hit the DB (correct behaviour).
declare global {
  // eslint-disable-next-line no-var
  var __sseSessionCache: Map<string, number> | undefined
}
const sseSessionCache: Map<string, number> =
  globalThis.__sseSessionCache ??
  (globalThis.__sseSessionCache = new Map())

const SSE_SESSION_CACHE_TTL_MS = 30_000

function isSessionCacheValid(userId: string, sessionVersion: number): boolean {
  const key = `${userId}:${sessionVersion}`
  const ts = sseSessionCache.get(key)
  if (ts === undefined) return false
  if (Date.now() - ts > SSE_SESSION_CACHE_TTL_MS) {
    sseSessionCache.delete(key)
    return false
  }
  return true
}

function cacheSessionValid(userId: string, sessionVersion: number): void {
  sseSessionCache.set(`${userId}:${sessionVersion}`, Date.now())
  // Evict stale entries if map grows large (shouldn't happen in practice)
  if (sseSessionCache.size > 1000) {
    const now = Date.now()
    for (const [key, ts] of sseSessionCache.entries()) {
      if (now - ts > SSE_SESSION_CACHE_TTL_MS) sseSessionCache.delete(key)
    }
  }
}

export async function GET(request: NextRequest) {
  // Read session to get clinic slug
  const cookieStore = await cookies()
  const raw = cookieStore.get('clinic_session')?.value
  if (!raw) {
    return new Response('Unauthorized', { status: 401 })
  }

  let clinicSlug: string
  let userId: string
  let sessionVersion: number
  try {
    const session = JSON.parse(raw) as { clinicSlug: string; userId: string; sessionVersion?: number }
    clinicSlug = session.clinicSlug
    userId = session.userId
    sessionVersion = session.sessionVersion ?? 0
    if (!clinicSlug) throw new Error('No clinicSlug in session')
  } catch {
    return new Response('Invalid session', { status: 401 })
  }

  // Validate session version — reject deactivated or invalidated users.
  // Skip DB query if we validated this exact (userId, sessionVersion) within the last 30s.
  if (!isSessionCacheValid(userId, sessionVersion)) {
    try {
      const { appPool } = await import('@/lib/db/index')
      const rows = await appPool<{ session_version: number; is_active: boolean }[]>`
        SELECT session_version, is_active FROM clinic_users WHERE id = ${userId} LIMIT 1
      `
      if (!rows[0] || !rows[0].is_active || rows[0].session_version !== sessionVersion) {
        return new Response('Session expired', { status: 401 })
      }
      cacheSessionValid(userId, sessionVersion)
    } catch {
      return new Response('Session validation failed', { status: 500 })
    }
  }

  // Rate limit SSE connections: max 5 per minute per user
  const rl = checkRateLimit(`sse:${userId}`, 5, 60_000)
  if (!rl.allowed) {
    return new Response('Too many connections', { status: 429 })
  }

  const emitter = getClinicEmitter(clinicSlug)

  const stream = new ReadableStream({
    start(controller) {
      // Centralised cleanup — idempotent so it is safe to call from multiple
      // paths (abort signal, keepAlive failure, onEvent failure).
      let cleaned = false
      function cleanup() {
        if (cleaned) return
        cleaned = true
        clearInterval(keepAlive)
        emitter.off(QUEUE_EVENT, onEvent)
        try { controller.close() } catch { /* already closed */ }
      }

      // Send a comment every 25s to keep the connection alive through proxies.
      // If enqueue throws the stream is already closed (e.g. client dropped
      // before the abort signal fired). Run full cleanup so the emitter
      // listener is removed immediately rather than leaking until the next
      // keepAlive tick or queue event.
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(': keepalive\n\n')
        } catch {
          cleanup()
        }
      }, 25_000)

      const onEvent = (event: QueueEvent) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`)
        } catch {
          // Stream is closed — clean up so the listener removes itself and the
          // interval is cleared. Without this the listener would stay attached
          // and silently swallow errors on every subsequent queue event for
          // this clinic.
          cleanup()
        }
      }

      emitter.on(QUEUE_EVENT, onEvent)

      // Primary cleanup path: client disconnects or request is cancelled.
      request.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}

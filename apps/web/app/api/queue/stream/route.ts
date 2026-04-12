import { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getClinicEmitter, QUEUE_EVENT } from '@/lib/events'
import { checkRateLimit } from '@/lib/rate-limit'
import type { QueueEvent } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // HMAC-only session verification — zero DB queries.
  // The cookie signature proves the session was issued by this server.
  const raw = request.cookies.get('clinic_session')?.value
  if (!raw) return new Response('Unauthorized', { status: 401 })

  let clinicSlug: string
  let userId: string
  try {
    const dotIdx = raw.lastIndexOf('.')
    if (dotIdx === -1) return new Response('Invalid session', { status: 401 })
    const payload = raw.slice(0, dotIdx)
    const signature = raw.slice(dotIdx + 1)

    const secret = process.env.SESSION_SECRET
    if (!secret) return new Response('Server configuration error', { status: 500 })
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return new Response('Invalid session', { status: 401 })
    }

    const session = JSON.parse(payload) as { clinicSlug: string; userId: string }
    clinicSlug = session.clinicSlug
    userId = session.userId
    if (!clinicSlug) throw new Error('No clinicSlug in session')
  } catch {
    return new Response('Invalid session', { status: 401 })
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

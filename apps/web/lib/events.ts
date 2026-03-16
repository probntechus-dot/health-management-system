import { EventEmitter } from 'events'

// Module-level map of clinic slug → EventEmitter.
// Safe for single-process VPS deployment.
// For multi-process/multi-server, replace with Redis pub/sub.
declare global {
  // eslint-disable-next-line no-var
  var __clinicEmitters: Map<string, EventEmitter> | undefined
}

const emitters: Map<string, EventEmitter> =
  globalThis.__clinicEmitters ??
  (globalThis.__clinicEmitters = new Map())

const QUEUE_EVENT = 'queue_update'

export function getClinicEmitter(slug: string): EventEmitter {
  if (!emitters.has(slug)) {
    const ee = new EventEmitter()
    // Allow up to 100 concurrent SSE connections per clinic before Node.js
    // prints a MaxListenersExceededWarning. Clinics with more than 100
    // simultaneous open SSE tabs will still work — they will just generate a
    // warning in the log. Raise this value if that becomes common.
    ee.setMaxListeners(100)
    emitters.set(slug, ee)
  }
  return emitters.get(slug)!
}

/**
 * Removes the EventEmitter for a clinic from the global map.
 * Call this after a clinic is deleted so the emitter (and any listeners that
 * somehow survived their abort signal) does not linger indefinitely.
 *
 * Any SSE connections still open at deletion time will receive no further
 * events and will eventually be closed by the client's keepalive timeout.
 */
export function deleteClinicEmitter(slug: string): void {
  const ee = emitters.get(slug)
  if (ee) {
    ee.removeAllListeners()
    emitters.delete(slug)
  }
}

export type QueueEvent =
  | { type: 'status_changed'; visitId: string; status: string }
  | { type: 'visit_added' }

export function emitQueueEvent(slug: string, event: QueueEvent): void {
  getClinicEmitter(slug).emit(QUEUE_EVENT, event)
}

export { QUEUE_EVENT }

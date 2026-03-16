/**
 * Centralised logger.
 *
 * In development: logs to the console so engineers see errors immediately.
 * In production:  stub ready for a real reporting service (Sentry, DataDog…).
 *                 Replace the TODO block with `Sentry.captureException(error)`
 *                 or equivalent when the service is wired up.
 */

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  /**
   * Log an error with an optional context message.
   *
   * @param msg   Human-readable description of where/why the error occurred.
   * @param error The raw error object (may be undefined for edge cases).
   */
  error(msg: string, error?: unknown): void {
    if (isDev) {
      console.error(`[ERROR] ${msg}`, error ?? '')
      return
    }

    // TODO: send to Sentry / DataDog / custom endpoint
    // Example:
    //   Sentry.captureException(error, { extra: { msg } })
  },

  /**
   * Log a warning (non-fatal but worth monitoring).
   */
  warn(msg: string, data?: unknown): void {
    if (isDev) {
      console.warn(`[WARN] ${msg}`, data ?? '')
    }
    // TODO: send to monitoring service
  },
}

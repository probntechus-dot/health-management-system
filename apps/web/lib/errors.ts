/**
 * Centralized error handling for the clinic management system.
 *
 * Usage:
 *   throw new AppError('PATIENT_NOT_FOUND', 'Patient record not found', 404)
 *   return { error: formatError(err) }   // in server actions
 *   const msg = getErrorMessage(err)     // for UI display
 */

// ─── Error Codes ────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'DB_ERROR'
  | 'UNKNOWN_ERROR'

// ─── AppError Class ──────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number

  constructor(code: ErrorCode, message: string, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    // Maintain proper prototype chain in transpiled code
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

// ─── Common Errors ───────────────────────────────────────────────────────────

export const Errors = {
  unauthorized: () =>
    new AppError('UNAUTHORIZED', 'You must be logged in to perform this action', 401),

  forbidden: (action?: string) =>
    new AppError('FORBIDDEN', action ? `You do not have permission to ${action}` : 'Access denied', 403),

  notFound: (entity: string) =>
    new AppError('NOT_FOUND', `${entity} not found`, 404),

  validation: (message: string) =>
    new AppError('VALIDATION_ERROR', message, 422),

  rateLimited: (retryAfterSec: number) =>
    new AppError('RATE_LIMITED', `Too many requests. Please wait ${retryAfterSec} seconds.`, 429),

  conflict: (message: string) =>
    new AppError('CONFLICT', message, 409),

  database: (message: string) =>
    new AppError('DB_ERROR', `Database error: ${message}`, 500),
} as const

// ─── formatError ─────────────────────────────────────────────────────────────

/**
 * Convert any caught error into a plain string suitable for server action
 * return values: `return { error: formatError(err) }`.
 */
export function formatError(err: unknown): string {
  if (err instanceof AppError) {
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  return 'An unexpected error occurred'
}

// ─── getErrorMessage ──────────────────────────────────────────────────────────

/**
 * Get a user-friendly display message from any error.
 * Hides internal details (e.g. DB errors) behind a safe generic message.
 *
 * @param err         - Any caught value
 * @param fallback    - Message to show for unknown/DB errors (default generic)
 */
export function getErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (err instanceof AppError) {
    // DB errors contain internal details — show a safe message to users
    if (err.code === 'DB_ERROR' || err.code === 'UNKNOWN_ERROR') {
      return fallback
    }
    return err.message
  }
  if (err instanceof Error) {
    // Generic JS errors — show fallback unless it's clearly a user-facing message
    return fallback
  }
  if (typeof err === 'string') {
    return err
  }
  return fallback
}

// ─── isAppError ──────────────────────────────────────────────────────────────

/** Type guard for AppError */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

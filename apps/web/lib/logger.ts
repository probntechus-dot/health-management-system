const isDev = process.env.NODE_ENV !== 'production'

function sanitize(error: unknown): { name: string; message: string; code?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.replace(
        /postgresql?:\/\/[^\s]+/gi,
        '[REDACTED_DB_URL]',
      ),
      code: (error as Error & { code?: string }).code,
    }
  }
  if (typeof error === 'string') {
    return { name: 'StringError', message: error }
  }
  return { name: 'UnknownError', message: String(error) }
}

export const logger = {
  error(msg: string, error?: unknown): void {
    if (isDev) {
      console.error(`[ERROR] ${msg}`, error ?? '')
      return
    }
    const entry = {
      level: 'error' as const,
      ts: new Date().toISOString(),
      msg,
      ...(error !== undefined && { error: sanitize(error) }),
    }
    console.error(JSON.stringify(entry))
  },

  warn(msg: string, data?: unknown): void {
    if (isDev) {
      console.warn(`[WARN] ${msg}`, data ?? '')
      return
    }
    const entry = {
      level: 'warn' as const,
      ts: new Date().toISOString(),
      msg,
      ...(data !== undefined && { data: sanitize(data) }),
    }
    console.warn(JSON.stringify(entry))
  },
}

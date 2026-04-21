'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: 'error',
        ts: new Date().toISOString(),
        msg: 'Global error boundary triggered',
        error: { name: error.name, message: error.message, digest: error.digest },
      }),
    )
  }, [error])

  return (
    <html>
      <body className="bg-background text-foreground" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <svg className="size-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              An unexpected error occurred. Please try again or return to the home page.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
              >
                Go to home page
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

'use client'

import { useRef, useCallback } from 'react'

/**
 * Hook that ensures only the latest async request's result is used.
 *
 * When a new request is fired before the previous one completes,
 * the previous result is discarded (its callbacks won't run).
 *
 * Usage:
 *   const fire = useLatestRequest()
 *   fire(
 *     () => updatePatientStatus(id, 'called'),
 *     (result) => { /* only runs if this is still the latest request *\/ },
 *     () => { /* onFinally — always runs for latest, clears loading state *\/ },
 *     (err) => { /* onError — network/unexpected throw, latest request only *\/ },
 *   )
 */
export function useLatestRequest() {
  const versionRef = useRef(0)

  const fire = useCallback(<T>(
    request: () => Promise<T>,
    onResult: (result: T) => void,
    onFinally?: () => void,
    onError?: (err: unknown) => void,
  ) => {
    const version = ++versionRef.current
    request()
      .then(result => {
        if (version === versionRef.current) onResult(result)
      })
      .catch(err => {
        // Stale rejections are discarded. For the current request,
        // call onError so the UI can surface the failure rather than
        // silently resetting the loading state with no feedback.
        if (version === versionRef.current) onError?.(err)
      })
      .finally(() => {
        if (version === versionRef.current) onFinally?.()
      })
  }, [])

  return fire
}

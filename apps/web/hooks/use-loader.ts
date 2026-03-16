'use client'

import { useContext, useCallback } from 'react'
import { LoaderContext } from '@/context/loader-context'

export function useLoader() {
  const ctx = useContext(LoaderContext)
  if (!ctx) throw new Error('useLoader must be used within LoaderProvider')

  const startLoading = useCallback((key: string) => ctx.start(key), [ctx])
  const stopLoading  = useCallback((key: string) => ctx.stop(key), [ctx])
  const isLoading    = useCallback((key: string) => ctx.keys.has(key), [ctx])

  // Run an async function with automatic start/stop. Blocks if key is already loading.
  const withLoader = useCallback(async <T>(key: string, fn: () => Promise<T>): Promise<T | null> => {
    if (ctx.keys.has(key)) return null
    ctx.start(key)
    try {
      return await fn()
    } finally {
      ctx.stop(key)
    }
  }, [ctx])

  return { startLoading, stopLoading, isLoading, withLoader, loadingKeys: ctx.keys }
}

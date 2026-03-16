'use client'

import { createContext, useState, useCallback, useMemo } from 'react'

type LoaderContextValue = {
  keys: Set<string>
  start: (key: string) => void
  stop: (key: string) => void
}

export const LoaderContext = createContext<LoaderContextValue | null>(null)

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<Set<string>>(new Set())

  const start = useCallback((key: string) => {
    setKeys(prev => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const stop = useCallback((key: string) => {
    setKeys(prev => {
      if (!prev.has(key)) return prev
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  const value = useMemo(() => ({ keys, start, stop }), [keys, start, stop])

  return <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>
}

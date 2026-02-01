'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { withBuildId } from '@/app/utils/buildId'

interface GlossaryEntry {
  term: string
  definition: string
}

type GlossaryData = Record<string, GlossaryEntry>

interface GlossaryContextType {
  glossaryData: GlossaryData
  isLoading: boolean
}

type GlossaryCacheState = {
  data: GlossaryData | null
  promise: Promise<GlossaryData> | null
  error: Error | null
}

const glossaryCache: GlossaryCacheState = {
  data: null,
  promise: null,
  error: null,
}

export function clearGlossaryCache(): void {
  glossaryCache.data = null
  glossaryCache.promise = null
  glossaryCache.error = null
}

async function loadGlossaryData(): Promise<GlossaryData> {
  if (glossaryCache.data) return glossaryCache.data
  if (glossaryCache.promise) return glossaryCache.promise

  glossaryCache.error = null
  glossaryCache.promise = fetch(withBuildId('/data/glossary.json'))
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load glossary data')
      return res.json()
    })
    .then((data: GlossaryData) => {
      glossaryCache.data = data
      glossaryCache.promise = null
      return data
    })
    .catch((err) => {
      glossaryCache.error = err
      glossaryCache.promise = null
      throw err
    })

  return glossaryCache.promise
}

const GlossaryContext = createContext<GlossaryContextType>({
  glossaryData: {},
  isLoading: true,
})

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [glossaryData, setGlossaryData] = useState<GlossaryData>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const runLoad = () => {
      if (cancelled) return
      loadGlossaryData()
        .then((data) => {
          if (cancelled) return
          setGlossaryData(data)
          setIsLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setGlossaryData({})
          setIsLoading(false)
        })
    }

    // Defer glossary load to avoid blocking first paint and hurting INP
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(runLoad, { timeout: 2000 })
      return () => {
        cancelled = true
        ;(window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId)
      }
    }
    const timeoutId = setTimeout(runLoad, 0)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <GlossaryContext.Provider value={{ glossaryData, isLoading }}>
      {children}
    </GlossaryContext.Provider>
  )
}

export function useGlossary() {
  return useContext(GlossaryContext)
}

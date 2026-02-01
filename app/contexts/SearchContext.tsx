'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useSearchKeyboard } from '@/app/hooks/useSearchKeyboard'
import { loadSearchIndex } from '@/app/utils/searchIndexCache'

interface SearchContextType {
  isOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openSearch = useCallback(() => {
    setIsOpen(true)

    // Load the search index on user intent (opening search), but avoid blocking UI.
    const run = () => {
      loadSearchIndex().catch(() => {
        // Silently fail; search UI will show loading/error and still work once available.
      })
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(run, { timeout: 1500 })
    } else {
      setTimeout(run, 0)
    }
  }, [])

  const closeSearch = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleSearch = useCallback(() => {
    setIsOpen((open) => !open)
  }, [])

  // Register keyboard shortcut globally
  useSearchKeyboard(toggleSearch)

  return (
    <SearchContext.Provider value={{ isOpen, openSearch, closeSearch, toggleSearch }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

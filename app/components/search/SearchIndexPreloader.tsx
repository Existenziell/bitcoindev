'use client'

import { useEffect } from 'react'
import { loadSearchIndex } from '@/app/utils/searchIndexCache'

/**
 * Preloads the search index when the app loads.
 * This ensures the index is ready before users open the search modal.
 */
export default function SearchIndexPreloader() {
  useEffect(() => {
    // Proactively load the search index on app mount
    // The prefetch in layout.tsx ensures the file is already downloaded
    loadSearchIndex().catch((err) => {
      // Silently fail - search will still work, just slower on first use
      console.error('Failed to preload search index:', err)
    })
  }, [])

  return null
}

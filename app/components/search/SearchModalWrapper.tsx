'use client'

import { useSearch } from '@/app/contexts/SearchContext'
import SearchModal from '@/app/components/search/SearchModal'

/**
 * Wrapper component that renders the SearchModal using the shared context.
 * This ensures only one modal instance exists.
 */
export default function SearchModalWrapper() {
  const { isOpen, closeSearch } = useSearch()
  return <SearchModal isOpen={isOpen} onClose={closeSearch} />
}

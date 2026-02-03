'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SearchResultItem } from '@/app/components/SearchResultItem'
import { SearchResultsStatus } from '@/app/components/SearchResultsStatus'
import { MIN_QUERY_LEN } from '@/app/utils/searchLogic'
import { useSearch } from '@/app/hooks/useSearch'
import { useKeyboardNavigation } from '@/app/hooks/useKeyboardNavigation'
import { SearchInput } from '@/app/components/SearchInput'

export default function DocsSearch() {
  const { query, setQuery, results, loading } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { selectedIndex, setSelectedIndex, selectedItemRef } = useKeyboardNavigation({
    items: results,
    inputRef,
    resetDeps: [query],
    allowNavigationWithoutFocus: true,
    onNavigate: (item) => {
      router.push(item.path)
    },
  })

  // Focus the search input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const hasQuery = query.trim().length >= MIN_QUERY_LEN

  return (
    <div className="w-full">
      <div className="mb-2">
        <SearchInput
          variant="inputOnly"
          query={query}
          setQuery={setQuery}
          inputRef={inputRef}
        />
      </div>
      {/* Search Results */}
      {(() => {
        const status = (
          <SearchResultsStatus
            loading={loading}
            queryLength={query.trim().length}
            resultsLength={results.length}
            noResultsMessage="No results found."
            noResultsSubtitle="Try different keywords."
            className="py-12 text-center"
          />
        )
        if (status != null && (loading || hasQuery)) return status
        return null
      })()}
      {!loading && hasQuery && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((result, i) => (
            <SearchResultItem
              key={`${result.path}-${result.title}-${result.section}-${i}`}
              result={result}
              isSelected={i === selectedIndex}
              selectedItemRef={selectedItemRef as React.RefObject<HTMLAnchorElement>}
              onMouseEnter={() => setSelectedIndex(i)}
              refTarget="a"
              linkClassName={`block p-3 rounded-lg border transition-colors group no-underline hover:no-underline ${
                i === selectedIndex
                  ? 'bg-btc/20 dark:bg-btc/25 border-btc'
                  : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-btc'
              }`}
              iconClassName={`flex-shrink-0 w-5 h-5 transition-colors ${
                i === selectedIndex ? 'text-btc' : 'text-gray-400 dark:text-gray-500 group-hover:text-btc'
              }`}
              snippetClassName="line-clamp-2"
              titleClassName={`transition-colors ${
                i === selectedIndex ? 'text-btc' : 'text-gray-900 dark:text-gray-200 group-hover:text-btc'
              }`}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

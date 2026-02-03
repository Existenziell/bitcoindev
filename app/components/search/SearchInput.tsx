'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchIcon, XIcon } from '@/app/components/Icons'
import { SearchResultItem } from '@/app/components/search/SearchResultItem'
import { SearchShortcutKey } from '@/app/components/search/SearchShortcutKey'
import { SearchResultsStatus } from '@/app/components/search/SearchResultsStatus'
import { sections } from '@/app/utils/navigation'
import { getSearchResultSectionLabel } from '@/app/utils/searchResultIcon'
import { MIN_QUERY_LEN } from '@/app/utils/searchLogic'
import type { SearchResult } from '@/app/utils/searchLogic'
import { useSearch } from '@/app/hooks/useSearch'
import { useKeyboardNavigation } from '@/app/hooks/useKeyboardNavigation'

type SearchInputDropdownProps = {
  variant?: 'dropdown'
  query?: string
  setQuery?: (q: string) => void
  results?: SearchResult[]
  loading?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  onEscape?: () => void
  onNavigate?: (item: SearchResult) => void
  enabled?: boolean
  autoFocus?: boolean
}

type SearchInputInputOnlyProps = {
  variant: 'inputOnly'
  query: string
  setQuery: (q: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  placeholder?: string
}

export type SearchInputProps = SearchInputDropdownProps | SearchInputInputOnlyProps

function SearchInputRow({
  value,
  onChange,
  inputRef,
  placeholder = 'Search docs…',
}: {
  value: string
  onChange: (value: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  placeholder?: string
}) {
  return (
    <div className="flex items-center gap-3 px-6">
      <SearchIcon className="flex-shrink-0 w-6 h-6 text-gray-500 dark:text-gray-400" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        autoComplete="off"
        autoCorrect="off"
        aria-label="Search"
      />
      <SearchShortcutKey className="hidden md:inline" />
      <button
        type="button"
        onClick={() => onChange('')}
        className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        aria-label="Close"
      >
        <XIcon className="w-6 h-6" />
      </button>
    </div>
  )
}

export function SearchInput(props: SearchInputProps) {
  const router = useRouter()
  const isInputOnly = props.variant === 'inputOnly'
  const internalSearch = useSearch()
  const internalRef = useRef<HTMLInputElement>(null)

  const query = isInputOnly ? props.query : (props.query ?? internalSearch.query)
  const setQuery = isInputOnly ? props.setQuery : (props.setQuery ?? internalSearch.setQuery)
  const results = isInputOnly ? [] : (props.results ?? internalSearch.results)
  const loading = isInputOnly ? false : (props.loading ?? internalSearch.loading)
  const inputRef = isInputOnly ? props.inputRef : (props.inputRef ?? internalRef)
  const autoFocus = !isInputOnly && 'autoFocus' in props && props.autoFocus

  const { selectedIndex, setSelectedIndex, selectedItemRef } = useKeyboardNavigation({
    items: results,
    inputRef,
    enabled: (props.variant !== 'inputOnly' && (props.enabled ?? true)) || false,
    resetDeps: [query],
    onEscape: props.variant === 'inputOnly' ? undefined : props.onEscape,
    onNavigate:
      props.variant === 'inputOnly' ? () => {} : (props.onNavigate ?? ((item) => router.push(item.path))),
  })

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus, inputRef])

  if (isInputOnly) {
    const { placeholder } = props
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden focus-within:border-btc dark:focus-within:border-btc">
        <SearchInputRow
          value={query}
          onChange={setQuery}
          inputRef={inputRef}
          placeholder={placeholder}
        />
      </div>
    )
  }

  const sectionTitle = (id: string) => sections[id as keyof typeof sections]?.title ?? id

  return (
    <div
      className="w-full max-w-2xl rounded-lg shadow-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <SearchInputRow value={query} onChange={setQuery} inputRef={inputRef} />
      <div className="max-h-[min(60vh,400px)] overflow-y-auto overflow-x-hidden">
        {loading ||
        (query.length > 0 && query.length < MIN_QUERY_LEN) ||
        (query.length >= MIN_QUERY_LEN && results.length === 0) ? (
          <SearchResultsStatus
            loading={loading}
            queryLength={query.length}
            resultsLength={results.length}
            showMinChars
            className="py-8 text-center text-secondary text-sm"
          />
        ) : results.length > 0 ? (
          <ul className="py-2 min-w-0" role="listbox">
            {results.map((r, i) => (
              <SearchResultItem
                key={`${r.path}-${r.title}-${r.section}-${i}`}
                result={r}
                isSelected={i === selectedIndex}
                selectedItemRef={selectedItemRef as React.RefObject<HTMLLIElement>}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => (props.onNavigate ? props.onNavigate(r) : router.push(r.path))}
                refTarget="li"
                linkClassName={`flex gap-3 px-4 py-2.5 text-left transition-colors no-underline hover:no-underline block w-full min-w-0 ${
                  i === selectedIndex
                    ? 'bg-btc/20 dark:bg-btc/25 text-gray-900 dark:text-gray-200'
                    : 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                iconClassName="w-5 h-5 mt-0.5 text-gray-500 dark:text-gray-400"
                sectionLabel={getSearchResultSectionLabel(r.path, r.section, sectionTitle)}
                snippetClassName="line-clamp-2 md:line-clamp-none md:truncate"
              />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

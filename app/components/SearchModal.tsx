'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { SearchIcon, XIcon, BookOpenIcon } from '@/app/components/Icons'
import { SearchResultItem } from '@/app/components/SearchResultItem'
import { SearchResultsStatus } from '@/app/components/SearchResultsStatus'
import { sections } from '@/app/utils/navigation'
import { getSearchResultSectionLabel } from '@/app/utils/searchResultIcon'
import { MIN_QUERY_LEN } from '@/app/utils/searchLogic'
import { useSearch } from '@/app/hooks/useSearch'
import { useKeyboardNavigation } from '@/app/hooks/useKeyboardNavigation'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { query, setQuery, results, loading } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const previousPathnameRef = useRef<string>(pathname)

  const { selectedIndex, setSelectedIndex, selectedItemRef } = useKeyboardNavigation({
    items: results,
    inputRef,
    enabled: isOpen,
    resetDeps: [query],
    onEscape: onClose,
    onNavigate: (item) => {
      onClose()
      router.push(item.path)
    },
  })

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      inputRef.current?.focus()
    } else {
      // Clear query when modal closes to ensure fresh state on next open
      setQuery('')
    }
  }, [isOpen, setQuery])

  // Close modal and clear query when pathname changes (navigation occurred)
  useEffect(() => {
    if (isOpen && pathname !== previousPathnameRef.current) {
      previousPathnameRef.current = pathname
      setQuery('')
      onClose()
    } else if (!isOpen) {
      // Update ref when modal closes to track the current pathname
      previousPathnameRef.current = pathname
    }
  }, [pathname, isOpen, onClose, setQuery])

  if (!isOpen) return null

  const sectionTitle = (id: string) => sections[id as keyof typeof sections]?.title ?? id

  return (
    <div
      className="modal-overlay flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
      <div
        className="w-full max-w-2xl rounded-lg shadow-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6">
          <Link
            href="/docs"
            onClick={onClose}
            className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-btc hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Go to documentation overview"
            title="Documentation overview"
          >
            <SearchIcon className="flex-shrink-0 w-6 h-6 text-gray-500 dark:text-gray-400" />
          </Link>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs…"
            className="flex-1 py-5 text-lg bg-transparent border-0 border-none outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-gray-200 focus:ring-0 focus:border-0"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Search"
          />
          <code className="code-inline py-0 hidden md:inline">
            <span className="text-lg inline-block align-middle">⌘</span> + K
          </code>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
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
                  key={r.path + r.title}
                  result={r}
                  isSelected={i === selectedIndex}
                  selectedItemRef={selectedItemRef as React.RefObject<HTMLLIElement>}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={onClose}
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
    </div>
  )
}

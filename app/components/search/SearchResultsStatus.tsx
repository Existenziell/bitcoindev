'use client'

import { MIN_QUERY_LEN } from '@/app/utils/searchLogic'

export interface SearchResultsStatusProps {
  loading: boolean
  queryLength: number
  resultsLength: number
  /** Show "Type at least N characters" when query is short (e.g. modal) */
  showMinChars?: boolean
  /** Custom "no results" message (e.g. "No results." vs "No results found.") */
  noResultsMessage?: string
  /** Optional subtitle under no-results message (e.g. "Try different keywords.") */
  noResultsSubtitle?: React.ReactNode
  /** Wrapper class for loading / no-results (e.g. "py-8" for modal, "py-12" for panel) */
  className?: string
}

/**
 * Shared loading and empty states for search UIs.
 * Returns the appropriate message or null when results should be shown.
 */
export function SearchResultsStatus({
  loading,
  queryLength,
  resultsLength,
  showMinChars = false,
  noResultsMessage = 'No results.',
  noResultsSubtitle,
  className = 'py-8 text-center text-secondary text-sm',
}: SearchResultsStatusProps): React.ReactNode {
  if (loading) {
    return <div className={className}>Searching…</div>
  }

  const hasMinChars = queryLength >= MIN_QUERY_LEN
  if (showMinChars && queryLength > 0 && !hasMinChars) {
    return (
      <div className={className}>
        Type at least {MIN_QUERY_LEN} characters.
      </div>
    )
  }

  if (hasMinChars && resultsLength === 0) {
    return (
      <div className={className}>
        {noResultsSubtitle != null ? (
          <>
            <p className="text-secondary text-sm mb-2">{noResultsMessage}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{noResultsSubtitle}</p>
          </>
        ) : (
          noResultsMessage
        )}
      </div>
    )
  }

  return null
}

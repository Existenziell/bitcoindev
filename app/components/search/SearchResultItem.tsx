'use client'

import Link from 'next/link'
import { SearchResultIcon } from '@/app/utils/searchResultIcon'
import type { SearchResult } from '@/app/utils/searchLogic'

export interface SearchResultItemProps {
  result: SearchResult
  isSelected: boolean
  selectedItemRef: React.RefObject<HTMLAnchorElement | HTMLLIElement | null>
  onMouseEnter: () => void
  onClick?: () => void
  /** Link element - use 'a' for DocsSearch (ref on Link), 'li' for SearchModal (ref on li, Link inside) */
  refTarget: 'a' | 'li'
  linkClassName: string
  iconClassName: string
  /** Optional section label shown below snippet (e.g. "Tool", "People", section title) */
  sectionLabel?: string
  /** Optional class for snippet (e.g. "truncate" for modal, "line-clamp-2" for panel) */
  snippetClassName?: string
  /** Optional class for title (e.g. "transition-colors ... group-hover:text-btc" for panel) */
  titleClassName?: string
}

/**
 * Shared search result row: icon + title + snippet + optional section label.
 * Used by SearchModal and DocsSearch with different styling (linkClassName, iconClassName).
 */
export function SearchResultItem({
  result,
  isSelected,
  selectedItemRef,
  onMouseEnter,
  onClick,
  refTarget,
  linkClassName,
  iconClassName,
  sectionLabel,
  snippetClassName = 'truncate',
  titleClassName,
}: SearchResultItemProps) {
  const linkContent = (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 mt-0.5" aria-hidden>
        <SearchResultIcon path={result.path} className={iconClassName} />
      </span>
      <div className="min-w-0 flex-1">
        <div className={titleClassName != null ? `font-medium ${titleClassName}` : 'font-medium'}>{result.title}</div>
        <div className={`text-sm text-secondary mt-1 ${snippetClassName}`}>{result.snippet}</div>
        {sectionLabel !== undefined && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{sectionLabel}</div>
        )}
      </div>
    </div>
  )

  const sharedLinkProps = {
    href: result.path,
    onMouseEnter,
    className: linkClassName,
    'data-selected': isSelected,
  }

  if (refTarget === 'li') {
    return (
      <li
        ref={isSelected ? (selectedItemRef as React.RefObject<HTMLLIElement>) : null}
        role="option"
        aria-selected={isSelected}
        onMouseEnter={onMouseEnter}
      >
        <Link {...sharedLinkProps} onClick={onClick}>
          {linkContent}
        </Link>
      </li>
    )
  }

  return (
    <li>
      <Link
        ref={isSelected ? (selectedItemRef as React.RefObject<HTMLAnchorElement>) : null}
        {...sharedLinkProps}
        onClick={onClick}
      >
        {linkContent}
      </Link>
    </li>
  )
}

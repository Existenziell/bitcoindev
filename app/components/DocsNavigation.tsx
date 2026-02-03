'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, docsNavLinksTop, docsNavLinksBottom, interactiveToolsNavItem } from '@/app/utils/navigation'
import { toggleInSet } from '@/app/utils/setUtils'
import { ChevronRight, PanelCollapseIcon, PanelExpandIcon } from '@/app/components/Icons'
import { cn } from '@/app/utils/cn'

/** Indentation for subsection (child) lists – clearly shows hierarchy */
const CHILD_LIST_INDENT = 'ml-4'
const CHILD_LIST_BORDER = 'border-l-2 border-gray-200 dark:border-gray-700 pl-2'

const navRowClass =
  'flex items-center gap-1.5 w-full rounded-r-md border-l-4 border-transparent pl-2 pr-2 py-1 transition-colors group/row hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
const navRowActiveClass = '!border-btc border-l-4 bg-btc/5 dark:bg-btc/10'
const navChevronClass =
  'flex-shrink-0 p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 transition-colors hover:border-btc hover:text-btc dark:hover:text-btc'

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

function findActiveSectionHref(pathname: string): string | null {
  if (pathname === '/interactive-tools' || pathname.startsWith('/interactive-tools/')) {
    return '/interactive-tools'
  }
  for (const section of navItems) {
    if (matchesPath(pathname, section.href)) {
      return section.href
    }
  }
  return null
}

function getLinkClassName(isActive: boolean, size: 'default' | 'sm' = 'default'): string {
  const baseClasses = size === 'sm'
    ? 'block text-sm py-1 leading-tight transition-colors'
    : 'block py-1 leading-tight transition-colors'
  const hover = 'hover:text-btc hover:no-underline'

  if (isActive) {
    return `${baseClasses} text-btc font-semibold hover:no-underline`
  }

  return size === 'sm'
    ? `${baseClasses} text-secondary ${hover}`
    : `${baseClasses} text-gray-700 dark:text-gray-300 ${hover}`
}

interface DocsNavigationProps {
  isNavCollapsed?: boolean
  onToggleNav?: () => void
  onLinkClick?: () => void
}

export default function DocsNavigation({
  isNavCollapsed,
  onToggleNav,
  onLinkClick,
}: DocsNavigationProps) {
  const isNavNarrow = isNavCollapsed === true && onToggleNav != null
  const pathname = usePathname()

  const activeSection = useMemo(() => findActiveSectionHref(pathname), [pathname])

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    return activeSection ? new Set([activeSection]) : new Set()
  })

  const [isDocsExpanded, setIsDocsExpanded] = useState(() => pathname.startsWith('/docs'))

  useEffect(() => {
    setIsDocsExpanded(pathname.startsWith('/docs'))
  }, [pathname])

  useEffect(() => {
    if (activeSection) {
      queueMicrotask(() => {
        setExpandedSections(prev => {
          if (!prev.has(activeSection)) {
            const newSet = new Set(prev)
            newSet.add(activeSection)
            return newSet
          }
          return prev
        })
      })
    }
  }, [activeSection])

  /** Active only for exact path (highlight single current item, not parent nodes) */
  const isActive = (href: string) => pathname === href

  const toggleSection = (href: string) => {
    setExpandedSections(prev => toggleInSet(prev, href))
  }

  const isExpanded = (href: string) => expandedSections.has(href)

  // Collapsed sidebar: expand trigger below (nav content hidden)
  if (isNavNarrow && onToggleNav) {
    return (
      <nav className="w-full flex flex-col">
        <button
          type="button"
          onClick={onToggleNav}
          className="w-full flex items-center justify-center px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-btc transition-colors"
          aria-label="Expand navigation"
          title="Expand sidebar"
        >
          <PanelExpandIcon className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
        </button>
      </nav>
    )
  }

  return (
    <nav className="w-full flex-shrink-0 sticky top-0 flex flex-col">
      {/* Collapse trigger above the nav */}
      {onToggleNav && (
        <button
          type="button"
          onClick={onToggleNav}
          className="mb-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-btc transition-colors"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <PanelCollapseIcon className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Collapse</span>
        </button>
      )}

      <div className="min-w-60">
        <div className="mb-2">
          <ul className="space-y-1">
            {docsNavLinksTop.map((link) => (
              <li key={link.href}>
                <div
                  className={cn(
                    navRowClass,
                    isActive(link.href) && navRowActiveClass
                  )}
                >
                  <Link
                    href={link.href}
                    className={cn('flex-1 min-w-0', getLinkClassName(isActive(link.href)))}
                    onClick={onLinkClick}
                  >
                    {link.title}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Docs link - navigates to /docs overview page */}
        <div className="mb-1">
          <div
            className={cn(
              navRowClass,
              isActive('/docs') && navRowActiveClass,
              'text-base mb-1'
            )}
          >
            <button
              onClick={() => setIsDocsExpanded((v) => !v)}
              className={navChevronClass}
              aria-expanded={isDocsExpanded}
              aria-label={isDocsExpanded ? 'Collapse docs tree' : 'Expand docs tree'}
            >
              <ChevronRight
                className={`shrink-0 w-4 h-4 transition-transform ${
                  isDocsExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
            <Link
              href="/docs"
              className={cn(
                'flex-1 min-w-0 transition-colors',
                isActive('/docs')
                  ? 'text-btc font-semibold hover:no-underline'
                  : 'text-gray-700 dark:text-gray-300 hover:text-btc hover:no-underline'
              )}
              onClick={onLinkClick}
            >
              Bitcoin Docs
            </Link>
          </div>
        </div>
        {isDocsExpanded && (
          <ul className={cn(CHILD_LIST_INDENT, 'space-y-1 mt-1')}>
            {navItems.map((item) => {
              const itemActive = isActive(item.href)
              const hasChildren = item.children && item.children.length > 0
              const expanded = isExpanded(item.href)

              return (
                <li key={item.href}>
                  <div
                    className={cn(
                      navRowClass,
                      itemActive && navRowActiveClass
                    )}
                  >
                    {hasChildren ? (
                      <button
                        onClick={() => toggleSection(item.href)}
                        className={navChevronClass}
                        aria-label={expanded ? 'Collapse section' : 'Expand section'}
                      >
                        <ChevronRight
                          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    ) : (
                      <span className="w-[22px] shrink-0" aria-hidden />
                    )}
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      className={cn('flex-1 min-w-0', getLinkClassName(itemActive))}
                    >
                      {item.title}
                    </Link>
                  </div>
                  {hasChildren && expanded && (
                    <ul className={cn(CHILD_LIST_INDENT, CHILD_LIST_BORDER, 'mt-1 space-y-0')}>
                      {item.children!.map((child) => (
                        <li key={child.href}>
                          <div
                            className={cn(
                              navRowClass,
                              isActive(child.href) && navRowActiveClass,
                              'py-0.5'
                            )}
                          >
                            <Link
                              href={child.href}
                              className={cn('flex-1 min-w-0', getLinkClassName(isActive(child.href), 'sm'))}
                              onClick={onLinkClick}
                            >
                              {child.title}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* Interactive Tools - expandable section */}
        <div className="mb-1 mt-2">
          <div
            className={cn(
              navRowClass,
              isActive('/interactive-tools') && navRowActiveClass,
              'text-base mb-1'
            )}
          >
            <button
              onClick={() => toggleSection('/interactive-tools')}
              className={navChevronClass}
              aria-expanded={isExpanded('/interactive-tools')}
              aria-label={isExpanded('/interactive-tools') ? 'Collapse Interactive Tools' : 'Expand Interactive Tools'}
            >
              <ChevronRight
                className={`shrink-0 w-4 h-4 transition-transform ${
                  isExpanded('/interactive-tools') ? 'rotate-90' : ''
                }`}
              />
            </button>
            <Link
              href="/interactive-tools"
              className={cn(
                'flex-1 min-w-0 transition-colors',
                isActive('/interactive-tools')
                  ? 'text-btc font-semibold hover:no-underline'
                  : 'text-gray-700 dark:text-gray-300 hover:text-btc hover:no-underline'
              )}
              onClick={onLinkClick}
            >
              Interactive Tools
            </Link>
          </div>
        </div>
        {isExpanded('/interactive-tools') && interactiveToolsNavItem.children && (
          <ul className={cn(CHILD_LIST_INDENT, 'mt-1 space-y-0 mb-2')}>
            {interactiveToolsNavItem.children.map((child) => (
              <li key={child.href}>
                <div
                  className={cn(
                    navRowClass,
                    isActive(child.href) && navRowActiveClass,
                    'py-0.5'
                  )}
                >
                  <Link
                    href={child.href}
                    className={cn('flex-1 min-w-0', getLinkClassName(isActive(child.href), 'sm'))}
                    onClick={onLinkClick}
                  >
                    {child.title}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2">
          <ul className="space-y-1">
            {docsNavLinksBottom.map((link) => (
              <li key={link.href}>
                <div
                  className={cn(
                    navRowClass,
                    isActive(link.href) && navRowActiveClass
                  )}
                >
                  <Link
                    href={link.href}
                    className={cn('flex-1 min-w-0', getLinkClassName(isActive(link.href)))}
                    onClick={onLinkClick}
                  >
                    {link.title}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}

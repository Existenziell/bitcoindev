'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { philosophyNavItems, bitcoinDocsNavItems, topLevelNavGroups, docsNavLinksTop, docsNavLinksBottom, interactiveToolsNavItem } from '@/app/utils/navigation'
import { toggleInSet } from '@/app/utils/setUtils'
import { ChevronRight, PanelCollapseIcon, PanelExpandIcon } from '@/app/components/Icons'
import { cn } from '@/app/utils/cn'

/** Indentation for subsection (child) lists – clearly shows hierarchy */
const CHILD_LIST_INDENT = 'ml-4'
const CHILD_LIST_BORDER = 'border-l-2 border-gray-200 dark:border-gray-700 pl-2'

const navRowClass =
  'flex items-center gap-2.5 w-full rounded-r-md border-l-4 border-transparent pl-2 pr-2 py-1 transition-colors group/row hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
const navRowActiveClass = '!border-accent border-l-4 bg-accent/5 dark:bg-accent/10'
const navChevronClass =
  'flex-shrink-0 p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 transition-colors hover:border-accent hover:text-accent dark:hover:text-accent'

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

function findActiveSectionHref(pathname: string): string | null {
  if (pathname === '/interactive-tools' || pathname.startsWith('/interactive-tools/')) {
    return '/interactive-tools'
  }
  for (const section of philosophyNavItems) {
    if (matchesPath(pathname, section.href)) {
      return section.href
    }
  }
  for (const section of bitcoinDocsNavItems) {
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
  const hover = 'hover:text-accent hover:no-underline'

  if (isActive) {
    return `${baseClasses} text-accent font-semibold hover:no-underline`
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
  const [isPhilosophyExpanded, setIsPhilosophyExpanded] = useState(() => pathname.startsWith('/philosophy'))

  useEffect(() => {
    setIsDocsExpanded(pathname.startsWith('/docs'))
  }, [pathname])

  useEffect(() => {
    setIsPhilosophyExpanded(pathname.startsWith('/philosophy'))
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

  /** Active for exact path (used for leaf links and overview pages) */
  const isActive = (href: string) => pathname === href

  /** Active when current path is this section or any child (for section row highlight) */
  const isSectionActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

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
          className="btn-pill w-full flex items-center justify-center px-4 py-3"
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
      {onToggleNav && (
        <button
          type="button"
          onClick={onToggleNav}
          className="btn-pill mb-3 w-full flex items-center justify-center gap-2 py-2.5"
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

        {topLevelNavGroups.map((group) => {
          const isPhilosophyGroup = group.title === 'Philosophy'
          const isGroupExpanded = group.href === '/interactive-tools'
            ? isExpanded('/interactive-tools')
            : group.href === '/docs'
              ? isDocsExpanded
              : isPhilosophyGroup
                ? isPhilosophyExpanded
                : isExpanded(group.items[0]?.href)
          const toggleGroup = () => {
            if (group.href === '/docs') {
              setIsDocsExpanded((v) => !v)
            } else if (group.href === '/interactive-tools') {
              toggleSection('/interactive-tools')
            } else if (isPhilosophyGroup) {
              setIsPhilosophyExpanded((v) => !v)
            }
          }
          const groupActive =
            group.href === '/interactive-tools'
              ? isSectionActive('/interactive-tools')
              : group.href === '/docs'
                ? pathname === '/docs' || bitcoinDocsNavItems.some((i) => isSectionActive(i.href))
                : group.href === '/philosophy'
                  ? pathname === '/philosophy' || philosophyNavItems.some((i) => isSectionActive(i.href))
                  : group.items.some((i) => isSectionActive(i.href))
          return (
            <div key={group.href} className={cn(group.href === '/interactive-tools' ? 'mb-1 mt-2' : 'mb-1')}>
              <div
                className={cn(
                  navRowClass,
                  groupActive && navRowActiveClass,
                  'text-base mb-1'
                )}
              >
                <button
                  onClick={toggleGroup}
                  className={navChevronClass}
                  aria-expanded={isGroupExpanded}
                  aria-label={isGroupExpanded ? `Collapse ${group.title}` : `Expand ${group.title}`}
                >
                  <ChevronRight
                    className={`shrink-0 w-4 h-4 transition-transform ${isGroupExpanded ? 'rotate-90' : ''}`}
                  />
                </button>
                <Link
                  href={group.href}
                  className={cn(
                    'flex-1 min-w-0 transition-colors',
                    groupActive
                      ? 'text-accent font-semibold hover:no-underline'
                      : 'text-gray-700 dark:text-gray-300 hover:text-accent hover:no-underline'
                  )}
                  onClick={onLinkClick}
                >
                  {group.title}
                </Link>
              </div>
              {group.href === '/docs' && isDocsExpanded && (
                <ul className={cn(CHILD_LIST_INDENT, 'space-y-1 mt-1')}>
                  {bitcoinDocsNavItems.map((item) => {
                    const itemActive = isSectionActive(item.href)
                    const hasChildren = item.children && item.children.length > 0
                    const expanded = isExpanded(item.href)
                    return (
                      <li key={item.href}>
                        <div className={cn(navRowClass, itemActive && navRowActiveClass)}>
                          {hasChildren ? (
                            <button onClick={() => toggleSection(item.href)} className={navChevronClass} aria-label={expanded ? 'Collapse section' : 'Expand section'}>
                              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                            </button>
                          ) : (
                            <span className="w-[22px] shrink-0" aria-hidden />
                          )}
                          <Link href={item.href} onClick={onLinkClick} className={cn('flex-1 min-w-0', getLinkClassName(itemActive))}>
                            {item.title}
                          </Link>
                        </div>
                        {hasChildren && expanded && (
                          <ul className={cn(CHILD_LIST_INDENT, CHILD_LIST_BORDER, 'mt-1 space-y-0')}>
                            {item.children!.map((child) => (
                              <li key={child.href}>
                                <div className={cn(navRowClass, isActive(child.href) && navRowActiveClass, 'py-0.5')}>
                                  <Link href={child.href} className={cn('flex-1 min-w-0', getLinkClassName(isActive(child.href), 'sm'))} onClick={onLinkClick}>
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
              {isPhilosophyGroup && isPhilosophyExpanded && (
                <ul className={cn(CHILD_LIST_INDENT, 'space-y-1 mt-1')}>
                  {philosophyNavItems.map((item) => {
                    const itemActive = isSectionActive(item.href)
                    const hasChildren = item.children && item.children.length > 0
                    const expanded = isExpanded(item.href)
                    return (
                      <li key={item.href}>
                        <div className={cn(navRowClass, itemActive && navRowActiveClass)}>
                          {hasChildren ? (
                            <button onClick={() => toggleSection(item.href)} className={navChevronClass} aria-label={expanded ? 'Collapse section' : 'Expand section'}>
                              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                            </button>
                          ) : (
                            <span className="w-[22px] shrink-0" aria-hidden />
                          )}
                          <Link href={item.href} onClick={onLinkClick} className={cn('flex-1 min-w-0', getLinkClassName(itemActive))}>
                            {item.title}
                          </Link>
                        </div>
                        {hasChildren && expanded && (
                          <ul className={cn(CHILD_LIST_INDENT, CHILD_LIST_BORDER, 'mt-1 space-y-0')}>
                            {item.children!.map((child) => (
                              <li key={child.href}>
                                <div className={cn(navRowClass, isActive(child.href) && navRowActiveClass, 'py-0.5')}>
                                  <Link href={child.href} className={cn('flex-1 min-w-0', getLinkClassName(isActive(child.href), 'sm'))} onClick={onLinkClick}>
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
              {group.href === '/interactive-tools' && isExpanded('/interactive-tools') && interactiveToolsNavItem.children && (
                <ul className={cn(CHILD_LIST_INDENT, 'mt-1 space-y-0 mb-2')}>
                  {interactiveToolsNavItem.children.map((child) => (
                    <li key={child.href}>
                      <div className={cn(navRowClass, isActive(child.href) && navRowActiveClass, 'py-0.5')}>
                        <Link href={child.href} className={cn('flex-1 min-w-0', getLinkClassName(isActive(child.href), 'sm'))} onClick={onLinkClick}>
                          {child.title}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}

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

'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, docsNavLinksTop, docsNavLinksBottom, interactiveToolsNavItem } from '@/app/utils/navigation'
import { toggleInSet } from '@/app/utils/setUtils'
import { ChevronRight, PanelCollapseIcon, PanelExpandIcon } from '@/app/components/Icons'

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
  
  if (isActive) {
    return `${baseClasses} text-btc font-semibold`
  }
  
  return size === 'sm'
    ? `${baseClasses} text-secondary hover:text-btc hover:underline`
    : `${baseClasses} text-gray-700 dark:text-gray-300 hover:text-btc hover:underline`
}

interface DocsNavigationProps {
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  onLinkClick?: () => void
}

export default function DocsNavigation({
  isSidebarCollapsed,
  onToggleSidebar,
  onLinkClick,
}: DocsNavigationProps) {
  const isSidebarNarrow = isSidebarCollapsed === true && onToggleSidebar != null
  const pathname = usePathname()

  const activeSection = useMemo(() => findActiveSectionHref(pathname), [pathname])

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    return activeSection ? new Set([activeSection]) : new Set()
  })

  const [isDocsExpanded, setIsDocsExpanded] = useState(true)

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

  const isActive = (href: string) => matchesPath(pathname, href)

  const toggleSection = (href: string) => {
    setExpandedSections(prev => toggleInSet(prev, href))
  }

  const isExpanded = (href: string) => expandedSections.has(href)

  // Collapsed sidebar: only expand button (desktop sidebar only)
  if (isSidebarNarrow && onToggleSidebar) {
    return (
      <nav className="w-full flex-shrink-0 sticky top-0">
        <button
          onClick={onToggleSidebar}
          className="btn-icon btn-icon-accent"
          aria-label="Expand navigation"
          title="Expand sidebar"
        >
          <PanelExpandIcon className="w-6 h-6 shrink-0" />
        </button>
      </nav>
    )
  }

  return (
    <nav className="w-full flex-shrink-0 sticky top-0 md:pr-8">
      <div className="min-w-56">
        {/* Collapse sidebar (desktop): at top of nav, reads as panel control */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="btn-icon btn-icon-accent"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelCollapseIcon className="w-6 h-6 shrink-0" />
          </button>
        )}

        <div className="mb-2">
          <ul className="space-y-1">
            {docsNavLinksTop.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={getLinkClassName(isActive(link.href))}
                  onClick={onLinkClick}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Docs link - navigates to /docs overview page */}
        <div className="mb-1">
          <div className="flex items-center gap-1.5 w-full text-left text-base mb-1">
            <button
              onClick={() => setIsDocsExpanded((v) => !v)}
              className="flex-shrink-0 p-1 pl-0 text-gray-500 dark:text-gray-400 hover:text-btc transition-colors"
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
              className={`flex-1 transition-colors ${
                isActive('/docs')
                  ? 'text-btc font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:text-btc'
              }`}
              onClick={onLinkClick}
            >
              Bitcoin Docs
            </Link>
          </div>
        </div>
        {isDocsExpanded && (
          <ul className="space-y-1">
            {navItems.map((item) => {
              const itemActive = isActive(item.href)
              const hasChildren = item.children && item.children.length > 0
              const expanded = isExpanded(item.href)

              return (
                <li key={item.href}>
                  <div className="flex items-center">
                    {hasChildren ? (
                      <button
                        onClick={() => toggleSection(item.href)}
                        className="mr-1 p-1 text-gray-500 hover:text-btc transition-colors"
                        aria-label={expanded ? 'Collapse section' : 'Expand section'}
                      >
                        <ChevronRight
                          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    ) : (
                      <span className="w-5 shrink-0" aria-hidden />
                    )}
                    <Link
                      href={item.href}
                      onClick={(_e) => {
                        if (hasChildren && !expanded) {
                          toggleSection(item.href)
                        }
                        onLinkClick?.()
                      }}
                      className={getLinkClassName(itemActive)}
                    >
                      {item.title}
                    </Link>
                  </div>
                  {hasChildren && expanded && (
                    <ul className="ml-7 mt-1 space-y-0">
                      {item.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={getLinkClassName(isActive(child.href), 'sm')}
                              onClick={onLinkClick}
                            >
                              {child.title}
                            </Link>
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
          <div className="flex items-center gap-1.5 w-full text-left text-base mb-1">
            <button
              onClick={() => toggleSection('/interactive-tools')}
              className="flex-shrink-0 p-1 pl-0 text-gray-500 dark:text-gray-400 hover:text-btc transition-colors"
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
              className={`flex-1 transition-colors ${
                isActive('/interactive-tools')
                  ? 'text-btc font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:text-btc'
              }`}
              onClick={onLinkClick}
            >
              Interactive Tools
            </Link>
          </div>
        </div>
        {isExpanded('/interactive-tools') && interactiveToolsNavItem.children && (
          <ul className="ml-7 mt-1 space-y-0 mb-2">
            {interactiveToolsNavItem.children.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={getLinkClassName(isActive(child.href), 'sm')}
                  onClick={onLinkClick}
                >
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2">
          <ul className="space-y-1">
            {docsNavLinksBottom.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={getLinkClassName(isActive(link.href))}
                  onClick={onLinkClick}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}

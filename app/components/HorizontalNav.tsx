'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { topLevelNavGroups, horizontalNavLinksBottom } from '@/app/utils/navigation'
import { toggleInSet } from '@/app/utils/setUtils'
import { ChevronBarCollapseIcon, ChevronBarExpandIcon, ChevronRight } from '@/app/components/Icons'
import { cn } from '@/app/utils/cn'

export default function HorizontalNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  /** Active when current path is this section or any child */
  const isSectionActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const isActive = (href: string) => pathname === href

  const toggleSection = (href: string) => {
    setExpandedSections((prev) => toggleInSet(prev, href))
  }

  const navGroups = topLevelNavGroups
  const sectionsWithChildren = navGroups.flatMap((g) =>
    g.items.filter((s) => s.children && s.children.length > 0)
  )
  const allExpandableHrefs = sectionsWithChildren.map((s) => s.href)
  const allExpanded = allExpandableHrefs.length > 0 && allExpandableHrefs.every((href) => expandedSections.has(href))
  const noneExpanded = expandedSections.size === 0

  return (
    <div className="border-y border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 shadow-lg">
      <div className="container-content">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group w-full py-6 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors rounded-md"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse navigation' : 'Expand navigation'}
        >
          <span className="text-2xl">Explore BitcoinDev</span>
          <span className="relative w-6 h-6 shrink-0">
            <ChevronBarCollapseIcon
              className={cn(
                'absolute inset-0 w-6 h-6 group-hover:text-accent transition-opacity duration-200',
                isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
              aria-hidden
            />
            <ChevronBarExpandIcon
              className={cn(
                'absolute inset-0 w-6 h-6 group-hover:text-accent transition-opacity duration-200',
                isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
              )}
              aria-hidden
            />
          </span>
        </button>
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'border-separator' : ''}`}
          style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
          aria-hidden={!isOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="py-6 space-y-8">
                {navGroups.map((group) => {
                  const isInteractiveTools = group.href === '/interactive-tools'
                  const toolsItem = isInteractiveTools ? group.items[0] : null
                  const showToolsDirectly =
                    isInteractiveTools && toolsItem?.children && toolsItem.children.length > 0

                  return (
                  <section key={group.href} aria-labelledby={`horizontal-nav-${group.href.slice(1).replace(/\//g, '-')}`}>
                    <h3
                      id={`horizontal-nav-${group.href.slice(1).replace(/\//g, '-')}`}
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3"
                    >
                      <Link href={group.href} className="hover:text-accent">
                        {group.title}
                      </Link>
                    </h3>
                    <ul
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3 list-none p-0 m-0"
                      aria-label={`${group.title} sections`}
                    >
                      {showToolsDirectly
                        ? toolsItem!.children!.map((child) => (
                            <li key={child.href} className="min-w-0">
                              <Link
                                href={child.href}
                                className={cn(
                                  'group flex items-center gap-2 w-full rounded-r-md border-l-4 border-transparent pl-2 pr-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500',
                                  isActive(child.href) && '!border-accent border-l-4 bg-accent/5 dark:bg-accent/10'
                                )}
                              >
                                <span
                                  className="flex-shrink-0 flex items-center justify-center p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 group-hover:text-accent transition-colors"
                                  aria-hidden
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                                <span
                                  className={cn(
                                    'text-sm truncate',
                                    isActive(child.href)
                                      ? 'text-accent font-semibold'
                                      : 'text-gray-700 dark:text-gray-300 group-hover:text-accent'
                                  )}
                                >
                                  {child.title}
                                </span>
                              </Link>
                            </li>
                          ))
                        : group.items.map((section) => {
                        const hasChildren = section.children && section.children.length > 0
                        const expanded = expandedSections.has(section.href)
                        const sectionActive = isSectionActive(section.href)
                        return (
                          <li key={section.href} className="min-w-0">
                            <div className="flex flex-col gap-0">
                              <div
                                className={cn(
                                  'group flex items-center gap-2 w-full rounded-r-md border-l-4 border-transparent pl-2 pr-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500',
                                  sectionActive && '!border-accent border-l-4 bg-accent/5 dark:bg-accent/10'
                                )}
                              >
                                {hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleSection(section.href)}
                                    className="nav-chevron-btn flex-shrink-0"
                                    aria-expanded={expanded}
                                    aria-label={expanded ? 'Collapse section' : 'Expand section'}
                                  >
                                    <ChevronRight
                                      className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-90')}
                                    />
                                  </button>
                                ) : (
                                  <span
                                    className="flex-shrink-0 flex items-center justify-center p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                                    aria-hidden
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                <Link
                                  href={section.href}
                                  className={cn(
                                    'text-sm truncate min-w-0',
                                    sectionActive
                                      ? 'text-accent font-semibold hover:no-underline'
                                      : 'text-gray-700 dark:text-gray-300 hover:text-accent'
                                  )}
                                >
                                  {section.title}
                                </Link>
                              </div>
                              {hasChildren && expanded && (
                                <ul
                                  className={cn(
                                    'ml-6 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-2 list-none',
                                    section.href === '/docs/glossary'
                                      ? 'flex flex-row flex-wrap gap-x-2 gap-y-1'
                                      : ''
                                  )}
                                >
                                  {section.children!.map((child) => (
                                    <li key={child.href}>
                                      <Link
                                        href={child.href}
                                        className={cn(
                                          'text-sm block py-0.5 leading-tight transition-colors truncate',
                                          isActive(child.href)
                                            ? 'text-accent font-semibold hover:no-underline'
                                            : 'text-secondary hover:text-accent'
                                        )}
                                      >
                                        {child.title}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                  )
                })}
              <div className="flex flex-row items-center justify-end gap-2 w-max ml-auto mb-1 pt-2">
                <button
                  type="button"
                  onClick={() => setExpandedSections(new Set(allExpandableHrefs))}
                  className={cn('nav-pill', allExpanded ? 'opacity-50 cursor-default' : '')}
                  aria-label="Expand all sections"
                  title="Expand all"
                  disabled={allExpanded}
                >
                  Expand all
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedSections(new Set())}
                  className={cn('nav-pill', noneExpanded ? 'opacity-50 cursor-default' : '')}
                  aria-label="Collapse all sections"
                  title="Collapse all"
                  disabled={noneExpanded}
                >
                  Collapse all
                </button>
              </div>
              <div className="border-separator pt-6">
                <div className="flex flex-wrap justify-center gap-4">
                  {horizontalNavLinksBottom.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="btn-secondary-sm min-w-[9rem] hover:no-underline"
                    >
                      {link.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

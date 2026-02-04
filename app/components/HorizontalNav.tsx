'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, horizontalNavLinksBottom } from '@/app/utils/navigation'
import { toggleInSet } from '@/app/utils/setUtils'
import { ChevronDown, ChevronRight } from '@/app/components/Icons'
import { cn } from '@/app/utils/cn'

/** Same bordered row design as DocsNavigation */
const CHILD_LIST_BORDER = 'border-l-2 border-gray-200 dark:border-gray-700 pl-2'
const navRowClass =
  'flex items-center gap-1.5 w-full rounded-r-md border-l-4 border-transparent pl-2 pr-2 py-1 transition-colors group/row hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
const navRowActiveClass = '!border-accent border-l-4 bg-accent/5 dark:bg-accent/10'
const navChevronClass =
  'flex-shrink-0 p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 transition-colors hover:border-accent hover:text-accent dark:hover:text-accent'

function getLinkClassName(isActive: boolean, size: 'default' | 'sm' = 'default'): string {
  const baseClasses = size === 'sm'
    ? 'block text-sm py-1 leading-tight transition-colors'
    : 'block py-1 leading-tight transition-colors'
  const hover = 'hover:text-accent dark:hover:text-accent hover:no-underline'

  if (isActive) {
    return `${baseClasses} text-accent font-semibold hover:no-underline`
  }

  return size === 'sm'
    ? `${baseClasses} text-secondary ${hover}`
    : `${baseClasses} text-gray-700 dark:text-gray-300 ${hover}`
}

export default function HorizontalNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  )

  /** Active only for exact path (highlight single current item, not parent nodes) */
  const isActive = (href: string) => pathname === href

  const toggleSection = (href: string) => {
    setExpandedSections(prev => toggleInSet(prev, href))
  }

  return (
    <div className="border-y border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
      <div className="container-content">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group w-full py-6 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors rounded-md"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse navigation' : 'Expand navigation'}
        >
          <span className="text-2xl">Explore BitcoinDev</span>
          <ChevronDown className={`w-6 h-6 shrink-0 transition-colors transition-transform group-hover:text-accent ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-row items-center justify-end gap-2 w-max ml-auto mb-3 mt-1">
              <button
                onClick={() => setExpandedSections(new Set(navItems.map(item => item.href)))}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-secondary hover:border-accent hover:text-accent dark:hover:text-accent transition-colors bg-gray-100 dark:bg-gray-800"
                aria-label="Expand all sections"
                title="Expand all"
              >
                Expand
              </button>
              <button
                onClick={() => setExpandedSections(new Set())}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-secondary hover:border-accent hover:text-accent dark:hover:text-accent transition-colors bg-gray-100 dark:bg-gray-800"
                aria-label="Collapse all sections"
                title="Collapse all"
              >
                Collapse
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-8 gap-y-4">
              {navItems.map((section) => {
                const hasChildren = section.children && section.children.length > 0
                const isExpanded = expandedSections.has(section.href)
                const sectionActive = isActive(section.href)

                return (
                  <div key={section.href} className="mb-2">
                    <div
                      className={cn(
                        navRowClass,
                        sectionActive && navRowActiveClass
                      )}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleSection(section.href)}
                          className={navChevronClass}
                          aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                        >
                          <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      ) : (
                        <span className="w-[22px] shrink-0" aria-hidden />
                      )}
                      <Link
                        href={section.href}
                        className={cn('flex-1 min-w-0', getLinkClassName(sectionActive))}
                      >
                        {section.title}
                      </Link>
                    </div>

                    {hasChildren && isExpanded && (
                      <ul className={cn('ml-6 mt-1 space-y-0', CHILD_LIST_BORDER)}>
                        {section.children!.map((child) => (
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
                              >
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
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
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
        )}
      </div>
    </div>
  )
}

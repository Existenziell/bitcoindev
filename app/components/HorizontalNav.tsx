'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems, horizontalNavLinksBottom } from '@/app/utils/navigation'
import { toggleInSet } from '@/app/utils/setUtils'
import { ChevronBarCollapseIcon, ChevronBarExpandIcon, ChevronRight } from '@/app/components/Icons'
import { cn } from '@/app/utils/cn'

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
            <div className="py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-8 gap-y-4">
                {navItems.map((section) => {
                  const hasChildren = section.children && section.children.length > 0
                  const isExpanded = expandedSections.has(section.href)
                  const sectionActive = isActive(section.href)

                  return (
                    <div key={section.href} className="mb-2">
                      <div
                        className={cn(
                          'nav-row',
                          sectionActive && 'nav-row-active'
                        )}
                      >
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleSection(section.href)}
                            className="nav-chevron-btn"
                            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                          >
                            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        ) : (
                          <span className="w-[22px] shrink-0" aria-hidden />
                        )}
                        <Link
                          href={section.href}
                          className={cn('flex-1 min-w-0 nav-link', sectionActive && 'nav-link-active')}
                        >
                          {section.title}
                        </Link>
                      </div>

                      {hasChildren && isExpanded && (
                        <ul
                          className={cn(
                            'ml-6 mt-1 nav-child-list-border',
                            section.href === '/docs/glossary'
                              ? 'flex flex-row flex-wrap gap-x-2 gap-y-1'
                              : 'space-y-0'
                          )}
                        >
                          {section.children!.map((child) => (
                            <li key={child.href}>
                              <div
                                className={cn(
                                  'nav-row py-0.5',
                                  isActive(child.href) && 'nav-row-active',
                                  section.href === '/docs/glossary' && 'w-auto'
                                )}
                              >
                                <Link
                                  href={child.href}
                                  className={cn('flex-1 min-w-0 nav-link-sm', isActive(child.href) && 'nav-link-active')}
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
              <div className="flex flex-row items-center justify-end gap-2 w-max ml-auto mb-1 pt-2">
                <button
                  onClick={() => setExpandedSections(new Set(navItems.map(item => item.href)))}
                  className={cn("nav-pill", expandedSections.size === navItems.length ? 'opacity-50 cursor-default' : '')}
                  aria-label="Expand all sections"
                  title="Expand all"
                  disabled={expandedSections.size === navItems.length}
                >
                  Expand all
                </button>
                <button
                  onClick={() => setExpandedSections(new Set())}
                  className={cn("nav-pill", expandedSections.size === 0 ? 'opacity-50 cursor-default' : '')}
                  aria-label="Collapse all sections"
                  title="Collapse all"
                  disabled={expandedSections.size === 0}
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

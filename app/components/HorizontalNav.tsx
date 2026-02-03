'use client'

import { useState } from 'react'
import Link from 'next/link'
import { navItems, horizontalNavLinksBottom } from '@/app/utils/navigation'
import { toggleInSet } from '@/app/utils/setUtils'
import { ChevronDown, ChevronRight } from '@/app/components/Icons'

export default function HorizontalNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  )

  const toggleSection = (href: string) => {
    setExpandedSections(prev => toggleInSet(prev, href))
  }

  return (
    <div className="border-y border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
      <div className="container-content">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-6 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-btc transition-colors"
        >
          <span className="text-2xl">Explore BitcoinDev</span>
          <ChevronDown className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Tree Navigation */}
        {isOpen && (
          <div className="pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-row items-center justify-end gap-2 w-max ml-auto mb-3 mt-1">
              <button
                onClick={() => setExpandedSections(new Set(navItems.map(item => item.href)))}
                className="px-1.5 py-0.5 text-secondary text-xs rounded-md hover:text-btc transition-colors bg-gray-200 dark:bg-gray-700"
                aria-label="Expand all sections"
                title="Expand all"
              >
                <span>Expand</span>
              </button>
              <button
                onClick={() => setExpandedSections(new Set())}
                className="px-1.5 py-0.5 text-secondary text-xs rounded-md hover:text-btc transition-colors bg-gray-200 dark:bg-gray-700"
                aria-label="Collapse all sections"
                title="Collapse all"
              >
                <span>Collapse</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-8 gap-y-4">
              {navItems.map((section) => {
                const hasChildren = section.children && section.children.length > 0
                const isExpanded = expandedSections.has(section.href)

                return (
                  <div key={section.href} className="mb-2">
                    {/* Section Header */}
                    <div className="flex items-center">
                      {hasChildren && (
                        <button
                          onClick={() => toggleSection(section.href)}
                          className="mr-1 p-1 text-gray-500 hover:text-btc transition-colors"
                          aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                        >
                          <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                      {!hasChildren && <span className="w-5" />}
                      <Link
                        href={section.href}
                        className="font-medium text-gray-800 dark:text-gray-200 hover:text-btc transition-colors"
                      >
                        {section.title}
                      </Link>
                    </div>

                    {/* Children */}
                    {hasChildren && isExpanded && (
                      <ul className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                        {section.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="text-sm text-secondary hover:text-btc transition-colors"
                            >
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Quick Links Section - Prominent at the bottom */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap justify-center gap-4">
                {horizontalNavLinksBottom.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="btn-secondary-sm min-w-[9rem]"
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

'use client'

import { useState } from 'react'
import DocsNavigation from '@/app/components/DocsNavigation'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-nav-button"
        aria-label="Toggle navigation menu"
      >
        <span className="font-semibold">Navigation</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-[70vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
          <DocsNavigation onLinkClick={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}

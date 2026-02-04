'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDocNavigation } from '@/app/hooks/useDocNavigation'
import { ChevronLeft, ChevronRight, ChevronUp } from '@/app/components/Icons'

export default function PageNavigation() {
  const pathname = usePathname()
  const { previousPage, nextPage } = useDocNavigation()
  const isGlossaryPage = pathname === '/docs/glossary'

  if (isGlossaryPage) {
    return (
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-center">
        <span
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="cursor-pointer inline-flex items-center justify-center gap-2 text-btc transition-all"
        >
          <ChevronUp className="w-8 h-8 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" />
        </span>
      </div>
    )
  }

  if (!previousPage && !nextPage) {
    return null
  }

  return (
    <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div className="flex-1">
        {previousPage ? (
          <Link
            href={previousPage.href}
            className="inline-flex items-center gap-2 text-btc transition-all group no-underline hover:no-underline"
          >
            <ChevronLeft className="w-8 h-8 rounded group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors" />
            <span className="hidden md:inline">{previousPage.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </div>

      <div className="flex-1 flex justify-center">
        <span
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="cursor-pointer inline-flex items-center justify-center gap-2 text-btc transition-all"
        >
          <ChevronUp className="w-8 h-8 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" />
        </span>
      </div>

      <div className="flex-1 flex justify-end">
        {nextPage ? (
          <Link
            href={nextPage.href}
            className="inline-flex items-center gap-2 text-btc transition-all group no-underline hover:no-underline"
          >
            <span className="hidden md:inline">{nextPage.title}</span>
            <ChevronRight className="w-8 h-8 rounded group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}

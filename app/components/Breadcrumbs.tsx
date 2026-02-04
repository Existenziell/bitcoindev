'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useDocNavigation } from '@/app/hooks/useDocNavigation'

interface BreadcrumbsProps {
  isSticky?: boolean
}

export default function Breadcrumbs({ isSticky = false }: BreadcrumbsProps) {
  const { pathname, breadcrumbs } = useDocNavigation()

  // Don't show breadcrumbs on homepage
  if (pathname === '/') {
    return null
  }

  // Check if first breadcrumb is "Home"
  const firstCrumb = breadcrumbs[0]
  const showLogoInsteadOfHome = isSticky && firstCrumb?.label === 'Home'

  return (
    <nav className="py-1 min-h-[42px] flex items-center overflow-hidden" aria-label="Breadcrumb">
      <ol className="flex items-center md:flex-wrap flex-nowrap space-x-2 text-xs sm:text-sm text-secondary overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {breadcrumbs.map((crumb, index) => {
          const isFirst = index === 0
          const isLast = index === breadcrumbs.length - 1
          const _shouldShowLogo = isFirst && showLogoInsteadOfHome

          return (
            <li key={crumb.href} className={`flex items-center flex-shrink-0 ${isFirst ? 'h-[42px] relative' : ''}`}>
              {index > 0 && (
                <span className="mr-1 text-gray-500 dark:text-gray-400 flex-shrink-0">/</span>
              )}
              {isFirst && firstCrumb?.label === 'Home' ? (
                <>
                  <Link
                    href={firstCrumb.href}
                    className={`hidden md:flex items-center justify-center h-[42px] hover:opacity-80 transition-all duration-200 absolute ${
                      showLogoInsteadOfHome 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                    aria-label="BitcoinDev Home"
                  >
                    <Image
                      src="/icons/logo/logo.png"
                      alt="BitcoinDev Logo"
                      width={42}
                      height={42}
                      className="opacity-80 dark:invert"
                    />
                  </Link>
                  <Link
                    href={firstCrumb.href}
                    className={`md:hidden flex items-center justify-center h-[42px] hover:opacity-80 transition-all duration-200 absolute ${
                      showLogoInsteadOfHome 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                    aria-label="BitcoinDev Home"
                  >
                    <Image
                      src="/icons/logo/logo.png"
                      alt="BitcoinDev Logo"
                      width={42}
                      height={42}
                      className="opacity-80 dark:invert"
                    />
                  </Link>
                  <Link
                    href={firstCrumb.href}
                    className={`md:hidden flex items-center h-[42px] hover:text-accent hover:underline transition-all duration-200 text-gray-700 dark:text-gray-400 ${
                      showLogoInsteadOfHome ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                    }`}
                  >
                    {firstCrumb.label}
                  </Link>
                  <Link
                    href={firstCrumb.href}
                    className={`hidden md:flex items-center h-[42px] hover:text-accent hover:underline transition-all duration-200 text-gray-700 dark:text-gray-400 ${
                      showLogoInsteadOfHome 
                        ? 'opacity-0 scale-95 pointer-events-none' 
                        : 'opacity-100 scale-100'
                    }`}
                  >
                    {firstCrumb.label}
                  </Link>
                </>
              ) : isLast ? (
                <span className="text-gray-800 dark:text-gray-300 whitespace-nowrap max-w-[200px] md:max-w-none truncate" aria-current="page">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-accent hover:underline transition-colors text-gray-700 dark:text-gray-400 whitespace-nowrap max-w-[150px] md:max-w-none truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/app/components/ThemeToggle'
import { SearchIcon } from '@/app/components/Icons'
import { useStickyScroll } from '@/app/contexts/StickyScrollContext'
import { useSearch } from '@/app/contexts/SearchContext'

const siteTitleClassName =
  'font-extrabold embossed text-6xl pl-6 hidden lg:block'

export default function Header() {
  const pathname = usePathname()
  const { isSticky, headerRef } = useStickyScroll()
  const { openSearch } = useSearch()
  const showSearchInHeader = !isSticky
  const isHomePage = pathname === '/'

  return (
    <>
      <header ref={headerRef} className="page-bg relative">
        <div className="container-content">
          <div className="flex justify-between items-center relative">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 w-[100px] h-[100px] relative" aria-label="BitcoinDev Home">
              <Image
                src="/icons/logo/logo.png"
                alt="BitcoinDev Logo"
                fill
                sizes="100px"
                className="opacity-75 dark:invert hover:opacity-100 transition-opacity duration-200 object-contain"
              />
            </Link>
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
              {isHomePage ? (
                <h1 className={siteTitleClassName} aria-label="BitcoinDev">BitcoinDev</h1>
              ) : (
                <span className={siteTitleClassName} aria-label="BitcoinDev">BitcoinDev</span>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-1">
                <div 
                  className={`transition-all duration-200 will-change-transform ${
                    showSearchInHeader 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 translate-x-2 pointer-events-none'
                  }`}
                >
                  <button
                    type="button"
                    onClick={openSearch}
                    className="btn-icon"
                    aria-label="Search (⌘K)"
                    title="Search (⌘K)"
                  >
                    <SearchIcon className="w-5 h-5" />
                  </button>
                </div>
                <ThemeToggle />
              </div>
          </div>
        </div>
      </header>
    </>
  )
}

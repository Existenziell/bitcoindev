'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/utils/cn'
import DocsNavigation from '@/app/components/DocsNavigation'
import MobileNav from '@/app/components/MobileNav'
import PageNavigation from '@/app/components/PageNavigation'
import Footer from '@/app/components/Footer'
import FeedbackLink from '@/app/components/FeedbackLink'

interface LayoutWrapperProps {
  children: ReactNode
  showPageNavigation?: boolean
  isNavCollapsed?: boolean
}

/**
 * Layout wrapper for /docs, /philosophy, /whitepaper, /interactive-tools/*, /about, etc.
 * Header is in the root layout so it stays mounted across navigations (no logo flicker).
 */
export default function LayoutWrapper({
  children,
  showPageNavigation = false,
  isNavCollapsed = false,
}: LayoutWrapperProps) {
  const [isNavCollapsedState, setIsNavCollapsedState] = useState(isNavCollapsed)
  const pathname = usePathname()

  // Sync local state when isNavCollapsed prop changes (e.g. on navigation to/from interactive tools)
  useEffect(() => {
    setIsNavCollapsedState(isNavCollapsed)
  }, [isNavCollapsed])

  // Show feedback link on documentation and philosophy pages, excluding glossary and top-level index pages
  const shouldShowFeedbackLink =
    (pathname.startsWith('/docs') && pathname !== '/docs/glossary') ||
    pathname.startsWith('/philosophy/')

  // Automatically collapse sidebar on screens smaller than lg (1024px) when resizing
  // Apply on /docs and /philosophy to avoid conflicting with isNavCollapsed on other pages
  // Never expands automatically, only collapses on resize
  useEffect(() => {
    const isDocsOrPhilosophy =
      pathname.startsWith('/docs') || pathname.startsWith('/philosophy')
    if (!isDocsOrPhilosophy) {
      return
    }

    const handleResize = () => {
      // Only collapse if window is small, never expand automatically
      if (window.innerWidth < 1024) {
        setIsNavCollapsedState(true)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [pathname])

  return (
    <main className="flex-1 page-bg flex flex-col">
      {shouldShowFeedbackLink && <FeedbackLink />}
      <div className="container-content py-4 md:py-8 flex-grow">
        <div className="flex flex-col md:flex-row gap-4 md:gap-0">
          <div
            className={cn(
              'hidden md:block md:flex-shrink-0 md:overflow-y-auto md:overflow-x-hidden md:mr-8 transition-[width] duration-200 ease-in-out',
              isNavCollapsedState ? 'md:w-10 md:self-start' : 'md:w-72 md:self-start'
            )}
          >
            <DocsNavigation
              isNavCollapsed={isNavCollapsedState}
              onToggleNav={() => setIsNavCollapsedState((v) => !v)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <MobileNav />
            <div
              className={cn(
                'mx-auto w-full transition-[max-width] duration-200 ease-in-out',
                isNavCollapsedState ? 'max-w-6xl' : 'max-w-4xl'
              )}
            >
              {children}
            </div>
            {showPageNavigation && <PageNavigation />}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

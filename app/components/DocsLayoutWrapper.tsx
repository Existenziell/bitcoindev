'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import DocsNavigation from '@/app/components/DocsNavigation'
import MobileNav from '@/app/components/MobileNav'
import PageNavigation from '@/app/components/PageNavigation'
import Footer from '@/app/components/Footer'
import FeedbackLink from '@/app/components/FeedbackLink'

interface DocsLayoutWrapperProps {
  children: ReactNode
  showPageNavigation?: boolean
  /** Sidebar starts collapsed on Terminal, Stack Lab, Whitepaper, About. Default false (expanded). */
  defaultSidebarCollapsed?: boolean
}

/**
 * Layout wrapper for /docs, /whitepaper, /terminal, /about, /stack-lab.
 * Header is in the root layout so it stays mounted across navigations (no logo flicker).
 */
export default function DocsLayoutWrapper({
  children,
  showPageNavigation = false,
  defaultSidebarCollapsed = false,
}: DocsLayoutWrapperProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(defaultSidebarCollapsed)
  const pathname = usePathname()

  // Show feedback link only on documentation pages, excluding glossary
  const shouldShowFeedbackLink = 
    pathname.startsWith('/docs') && pathname !== '/docs/glossary'

  // Automatically collapse sidebar on screens smaller than lg (1024px) when resizing
  // Only run this on /docs routes to avoid conflicting with defaultSidebarCollapsed on other pages
  // Never expands automatically, only collapses on resize
  useEffect(() => {
    // Only apply auto-collapse behavior on /docs routes
    if (!pathname.startsWith('/docs')) {
      return
    }

    const handleResize = () => {
      // Only collapse if window is small, never expand automatically
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true)
      }
    }

    // Listen for resize events only
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [pathname])

  return (
    <main className="flex-1 page-bg flex flex-col">
      {shouldShowFeedbackLink && <FeedbackLink />}
      <div className="container-content py-4 md:py-8 flex-grow">
        <div className="flex flex-col md:flex-row gap-4 md:gap-0">
          <div
            className={`hidden md:block md:flex-shrink-0 md:self-start md:overflow-y-auto md:overflow-x-hidden transition-[width] duration-200 ease-in-out ${isSidebarCollapsed ? 'md:w-12' : 'md:w-64'}`}
          >
            <DocsNavigation
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed((v) => !v)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <MobileNav />
            <div
              className={`mx-auto w-full transition-[max-width] duration-200 ease-in-out ${isSidebarCollapsed ? 'max-w-6xl' : 'max-w-4xl'}`}
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

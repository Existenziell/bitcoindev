'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FeedbackLink() {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()

  // Don't show on top-level /docs page
  const isTopLevelDocs = pathname === '/docs'

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollPercentage = (scrollTop + windowHeight) / documentHeight

      // Show when user has scrolled to 3/4 (75%) of the page
      setIsVisible(scrollPercentage >= 0.75)
    }

    window.addEventListener('scroll', handleScroll)
    // Check initial position
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div 
      className={`fixed right-0 top-3/4 z-50 transition-all duration-300 ${
        isVisible && !isTopLevelDocs
          ? 'translate-x-1/3 opacity-100 pointer-events-auto' 
          : 'translate-x-full opacity-0 pointer-events-none'
      }`}
    >
      <Link
        href="/feedback"
        className="block bg-accent text-gray-900 hover:bg-accent/90 transition-all hover:no-underline shadow-lg rounded-b-md rotate-90 py-4 px-6 hover:-ml-[20px]"
        aria-label="Feedback"
      >
        Feedback
      </Link>
    </div>
  )
}

'use client'

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import Link from 'next/link'

interface GlossaryEntry {
  term: string
  definition: string
}

interface GlossaryTooltipProps {
  href: string
  children: React.ReactNode
  glossaryData: Record<string, GlossaryEntry>
  glossaryLoading?: boolean
}

interface TooltipCoords {
  left: number
  bottom?: number
  top?: number
}

export default function GlossaryTooltip({ href, children, glossaryData, glossaryLoading = false }: GlossaryTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const [tooltipCoords, setTooltipCoords] = useState<TooltipCoords | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Extract the term slug from the href (e.g., /docs/glossary#transaction -> transaction)
  const slug = href.split('#')[1] || ''
  const entry = glossaryData[slug]

  // Detect touch/coarse pointer (mobile) so we show tooltip on click instead of navigating
  useEffect(() => {
    const mq = window.matchMedia('(hover: none)')
    const setTouch = () => setIsTouchDevice(mq.matches)
    setTouch()
    mq.addEventListener('change', setTouch)
    return () => mq.removeEventListener('change', setTouch)
  }, [])

  // On mobile: close tooltip when clicking outside
  useEffect(() => {
    if (!isTouchDevice || !isVisible) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        linkRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return
      }
      setIsVisible(false)
    }
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [isTouchDevice, isVisible])

  // Measure link position and decide top/bottom when tooltip becomes visible (no refs during render)
  useLayoutEffect(() => {
    if (!isVisible || !linkRef.current) {
      queueMicrotask(() => setTooltipCoords(null))
      return
    }
    const rect = linkRef.current.getBoundingClientRect()
    const spaceAbove = rect.top
    const tooltipHeight = 150 // Approximate max tooltip height
    const placeBottom = spaceAbove < tooltipHeight + 20
    queueMicrotask(() => {
      setPosition(placeBottom ? 'bottom' : 'top')
      setTooltipCoords({
        left: rect.left + rect.width / 2,
        ...(placeBottom
          ? { top: rect.bottom + 8 }
          : { bottom: window.innerHeight - rect.top + 8 }),
      })
    })
  }, [isVisible])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, 200) // Small delay to prevent accidental triggers
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 100)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!shouldShowTooltip || !isTouchDevice) return
    e.preventDefault()
    setIsVisible((v) => !v)
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const shouldShowTooltip = Boolean(entry) || glossaryLoading

  return (
    <span className="relative inline">
      <Link
        ref={linkRef}
        href={href}
        className="glossary-link"
        onMouseEnter={shouldShowTooltip && !isTouchDevice ? handleMouseEnter : undefined}
        onMouseLeave={shouldShowTooltip && !isTouchDevice ? handleMouseLeave : undefined}
        onFocus={shouldShowTooltip && !isTouchDevice ? handleMouseEnter : undefined}
        onBlur={shouldShowTooltip && !isTouchDevice ? handleMouseLeave : undefined}
        onClick={handleClick}
        aria-describedby={shouldShowTooltip && isVisible ? `glossary-tooltip-${slug}` : undefined}
      >
        {children}
      </Link>

      {shouldShowTooltip && isVisible && (
        <span
          ref={tooltipRef}
          id={`glossary-tooltip-${slug}`}
          role="tooltip"
          className={`
            block fixed z-[9999] w-64 sm:w-72 p-4 pt-2
            bg-gray-100 dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            rounded-md shadow-lg
            text-xs text-secondary font-normal
            transition-opacity duration-150
          `}
          style={{
            left: tooltipCoords?.left ?? 0,
            transform: 'translateX(-50%)',
            ...(tooltipCoords && (tooltipCoords.bottom !== undefined ? { bottom: tooltipCoords.bottom } : { top: tooltipCoords.top })),
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Arrow */}
          <span
            className={`
              block absolute left-1/2 -translateX-1/2 w-2.5 h-2.5
              bg-gray-100 dark:bg-gray-800
              border-gray-300 dark:border-gray-600
              transform rotate-45
              ${position === 'top'
                ? 'bottom-[-6px] border-r border-b'
                : 'top-[-6px] border-l border-t'
              }
            `}
          />

          {/* Content */}
          <span className="relative block font-normal">
            {entry ? (
              <>
                <span className="block font-medium text-btc mb-1 text-base">
                  {entry.term}
                </span>
                <span className="block text-sm font-normal" style={{ lineHeight: 1.4 }}>
                  {entry.definition}
                  {entry.definition.endsWith('...') && (
                    <Link
                      href={href}
                      className="ml-1 text-btc hover:underline font-medium"
                      onClick={() => {
                        // Close tooltip when clicking "more"
                        setIsVisible(false)
                      }}
                      onMouseDown={(e) => {
                        // Prevent tooltip from closing on mousedown
                        e.stopPropagation()
                      }}
                    >
                      more
                    </Link>
                  )}
                </span>
              </>
            ) : (
              <>
                <span className="block font-medium text-btc mb-1 text-base">Loading…</span>
                <span className="block text-sm font-normal" style={{ lineHeight: 1.4 }}>
                  Fetching glossary definition.
                </span>
              </>
            )}
          </span>
        </span>
      )}
    </span>
  )
}

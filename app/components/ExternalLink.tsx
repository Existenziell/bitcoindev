'use client'

import type { ReactNode } from 'react'
import { ExternalLinkIcon } from '@/app/components/Icons'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  className?: string
  /** Optional class for the icon wrapper span (default ml-0.5; use mt-0.5 for icon below). */
  iconClassName?: string
  'aria-label'?: string
}

/**
 * External link with icon shown on hover. Use for target="_blank" links.
 * Icon uses fixed space and opacity transition only to avoid layout shift / flicker.
 */
export default function ExternalLink({ href, children, className = '', iconClassName = 'ml-0.5', 'aria-label': ariaLabel }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {children}
      <span className={`inline-flex w-3 shrink-0 justify-center ${iconClassName}`}>
        <ExternalLinkIcon className="opacity-0 group-hover:opacity-70 transition-opacity duration-200" />
      </span>
    </a>
  )
}

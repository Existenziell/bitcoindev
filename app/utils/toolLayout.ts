import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SITE_URL } from '@/app/utils/constants'

export interface ToolLayoutOptions {
  title: string
  description: string
  path: string
}

/**
 * Shared metadata and layout for interactive tool pages.
 * Use in each tool's layout.tsx to avoid repeating the same structure.
 */
export function createToolLayout({ title, description, path }: ToolLayoutOptions) {
  const canonical = `${SITE_URL}/interactive-tools/${path}`
  const metadata: Metadata = {
    title: `${title} | BitcoinDev`,
    description,
    alternates: { canonical },
  }
  function ToolLayout({ children }: { children: ReactNode }) {
    return children
  }
  return { metadata, ToolLayout }
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'

export const metadata: Metadata = generatePageMetadata({
  title: 'Bitcoin CLI Terminal',
  description: 'Interactive Bitcoin CLI terminal for executing RPC commands on the Bitcoin network',
  path: '/interactive-tools/terminal',
})

export default function TerminalLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <DocsLayoutWrapper defaultSidebarCollapsed>
      {children}
    </DocsLayoutWrapper>
  )
}

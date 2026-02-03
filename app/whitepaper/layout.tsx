import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'

export const metadata: Metadata = generatePageMetadata({
  title: 'Bitcoin Whitepaper',
  description: 'Bitcoin: A Peer-to-Peer Electronic Cash System by Satoshi Nakamoto',
  path: '/whitepaper',
})

export default function WhitepaperLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <DocsLayoutWrapper>
      {children}
    </DocsLayoutWrapper>
  )
}

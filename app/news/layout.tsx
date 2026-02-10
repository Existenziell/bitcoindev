import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'

export const metadata: Metadata = generatePageMetadata({
  title: 'Bitcoin News',
  description:
    'Curated Bitcoin news and official announcements from multiple reputable sources.',
  path: '/news',
})

export default function NewsLayout({
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


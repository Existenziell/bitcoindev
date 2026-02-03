import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'

export const metadata: Metadata = generatePageMetadata({
  title: 'Feedback',
  description: 'Leave feedback for BitcoinDev. Help us improve.',
  path: '/feedback',
})

export default function FeedbackLayout({
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

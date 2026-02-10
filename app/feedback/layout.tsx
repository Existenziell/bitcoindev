import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'
import LayoutWrapper from '@/app/components/LayoutWrapper'

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
    <LayoutWrapper>
      {children}
    </LayoutWrapper>
  )
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'
import LayoutWrapper from '@/app/components/LayoutWrapper'

export const metadata: Metadata = generatePageMetadata({
  title: 'Privacy Policy',
  description:
    'What data BitcoinDev collects, what we use it for, and our commitment to minimal, privacy-respecting analytics.',
  path: '/privacy',
})

export default function PrivacyLayout({
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

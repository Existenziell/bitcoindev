import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'

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
    <DocsLayoutWrapper>
      {children}
    </DocsLayoutWrapper>
  )
}

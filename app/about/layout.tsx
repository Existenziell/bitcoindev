import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'
import LayoutWrapper from '@/app/components/LayoutWrapper'

export const metadata: Metadata = generatePageMetadata({
  title: 'About BitcoinDev',
  description:
    'Giving back to the Bitcoin community 💛',
  path: '/about',
})

export default function AboutLayout({
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

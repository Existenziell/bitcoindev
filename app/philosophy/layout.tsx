import type { ReactNode } from 'react'
import LayoutWrapper from '@/app/components/LayoutWrapper'

export default function PhilosophyLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <LayoutWrapper showPageNavigation>
      {children}
    </LayoutWrapper>
  )
}

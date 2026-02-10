'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import LayoutWrapper from '@/app/components/LayoutWrapper'

const COLLAPSED_NAV_PATHS = [
  '/interactive-tools/terminal',
  '/interactive-tools/stack-lab',
  '/interactive-tools/block-visualizer',
]

export default function InteractiveToolsLayoutClient({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const isNavCollapsed = COLLAPSED_NAV_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  return (
    <LayoutWrapper isNavCollapsed={isNavCollapsed}>
      {children}
    </LayoutWrapper>
  )
}

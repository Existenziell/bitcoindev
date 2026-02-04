import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { generatePageMetadata } from '@/app/utils/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Stack Lab',
  description: 'Interactive Bitcoin Script playground with drag-and-drop OP codes and real-time stack visualization',
  path: '/interactive-tools/stack-lab',
})

export default function StackLabLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}

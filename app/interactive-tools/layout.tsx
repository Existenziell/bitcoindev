import type { ReactNode } from 'react'
import InteractiveToolsLayoutClient from '@/app/interactive-tools/InteractiveToolsLayoutClient'

export default function InteractiveToolsLayout({
  children,
}: {
  children: ReactNode
}) {
  return <InteractiveToolsLayoutClient>{children}</InteractiveToolsLayoutClient>
}

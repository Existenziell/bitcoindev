'use client'

import { cn } from '@/app/utils/cn'

interface StackLabCardProps {
  children: React.ReactNode
  className?: string
  /** If true, adds flex flex-col and h-full for scrollable content areas. */
  flex?: boolean
}

export default function StackLabCard({ children, className, flex = false }: StackLabCardProps) {
  return (
    <div
      className={cn(
        'panel-card',
        flex && 'h-full flex flex-col',
        className
      )}
    >
      {children}
    </div>
  )
}

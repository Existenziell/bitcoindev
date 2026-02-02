'use client'

import { InfoIcon } from '@/app/components/Icons'

interface InfoTooltipProps {
  content: React.ReactNode
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <div className="group relative">
      <InfoIcon className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-help" />
      <div className="info-tooltip">
        {content}
      </div>
    </div>
  )
}

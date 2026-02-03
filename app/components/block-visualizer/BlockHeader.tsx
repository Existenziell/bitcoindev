'use client'

import { formatNumber } from '@/app/utils/formatting'
import { formatBlockSize } from '@/app/utils/blockUtils'

interface BlockHeaderProps {
  height: number
  txCount: number
  size: number
}

const statRow = (
  label: string,
  value: string | number,
) => ({ label, value })

export default function BlockHeader({
  height,
  txCount,
  size,
}: BlockHeaderProps) {
  const stats = [
    statRow('Block height', formatNumber(height)),
    statRow('Transactions', formatNumber(txCount)),
    statRow('Block size', formatBlockSize(size)),
  ]

  return (
    <div
      className="
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        shadow-sm rounded-lg
        px-4 py-3
        w-full min-w-0
      "
    >
      <dl className="grid grid-cols-3 lg:grid-cols-1 gap-x-4 gap-y-3 lg:gap-y-2.5">
        {stats.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-secondary text-xs font-medium truncate">
              {label}
            </dt>
            <dd className="text-gray-800 dark:text-gray-200 font-semibold text-sm truncate">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

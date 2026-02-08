'use client'

import { useState, useCallback } from 'react'
import { UNITS, toSats, fromSats, formatForUnit } from '@/app/utils/denominationUtils'
import { cn } from '@/app/utils/cn'

export default function DenominationCalculator() {
  const [value, setValue] = useState('')
  const [fromUnit, setFromUnit] = useState('btc')

  const sats = useCallback(() => toSats(value, fromUnit), [value, fromUnit])

  const results = (() => {
    const s = sats()
    if (s === null) return null
    return UNITS.map((u) =>
      u.id === fromUnit
        ? { type: 'separator' as const }
        : {
            type: 'result' as const,
            id: u.id,
            label: u.label,
            name: u.name,
            formatted: formatForUnit(fromSats(s, u.id), u.id),
          }
    )
  })()

  return (
    <div className="my-6">
      <div className="panel-card">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="denom-input" className="sr-only">
            Amount
          </label>
          <input
            id="denom-input"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter amount"
            className={cn('input-panel-ring-input', 'min-w-[10rem]')}
            aria-label="Amount to convert"
          />
          <label htmlFor="denom-unit" className="sr-only">
            From unit
          </label>
          <select
            id="denom-unit"
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className={cn('input-panel-ring-input', 'min-w-[8rem]')}
            aria-label="Unit to convert from"
          >
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} ({u.name})
              </option>
            ))}
          </select>
        </div>
        <div className={cn('flex flex-col gap-y-2 text-sm', results && 'mt-4')}>
            {results && results.map((item) =>  
              item.type === 'separator' ? (
                <div
                  key={`sep-${fromUnit}`}
                  className="border-t border-dotted border-gray-400 dark:border-gray-500 my-0.5"
                  aria-hidden="true"
                />
              ) : (
                <div key={item.id} className="flex justify-between gap-4">
                  <span className="text-secondary">{item.label} ({item.name})</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200 tabular-nums">{item.formatted}</span>
                </div>
              )
            )}
        </div>
      </div>
    </div>
  )
}

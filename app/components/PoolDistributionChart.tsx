'use client'

import { useState, useEffect } from 'react'
import poolsData from '@/public/data/pools.json'
import ExternalLink from './ExternalLink';

const DISPLAY_NAME_MAP: Record<string, string> = {}
;(poolsData as { pools: Array<{ identifier: string; name: string }> }).pools.forEach((p) => {
  DISPLAY_NAME_MAP[p.identifier] = p.name
})
DISPLAY_NAME_MAP['others'] = 'Others'

/** Pools below this share are aggregated into a single "Others" row. */
const AGGREGATE_BELOW_PCT = 3

function getDisplayName(identifier: string): string {
  return DISPLAY_NAME_MAP[identifier] ?? identifier
}

const CBECI_MINING_MAP_URL = 'https://ccaf.io/cbnsi/cbeci/mining_map'

export default function PoolDistributionChart() {
  const [distribution, setDistribution] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/pool-distribution')
      .then((res) => res.json())
      .then((data: Record<string, number>) => {
        if (cancelled) return
        setDistribution(
          typeof data === 'object' && data !== null && !Array.isArray(data) ? data : {}
        )
        setError(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setDistribution({})
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="content-box my-4 min-h-[200px] flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">Loading pool distribution…</span>
      </div>
    )
  }

  if (error || !distribution || Object.keys(distribution).length === 0) {
    return (
      <div className="content-box my-4">
        <p className="text-gray-500 dark:text-gray-400">Pool distribution unavailable.</p>
      </div>
    )
  }

  const sorted = Object.entries(distribution)
    .map(([id, pct]) => ({ id, name: getDisplayName(id), pct }))
    .sort((a, b) => b.pct - a.pct)

  const aboveThreshold = sorted.filter((e) => e.pct >= AGGREGATE_BELOW_PCT)
  const belowThreshold = sorted.filter((e) => e.pct < AGGREGATE_BELOW_PCT)
  const othersPct =
    belowThreshold.length > 0
      ? Math.round(belowThreshold.reduce((sum, e) => sum + e.pct, 0) * 10) / 10
      : 0
  const displayEntries =
    othersPct > 0 ? [...aboveThreshold, { id: 'others-aggregate', name: `Others (< ${AGGREGATE_BELOW_PCT}%)`, pct: othersPct }] : aboveThreshold
  const maxPct = Math.max(...displayEntries.map((e) => e.pct), 1)

  return (
    <>
      <p className="text-sm font-semibold !mb-0">Pool distribution:</p>
      <div className="content-box mb-1">
        <div className="space-y-2" role="list" aria-label="Pool hashrate distribution">
          {displayEntries.map(({ id, name, pct }) => (
            <div key={id} className="flex items-center gap-3 text-sm" role="listitem">
              <span className="w-32 shrink-0 text-gray-700 dark:text-gray-300">{name}</span>
              <div className="flex-1 min-w-0 h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-accent rounded"
                  style={{ width: `${(pct / maxPct) * 100}%` }}
                  aria-hidden
                />
              </div>
              <span className="w-14 shrink-0 text-right tabular-nums text-gray-700 dark:text-gray-300">
                {pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 italic">
        Distribution for last 1000 blocks, updated every 6 hours.
      </p>
      <p className="text-gray-700 dark:text-gray-300 my-6">
        The chart above shows which pools found blocks. The chart below shows where hashrate is physically located (by
        country or region). This is a different metric, estimated from geolocation data such as pool
        operator IPs, not from the blockchain.
      </p>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold !mb-0">Hashrate by location (estimated):</p>
        <ExternalLink
          href={CBECI_MINING_MAP_URL}
          className="link-muted text-sm"
        >
          Open in new tab
        </ExternalLink>
      </div>
      <div className="content-box mb-2 overflow-hidden rounded">
        <iframe
          src={CBECI_MINING_MAP_URL}
          title="Cambridge Bitcoin Mining Map"
          className="w-full min-h-[500px] border-0"
        />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 italic">
        Data from Cambridge Centre for Alternative Finance.
      </p>
    </>
  )
}

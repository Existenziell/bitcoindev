'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  BlockSnapshot,
  formatBlockSize,
  formatBlockWeight,
  truncateHash,
} from '@/app/utils/blockUtils'
import { formatNumber, formatPrice } from '@/app/utils/formatting'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ExternalLinkIcon } from '@/app/components/Icons'
import poolsData from '@/public/data/pools.json'

const BLOCK_LIST_LIMIT = 20

/** Build identifier -> icon filename map from pools.json. */
const POOL_ICON_MAP: Record<string, string> = (() => {
  const pools = (poolsData as { pools: Array<{ identifier: string; icon?: string }> }).pools
  const map: Record<string, string> = {}
  for (const pool of pools) {
    const norm = pool.identifier.toLowerCase().replace(/[^a-z0-9]/g, '')
    map[norm] = pool.icon ?? 'default.svg'
  }
  return map
})()

function getPoolIconSrc(miner?: string): string {
  if (!miner) return '/icons/pools/default.svg'
  const norm = miner.toLowerCase().replace(/[^a-z0-9]/g, '')
  const filename = POOL_ICON_MAP[norm] ?? 'default.svg'
  return `/icons/pools/${filename}`
}

function getRelativeTime(timestamp: number): string {
  const secs = Math.floor(Date.now() / 1000 - timestamp)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}:${String(secs % 60).padStart(2, '0')} ago`
  const hours = Math.floor(mins / 60)
  const remainderMins = mins % 60
  return `${hours}:${String(remainderMins).padStart(2, '0')} ago`
}

function MinerWithIcon({
  miner,
  minerName,
  className = '',
}: {
  miner?: string
  minerName?: string
  className?: string
}) {
  const displayName = minerName ?? miner ?? '—'
  return (
    <div className={`flex items-center gap-1.5 ${className}`.trim()}>
      <span className="text-gray-800 dark:text-gray-200 text-xs truncate min-w-0" style={{ fontWeight: 400 }}>
        {displayName}
      </span>
      <Image
        src={getPoolIconSrc(miner)}
        alt=""
        title={minerName ?? miner ?? 'Unknown'}
        width={14}
        height={14}
        className="w-3.5 h-3.5 flex-shrink-0"
      />
    </div>
  )
}

export default function BlockVisualizer() {
  const [blocks, setBlocks] = useState<BlockSnapshot[]>([])
  const [centerIndex, setCenterIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const isFetchingMoreRef = useRef(false)
  const noMoreBlocksRef = useRef(false)
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks

  const fetchBlockHistory = useCallback(async (beforeHeight: number | null = null) => {
    if (beforeHeight == null) noMoreBlocksRef.current = false
    setLoading(true)
    setError(null)
    try {
      const url =
        beforeHeight != null
          ? `/api/block-history?limit=${BLOCK_LIST_LIMIT}&beforeHeight=${beforeHeight}`
          : `/api/block-history?limit=${BLOCK_LIST_LIMIT}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        setError((errBody as { error?: string }).error ?? `Failed to load (${res.status})`)
        setBlocks([])
        return
      }
      const data = await res.json()
      const list = Array.isArray(data?.blocks) ? data.blocks : []
      setBlocks(list)
      if (list.length > 0 && beforeHeight == null) {
        setCenterIndex(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blocks')
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMoreBlocks = useCallback(async () => {
    if (isFetchingMoreRef.current || noMoreBlocksRef.current) return
    const blocksNow = blocksRef.current
    if (blocksNow.length === 0) return
    const lastHeight = blocksNow[blocksNow.length - 1].height
    isFetchingMoreRef.current = true
    try {
      const res = await fetch(
        `/api/block-history?limit=${BLOCK_LIST_LIMIT}&beforeHeight=${lastHeight}`,
        { cache: 'no-store' }
      )
      if (!res.ok) return
      const data = await res.json()
      const list = Array.isArray(data?.blocks) ? data.blocks : []
      if (list.length === 0) noMoreBlocksRef.current = true
      else setBlocks((b) => [...b, ...list])
    } finally {
      isFetchingMoreRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchBlockHistory(null)
  }, [fetchBlockHistory])

  useEffect(() => {
    if (
      blocks.length > 0 &&
      centerIndex >= blocks.length - 4 &&
      !isFetchingMoreRef.current &&
      !noMoreBlocksRef.current
    ) {
      fetchMoreBlocks()
    }
  }, [blocks.length, centerIndex, fetchMoreBlocks])

  useEffect(() => {
    fetch('/api/btc-price')
      .then((r) => r.json())
      .then((data: { price?: number }) => setBtcPrice(data?.price ?? null))
      .catch(() => {})
  }, [])

  const goOlder = useCallback(() => {
    setCenterIndex((i) => Math.min(i + 1, blocks.length - 1))
  }, [blocks.length])

  const goNewer = useCallback(() => {
    setCenterIndex((i) => Math.max(i - 1, 0))
  }, [])

  if (loading && blocks.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-pulse text-accent text-lg mb-2">Loading blocks...</div>
          <div className="text-secondary text-sm">Fetching block history</div>
        </div>
      </div>
    )
  }

  if (error && blocks.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error</div>
          <div className="text-secondary text-sm mb-4">{error}</div>
          <button onClick={() => fetchBlockHistory(null)} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (blocks.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-secondary text-sm">No block data available.</div>
      </div>
    )
  }

  const SLOTS = 7
  const slotIndices = Array.from({ length: SLOTS }, (_, i) => centerIndex - 3 + i)
  const navButtonClass =
    'flex items-center justify-center w-12 h-12 min-w-12 min-h-12 flex-shrink-0 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-secondary hover:text-accent hover:border-accent disabled:opacity-40 disabled:pointer-events-none transition-colors'

  return (
    <div className="relative flex flex-col xl:flex-row items-center gap-2">
      <div className="flex flex-row items-center justify-center gap-2 mb-2 xl:mb-0 xl:contents">
        <button
          type="button"
          onClick={goOlder}
          disabled={centerIndex >= blocks.length - 1}
          className={`${navButtonClass} xl:order-2`}
          aria-label="Move to older block"
        >
          <ChevronDown className="w-6 h-6 xl:hidden" />
          <ChevronRight className="w-6 h-6 hidden xl:block" />
        </button>
        <button
          type="button"
          onClick={goNewer}
          disabled={centerIndex <= 0}
          className={`${navButtonClass} xl:order-0`}
          aria-label="Move to newer block"
        >
          <ChevronUp className="w-6 h-6 xl:hidden" />
          <ChevronLeft className="w-6 h-6 hidden xl:block" />
        </button>
      </div>

      <div className="block-stack-container w-32 flex flex-col xl:flex-row xl:w-auto xl:flex-nowrap items-center gap-1 xl:gap-2 py-1 xl:order-1">
        {slotIndices.map((blockIdx, slotIdx) => {
          const block = blockIdx >= 0 && blockIdx < blocks.length ? blocks[blockIdx] : null
          const isCenter = slotIdx === 3
          const isNeighbor = slotIdx === 2 || slotIdx === 4
          const isTop = slotIdx === 0
          const isBottom = slotIdx === SLOTS - 1
          const isExtraLeftSlot = slotIdx === 0
          const showTip = blockIdx === 0 && block != null

          const slotClasses = [
            'block-stack-slot flex flex-col items-center transition-none flex-shrink-0',
            isExtraLeftSlot && 'hidden xl:flex',
            isCenter && 'block-stack-slot-center w-[265px] scale-110 z-10',
            isNeighbor && !isCenter && 'block-stack-slot-neighbor w-36 scale-105 z-[1]',
            !isCenter && !isNeighbor && !isBottom && 'w-32 scale-100',
            isBottom && !isCenter && 'w-32 scale-90',
            isTop && 'block-stack-fade-top xl:block-stack-fade-left',
            isBottom && 'block-stack-fade-bottom -mt-2.5 xl:mt-0 xl:-ml-2.5 xl:block-stack-fade-right',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div key={slotIdx} className={slotClasses}>
              {block ? (
                <div
                  className={`
                    w-full aspect-square rounded border bg-white dark:bg-gray-800 overflow-hidden flex flex-col
                    ${isCenter ? 'border-accent ring-2 ring-accent/30 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
                  `}
                >
                  {showTip && (
                    <div className="text-center py-1 px-1.5 bg-accent/20 dark:bg-accent/30 text-accent text-xs font-semibold leading-tight flex-shrink-0">
                      Tip
                    </div>
                  )}
                  {isCenter ? (
                    <div className="p-2 space-y-1.5 flex-1 min-h-0 overflow-auto">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex flex-row items-baseline justify-between gap-2">
                          <span className={`${showTip ? 'mt-0' : 'mt-2'} text-accent font-semibold text-base mb-2`}>{formatNumber(block.height)}</span>
                          <span className="text-secondary text-xs shrink-0">{getRelativeTime(block.timestamp)}</span>
                        </div>
                        <a
                          href={`https://mempool.space/block/${block.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-secondary text-xs hover:text-accent transition-colors inline-flex items-center gap-1 min-w-0"
                        >
                          <span className="truncate">{truncateHash(block.hash)}</span>
                          <ExternalLinkIcon className="w-3 h-3 shrink-0 text-current opacity-70" aria-hidden />
                        </a>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1 space-y-0.5 text-xs text-secondary">
                        <div>Tx: {formatNumber(block.txCount)}</div>
                        <div>Size: {formatBlockSize(block.size)}</div>
                        <div>Weight: {formatBlockWeight(block.weight ?? 0)}</div>
                        <div>
                          Fees: {block.totalFeesBTC.toFixed(4)} BTC
                          {btcPrice != null && ` (${formatPrice(block.totalFeesBTC * btcPrice)})`}
                        </div>
                        <div>
                          Range: {block.feeSpanMin} – {block.feeSpanMax} sat/vB
                        </div>
                        <div>Median: {block.medianFeeRate} sat/vB</div>
                        <div>
                          Volume: {block.totalValueBTC.toFixed(4)} BTC
                          {btcPrice != null && ` (${formatPrice(block.totalValueBTC * btcPrice)})`}
                        </div>
                        <div>
                          Coinbase: {block.subsidyPlusFeesBTC.toFixed(4)} BTC
                          {btcPrice != null && ` (${formatPrice(block.subsidyPlusFeesBTC * btcPrice)} USD)`}
                        </div>
                        <MinerWithIcon miner={block.miner} minerName={block.minerName} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 flex flex-col justify-center flex-1 min-h-0 text-center gap-1">
                      <span className="text-accent font-semibold text-base">{formatNumber(block.height)}</span>
                      <span className="text-secondary text-xs">{getRelativeTime(block.timestamp)}</span>
                      <MinerWithIcon miner={block.miner} minerName={block.minerName} className="justify-center" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="block-stack-placeholder w-full aspect-square rounded border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary text-xs">—</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

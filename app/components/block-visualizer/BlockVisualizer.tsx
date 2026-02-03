'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { bitcoinRpc } from '@/app/utils/bitcoinRpc'
import {
  processMempoolBlockData,
  ProcessedBlock,
  BlockSnapshot,
  formatBlockSize,
  formatBlockWeight,
  truncateHash,
} from '@/app/utils/blockUtils'
import { formatNumber, formatPrice } from '@/app/utils/formatting'
import BlockHeader from '@/app/components/block-visualizer/BlockHeader'
import TransactionTreemap from '@/app/components/block-visualizer/TransactionTreemap'
import { ChevronLeft, ChevronRight } from '@/app/components/Icons'
import { useMobileWarning } from '@/app/hooks/useMobileWarning'
import poolsData from '@/public/data/pools.json'

import { BLOCKS_PAGE_SIZE } from '@/app/utils/constants'

type SizeMetric = 'vbytes' | 'fee'

/** Default empty block template so the page renders immediately without waiting for RPC. */
const DEFAULT_BLOCK_TEMPLATE: ProcessedBlock = {
  height: 0,
  hash: 'pending',
  timestamp: 0,
  size: 0,
  weight: 0,
  txCount: 0,
  transactions: [],
}

/** Module-level cache so we can show the last template immediately on remount. */
let cachedTemplate: ProcessedBlock | null = null

/** Build identifier -> icon filename map from pools.json (single source of truth). */
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
  if (secs < 60) return `${secs} seconds ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  const remainderMins = mins % 60
  return `${hours}:${String(remainderMins).padStart(2, '0')} ago`
}

export default function BlockVisualizer() {
  const [blockData, setBlockData] = useState<ProcessedBlock>(() => cachedTemplate ?? DEFAULT_BLOCK_TEMPLATE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_isRefreshing, setIsRefreshing] = useState(false)
  const [previousBlocks, setPreviousBlocks] = useState<BlockSnapshot[]>([])
  const [isLoadingBlockHistory, setIsLoadingBlockHistory] = useState(false)
  const [blockHistoryError, setBlockHistoryError] = useState<string | null>(null)
  const [sizeMetric, setSizeMetric] = useState<SizeMetric>('vbytes')
  const [showNewBlockNotification, setShowNewBlockNotification] = useState(false)
  const [newBlockHeight, setNewBlockHeight] = useState<number | null>(null)
  const [treemapAnimationTrigger, setTreemapAnimationTrigger] = useState(0)
  /** Bump when a new block is detected so the current block section re-mounts and re-draws. */
  const [currentBlockDrawKey, setCurrentBlockDrawKey] = useState(0)
  const [btcPrice, setBtcPrice] = useState<number | null>(null)

  const lastKnownBlockHashRef = useRef<string | null>(null)
  const initialCurrentBlockFetchedRef = useRef(false)
  const previousBlocksScrollRef = useRef<HTMLDivElement>(null)
  const [scrollIndicators, setScrollIndicators] = useState({ left: false, right: false })
  const router = useRouter()
  const { showWarning: showMobileWarning, dismissed: mobileWarningDismissed, dismiss: handleDismissMobileWarning } = useMobileWarning('block-visualizer-mobile-warning-dismissed')

  const updateScrollIndicators = useCallback(() => {
    const el = previousBlocksScrollRef.current
    if (!el) return
    const canScrollLeft = el.scrollLeft > 0
    const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
    setScrollIndicators((prev) =>
      prev.left !== canScrollLeft || prev.right !== canScrollRight
        ? { left: canScrollLeft, right: canScrollRight }
        : prev
    )
  }, [])

  const scrollPreviousBlocks = useCallback((direction: 'left' | 'right') => {
    const el = previousBlocksScrollRef.current
    if (!el) return
    const delta = direction === 'left' ? -280 : 280
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  const fetchBlockHistory = useCallback(async (beforeHeight: number | null = null) => {
    const append = beforeHeight !== null
    setIsLoadingBlockHistory(true)
    setBlockHistoryError(null)
    try {
      const url =
        beforeHeight !== null
          ? `/api/block-history?limit=${BLOCKS_PAGE_SIZE}&beforeHeight=${beforeHeight}`
          : `/api/block-history?limit=${BLOCKS_PAGE_SIZE}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        setBlockHistoryError((errBody as { error?: string }).error ?? `Failed to load (${res.status})`)
        if (!append) setPreviousBlocks([])
        return
      }
      const data = await res.json()
      const list = Array.isArray(data?.blocks) ? data.blocks : []
      setPreviousBlocks((prev) => (append ? [...prev, ...list] : list))
    } catch (err) {
      setBlockHistoryError(err instanceof Error ? err.message : 'Failed to load previous blocks')
      if (!append) setPreviousBlocks([])
    } finally {
      setIsLoadingBlockHistory(false)
    }
  }, [])

  // Always scroll to the right so the last (newest) previous block is visible
  useEffect(() => {
    if (previousBlocks.length === 0 || isLoadingBlockHistory) return
    const el = previousBlocksScrollRef.current
    if (!el) return
    const scrollToEnd = () => {
      el.scrollTo({
        left: el.scrollWidth - el.clientWidth,
        behavior: 'smooth',
      })
    }
    const id = requestAnimationFrame(scrollToEnd)
    return () => cancelAnimationFrame(id)
  }, [previousBlocks, isLoadingBlockHistory])

  const fetchMempoolTemplate = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      const chainInfo = await bitcoinRpc('getblockchaininfo')
      if (chainInfo.error) {
        throw new Error(chainInfo.error.message || 'Failed to fetch blockchain info')
      }
      const result = chainInfo.result as { blocks: number; bestblockhash: string }
      const tipHeight = result.blocks
      const bestBlockHash = result.bestblockhash

      const lastKnown = lastKnownBlockHashRef.current
      const newBlockDetected = lastKnown !== null && bestBlockHash !== lastKnown

      if (newBlockDetected) {
        console.log('[BlockVisualizer] New block detected, height', tipHeight)
        setNewBlockHeight(tipHeight)
        setShowNewBlockNotification(true)
        setCurrentBlockDrawKey((k) => k + 1)
        setTimeout(() => setShowNewBlockNotification(false), 3000)
      }
      lastKnownBlockHashRef.current = bestBlockHash

      const mempoolResponse = await bitcoinRpc('getrawmempool', [true])
      if (mempoolResponse.error) {
        throw new Error(mempoolResponse.error.message || 'Failed to fetch mempool')
      }

      const verboseMempool = mempoolResponse.result as Record<
        string,
        { vsize: number; weight?: number; fee?: number; fees?: { base: number }; time?: number }
      >
      const template = processMempoolBlockData(verboseMempool, { tipHeight })
      cachedTemplate = template

      setBlockData(template)
      setTreemapAnimationTrigger((t) => t + 1)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mempool template'
      setError(errorMessage)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Load previous blocks and current block template in parallel on mount (no gate)
  useEffect(() => {
    if (typeof window === 'undefined') return
    fetchBlockHistory(null)
  }, [fetchBlockHistory])

  useEffect(() => {
    if (typeof window === 'undefined' || initialCurrentBlockFetchedRef.current) return
    initialCurrentBlockFetchedRef.current = true
    fetchMempoolTemplate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch BTC price for USD conversion in previous blocks
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const res = await fetch('/api/btc-price')
        const data = await res.json()
        if (data.price) setBtcPrice(data.price)
      } catch {
        // ignore
      }
    }
    fetchBtcPrice()
  }, [])

  // Auto-refresh polling (mempool changes often)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMempoolTemplate()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [fetchMempoolTemplate])

  // Update scroll indicators when previous blocks change or container resizes. Throttle to improve INP.
  useEffect(() => {
    if (previousBlocks.length === 0) return
    const el = previousBlocksScrollRef.current
    if (!el) return
    let rafId: number | null = null
    const run = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        updateScrollIndicators()
      })
    }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [previousBlocks, updateScrollIndicators])

  if (!blockData && !loading && !error) return null

  return (
    <div className="relative">
      {/* Mobile Warning Modal – shown first on mobile, before blocks load */}
      {showMobileWarning && !mobileWarningDismissed && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Block Visualizer is not optimized for small screens. The block explorer and treemap work best on desktop or tablet devices with larger screens.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You can still use Block Visualizer on mobile, but the experience may be limited. For the best experience, please use a desktop or tablet.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleDismissMobileWarning(false)}
                className="btn-primary-sm w-full"
              >
                Continue Anyway
              </button>
              <button
                onClick={() => handleDismissMobileWarning(true)}
                className="btn-secondary-sm w-full"
              >
                Continue & Don&apos;t Show Again
              </button>
              <button
                onClick={() => router.back()}
                className="btn-secondary-sm w-full"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !blockData && (
        <div className="w-full flex items-center justify-start py-12">
          <div className="text-center">
            <div className="animate-pulse text-btc text-lg mb-2">Loading block template...</div>
            <div className="text-secondary text-sm">Fetching mempool from node</div>
          </div>
        </div>
      )}

      {error && !blockData && (
        <div className="w-full flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error</div>
            <div className="text-secondary text-sm mb-4">{error}</div>
            <button
              onClick={() => fetchMempoolTemplate()}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {blockData && (
        <>
      {/* New block mined notification */}
      {showNewBlockNotification && newBlockHeight !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-btc max-w-md w-full mx-4 animate-scaleIn">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-btc rounded-lg shadow-lg animate-bounce flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-btc rounded-lg opacity-20 animate-ping" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-btc mb-2">New Block Mined!</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">
                Block #{newBlockHeight.toLocaleString()}
              </p>
              <p className="text-sm text-secondary">Current block template will refresh below.</p>
            </div>
          </div>
        </div>
      )}

      {/* Previous blocks overview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
        <h2 className="heading-section-muted">Previous blocks</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              fetchBlockHistory(
                previousBlocks.length > 0 ? Math.min(...previousBlocks.map((b) => b.height)) : null
              )
            }
            disabled={isLoadingBlockHistory}
            className="text-sm text-btc hover:text-btc/80 hover:no-underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
          >
            {isLoadingBlockHistory ? 'Loading…' : 'Load more'}
          </button>
        </div>
        </div>
        {blockHistoryError ? (
          <div className="py-4 flex flex-col items-center justify-center gap-2 text-secondary text-sm">
            <span>{blockHistoryError}</span>
            <button
              type="button"
              onClick={() => fetchBlockHistory(null)}
              className="text-btc hover:text-btc/80 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        ) : null}
        {previousBlocks.length > 0 ? (
          <div className="relative">
            {scrollIndicators.left && (
              <button
                type="button"
                onClick={() => scrollPreviousBlocks('left')}
                className="block-nav-arrow block-nav-arrow-left"
                aria-label="Scroll previous blocks left"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            <div
              ref={previousBlocksScrollRef}
              onScroll={updateScrollIndicators}
              className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
            >
            {[...previousBlocks].reverse().map((snap) => (
              <div key={snap.hash} className="flex-shrink-0 flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 min-w-0">
                  <span className="text-btc text-base font-medium truncate">{formatNumber(snap.height)}</span>
                </div>
                <div
                  className="block-card"
                >
                <div className="text-xs">
                  <div className="mb-2">{getRelativeTime(snap.timestamp)}</div>
                  <div className="font-mono">{truncateHash(snap.hash)}</div>
                  <div>Transactions: {formatNumber(snap.txCount)}</div>
                  <div>Size: {formatBlockSize(snap.size)}</div>
                  <div>Weight: {formatBlockWeight(snap.weight ?? 0)}</div>
                  <div>Fees: {snap.totalFeesBTC.toFixed(4)} BTC{btcPrice != null && ` (${formatPrice(snap.totalFeesBTC * btcPrice)})`}</div>
                  <div className="mb-2">Range: {snap.feeSpanMin} – {snap.feeSpanMax} sat/vB</div>
                  <div className="flex items-center gap-2">
                    <div>{snap.minerName ?? snap.miner ?? '—'}</div>
                    <Image
                      src={getPoolIconSrc(snap.miner)}
                      alt={snap.minerName ?? snap.miner ?? 'Unknown miner'}
                      title={snap.minerName ?? snap.miner ?? 'Unknown miner'}
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
                </div>
              </div>
            ))}
            </div>
            {scrollIndicators.right && (
              <button
                type="button"
                onClick={() => scrollPreviousBlocks('right')}
                className="block-nav-arrow block-nav-arrow-right"
                aria-label="Scroll previous blocks right"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 mt-4 mb-2">
        <h2 className="heading-section-muted">Current Block</h2>
        {_isRefreshing && (
          <span className="text-secondary text-sm">Updating…</span>
        )}
      </div>
      <div
        key={`current-block-${blockData.height}-${currentBlockDrawKey}`}
        className="flex flex-col lg:flex-row gap-4 items-stretch transition-opacity duration-300 mt-0"
      >
        <div className="flex flex-col flex-shrink-0 w-full lg:w-44 gap-4 lg:gap-0">
          <BlockHeader
            height={newBlockHeight ?? blockData.height}
            txCount={blockData.txCount}
            size={blockData.size}
          />

          <div className="flex items-center justify-between gap-2 lg:mt-4 w-max md:w-full">
            <label htmlFor="size-metric" className="flex-shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              id="size-metric"
              value={sizeMetric}
              onChange={(e) => {
                setSizeMetric(e.target.value as SizeMetric)
                setTreemapAnimationTrigger((t) => t + 1)
              }}
              className="input-panel-ring w-full px-3 py-2 text-sm"
            >
              <option value="vbytes">vBytes</option>
              <option value="fee">Fee</option>
            </select>
          </div>
        </div>
        <div className="flex-1 min-w-0 aspect-square">
          <TransactionTreemap
            transactions={blockData.transactions}
            sizeMetric={sizeMetric}
            onSizeMetricChange={setSizeMetric}
            showMetricSelector={false}
            hideLegendDuringFlyIn
            animationTrigger={treemapAnimationTrigger}
            square
          />
        </div>
      </div>

      {error && blockData && (
        <div className="warning-panel">
          <div className="font-semibold mb-1">Warning</div>
          <div>{error}</div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

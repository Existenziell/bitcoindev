'use client'

import { useMemo, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { hierarchy, treemap } from 'd3-hierarchy'
import { scaleSequential } from 'd3-scale'
import { interpolateRgb } from 'd3-interpolate'
import { ProcessedTransaction } from '@/app/utils/blockUtils'
import { formatNumber, formatPrice } from '@/app/utils/formatting'
import { truncateHash } from '@/app/utils/blockUtils'

// Modern poppy color palettes - one for each metric
// Using multiple color stops for wider gradient range
const COLOR_PALETTES = {
  vbytes: {
    stops: [
      '#e0f7fa', // Very light cyan
      '#b2ebf2', // Light cyan
      '#4dd0e1', // Medium cyan
      '#00bcd4', // Cyan
      '#0097a7', // Dark cyan
      '#006064', // Very dark cyan
    ],
  },
  fee: {
    stops: [
      '#f3e5f5', // Very light purple
      '#e1bee7', // Light purple
      '#ce93d8', // Medium purple
      '#ba68c8', // Purple
      '#9c27b0', // Dark purple
      '#6a1b9a', // Very dark purple
    ],
  },
}

type SizeMetric = 'vbytes' | 'fee'

interface TransactionTreemapProps {
  transactions: ProcessedTransaction[]
  width?: number
  height?: number
  sizeMetric?: SizeMetric
  onSizeMetricChange?: (metric: SizeMetric) => void
  showMetricSelector?: boolean
  /** When this value changes, fly-in runs (e.g. new block). Omit to use transactions-ref only. */
  animationTrigger?: number
  /** Use equal width and height (square) from container. */
  square?: boolean
  /** Show legend under the treemap (Color/Size = ..., Low → High). Default true. */
  showLegend?: boolean
  /** When true, hide the legend during fly-in / redraw so it appears only after animation. */
  hideLegendDuringFlyIn?: boolean
}

interface TreemapNode {
  x0: number
  y0: number
  x1: number
  y1: number
  data: ProcessedTransaction
}

export default function TransactionTreemap({
  transactions,
  width: propWidth,
  height = 600,
  sizeMetric: controlledSizeMetric,
  onSizeMetricChange,
  showMetricSelector = true,
  animationTrigger,
  square = false,
  showLegend = true,
  hideLegendDuringFlyIn = false,
}: TransactionTreemapProps) {
  const router = useRouter()
  const [hoveredTx, setHoveredTx] = useState<ProcessedTransaction | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [containerWidth, setContainerWidth] = useState(800)
  const [containerHeight, setContainerHeight] = useState(600)
  const [uncontrolledSizeMetric, setUncontrolledSizeMetric] = useState<SizeMetric>('vbytes')
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [flyInActive, setFlyInActive] = useState(true)
  const [prevTriggerForRender, setPrevTriggerForRender] = useState<number | undefined>(animationTrigger)
  const [flyInOriginState, setFlyInOriginState] = useState<{ x: number; y: number } | null>(null)
  const hasInitializedRef = useRef(false)
  const prevAnimationTriggerRef = useRef<number | undefined>(animationTrigger)
  /** Top-left origin (viewBox coords) at fly-in start; set when triggering so we use real layout size. */
  const flyInOriginRef = useRef<{ x: number; y: number } | null>(null)

  const sizeMetric = controlledSizeMetric ?? uncontrolledSizeMetric
  const setSizeMetric = (m: SizeMetric) => {
    if (onSizeMetricChange) onSizeMetricChange(m)
    if (controlledSizeMetric === undefined) setUncontrolledSizeMetric(m)
  }

  // Fetch BTC price for USD conversion
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch('/api/btc-price')
        const data = await response.json()
        if (data.price) {
          setBtcPrice(data.price)
        }
      } catch (error) {
        console.error('Failed to fetch BTC price:', error)
      }
    }

    fetchBtcPrice()
  }, [])

  // When trigger changed, hide tiles from the very first render so we never paint a scrambled frame.
  const triggerJustChanged =
    animationTrigger !== undefined && prevTriggerForRender !== animationTrigger
  const shouldHideForFlyIn = triggerJustChanged || flyInActive

  // Before paint: when we have transactions and (first load or trigger changed), show "from" state
  // so the user never sees the treemap fully visible before the fly-in runs.
  useLayoutEffect(() => {
    if (transactions.length === 0) return
    const isFirstLoad = !hasInitializedRef.current
    const triggerChanged =
      animationTrigger !== undefined && prevAnimationTriggerRef.current !== animationTrigger
    if (isFirstLoad || triggerChanged) {
      queueMicrotask(() => setFlyInActive(true))
    }
    queueMicrotask(() => setPrevTriggerForRender(animationTrigger))
  }, [transactions, animationTrigger])

  // Trigger fly-in only on first page load or when parent signals (e.g. new block via animationTrigger).
  // Read container size from DOM when triggering so the origin uses real layout dimensions.
  useEffect(() => {
    if (transactions.length === 0) return
    const isFirstLoad = !hasInitializedRef.current
    const triggerChanged =
      animationTrigger !== undefined && prevAnimationTriggerRef.current !== animationTrigger
    prevAnimationTriggerRef.current = animationTrigger
    if (isFirstLoad) hasInitializedRef.current = true
    if (!isFirstLoad && !triggerChanged) return

    const startFlyIn = () => {
      const el = containerRef.current
      const w = el?.clientWidth ?? 0
      const h = el?.clientHeight ?? 0
      if (w <= 0 || (square && h <= 0)) {
        requestAnimationFrame(startFlyIn)
        return
      }
      const origin = { x: 0, y: 0 }
      flyInOriginRef.current = origin
      setFlyInOriginState(origin)
      setFlyInActive(true)
    }
    // Defer one frame so layout (and resize effect) have run and we have real dimensions
    const id = requestAnimationFrame(startFlyIn)
    return () => cancelAnimationFrame(id)
  }, [transactions, animationTrigger, height, square])

  // After painting "from" state, switch to "to" so CSS transition runs
  useEffect(() => {
    if (!flyInActive) return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyInActive(false)
        flyInOriginRef.current = null
        setFlyInOriginState(null)
      })
    })
    return () => cancelAnimationFrame(id)
  }, [flyInActive])

  // Calculate responsive width and height. Throttle resize to avoid main-thread work and improve INP.
  useEffect(() => {
    let rafId: number | null = null
    let idleId: number | null = null
    const updateSize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      if (w > 0) setContainerWidth(w)
      if (h > 0) setContainerHeight(h)
    }

    const scheduleUpdate = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        updateSize()
      })
    }

    const el = containerRef.current
    if (el) {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0) setContainerWidth(w)
      if (h > 0) setContainerHeight(h)
    }
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(updateSize, { timeout: 300 })
    }
    let ro: ResizeObserver | null = null
    if (el) {
      ro = new ResizeObserver(scheduleUpdate)
      ro.observe(el)
    }
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.removeEventListener('resize', scheduleUpdate)
      ro?.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        ;(window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId)
      }
    }
  }, [])

  // When square, use same size for width and height; otherwise use container width and prop height
  const effectiveSize = square
    ? Math.min(containerWidth, containerHeight)
    : null
  const width =
    flyInActive && flyInOriginState
      ? flyInOriginState.x
      : effectiveSize ?? propWidth ?? containerWidth
  const heightUsed =
    flyInActive && flyInOriginState
      ? flyInOriginState.y
      : effectiveSize ?? height

  // Get value for selected metric
  const getMetricValue = useCallback((tx: ProcessedTransaction): number => {
    switch (sizeMetric) {
      case 'vbytes':
        return tx.vsize
      case 'fee':
        return tx.fee
      default:
        return tx.vsize
    }
  }, [sizeMetric])

  // Get label for selected metric
  const _getMetricLabel = (): string => {
    switch (sizeMetric) {
      case 'vbytes':
        return 'Transaction vBytes'
      case 'fee':
        return 'Transaction Fee'
      default:
        return 'Transaction vBytes'
    }
  }

  // Get color label for selected metric
  const getColorLabel = (): string => {
    switch (sizeMetric) {
      case 'vbytes':
        return 'Transaction vBytes'
      case 'fee':
        return 'Transaction Fee'
      default:
        return 'Transaction vBytes'
    }
  }

  // Calculate range for selected metric for color scaling
  const metricRange = useMemo(() => {
    if (transactions.length === 0) return [0, 1]
    const values = transactions.map(tx => getMetricValue(tx))
    const min = Math.min(...values)
    const max = Math.max(...values)
    return [min, max]
  }, [transactions, getMetricValue])

  // Multi-stop color interpolator for wider gradient range
  const multiStopInterpolator = useCallback((t: number): string => {
    const palette = COLOR_PALETTES[sizeMetric]
    const stops = palette.stops
    const numStops = stops.length

    // Calculate which segment of the gradient we're in
    const segmentSize = 1 / (numStops - 1)
    const segmentIndex = Math.min(Math.floor(t / segmentSize), numStops - 2)
    const segmentT = (t - segmentIndex * segmentSize) / segmentSize

    // Interpolate between the two stops in this segment
    return interpolateRgb(stops[segmentIndex], stops[segmentIndex + 1])(segmentT)
  }, [sizeMetric])

  // Create color scale based on selected metric using multi-stop palette
  const colorScale = useMemo(() => {
    const palette = COLOR_PALETTES[sizeMetric]
    if (metricRange[1] === metricRange[0]) {
      return () => palette.stops[palette.stops.length - 1] // Default to darkest color if all same
    }
    return scaleSequential(multiStopInterpolator)
      .domain([metricRange[0], metricRange[1]])
  }, [metricRange, sizeMetric, multiStopInterpolator])

  // Generate treemap layout
  const treemapNodes = useMemo(() => {
    if (transactions.length === 0) return []

    // Create hierarchy data structure
    interface HierarchyData {
      value: number
      tx: ProcessedTransaction
    }

    const hierarchyData = transactions.map(tx => ({
      value: getMetricValue(tx), // Use selected metric as the value for treemap sizing
      tx,
    }))


    const root = hierarchy<HierarchyData>({
      children: hierarchyData,
    } as any)
      .sum((d: any) => (d.data?.value || d.value || 0))
      .sort((a: any, b: any) => ((b.value || 0) - (a.value || 0)))

    // Generate treemap layout
    const treemapLayout = treemap<any>()
      .size([width, heightUsed])
      .padding(1)
      .round(true)

    treemapLayout(root as any)

    // Extract nodes
    const nodes: TreemapNode[] = []
    root.each((d: any) => {
      if (d.data && d.data.tx) {
        nodes.push({
          x0: d.x0 || 0,
          y0: d.y0 || 0,
          x1: d.x1 || 0,
          y1: d.y1 || 0,
          data: d.data.tx,
        })
      }
    })

    return nodes
  }, [transactions, width, heightUsed, getMetricValue])

  // Animation order: biggest first (by area). Map txid -> animation index (0 = biggest).
  const animationIndexByTxid = useMemo(() => {
    const byArea = [...treemapNodes].sort(
      (a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0)
    )
    const map = new Map<string, number>()
    byArea.forEach((node, i) => map.set(node.data.txid, i))
    return map
  }, [treemapNodes])

  // Handle mouse move for tooltip positioning
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const mouseX = event.clientX - containerRect.left
      const mouseY = event.clientY - containerRect.top
      
      // Tooltip dimensions (approximate)
      const tooltipWidth = 300
      const tooltipHeight = 180
      const offset = 15
      
      // Calculate position with overflow detection
      let x = mouseX + offset
      let y = mouseY + offset
      
      // Check right edge overflow - show tooltip to the left of cursor
      if (x + tooltipWidth > containerRect.width) {
        x = mouseX - tooltipWidth - offset
      }
      
      // Check bottom edge overflow - show tooltip above cursor
      if (y + tooltipHeight > containerRect.height) {
        y = mouseY - tooltipHeight - offset
      }
      
      // Ensure tooltip doesn't go off left edge
      if (x < 0) {
        x = offset
      }
      
      // Ensure tooltip doesn't go off top edge
      if (y < 0) {
        y = offset
      }
      
      setTooltipPosition({ x, y })
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-secondary">Loading transactions…</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {showMetricSelector && (
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="size-metric" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort tx blocks by:
            </label>
            <select
              id="size-metric"
              value={sizeMetric}
              onChange={(e) => setSizeMetric(e.target.value as SizeMetric)}
              className="input-panel-ring px-3 py-1.5 text-sm"
            >
              <option value="vbytes">vBytes</option>
              <option value="fee">Fee</option>
            </select>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%"
        height={square ? '100%' : heightUsed}
        viewBox={`0 0 ${width} ${heightUsed}`}
        className="bg-gray-50 dark:bg-gray-900 treemap-rect-transition"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredTx(null)}
        aria-label="Transaction treemap visualization"
      >
        {treemapNodes.map((node) => {
          const rectWidth = node.x1 - node.x0
          const rectHeight = node.y1 - node.y0
          const color = colorScale(getMetricValue(node.data))
          const isHovered = hoveredTx?.txid === node.data.txid
          const origin = shouldHideForFlyIn && flyInOriginState ? flyInOriginState : { x: 0, y: 0 }
          const fromTransform = `translate(${origin.x}px, ${origin.y}px) scale(0)`
          const toTransform = `translate(${node.x0}px, ${node.y0}px) scale(1)`
          const n = treemapNodes.length
          const animIndex = animationIndexByTxid.get(node.data.txid) ?? 0
          const totalStaggerMs = 400
          const k = 1.8
          const staggerMs =
            n <= 1 ? 0 : totalStaggerMs * (1 - ((n - 1 - animIndex) / (n - 1)) ** k)
          const durationMs = 500

          return (
            <g
              key={node.data.txid}
              style={{
                transform: shouldHideForFlyIn ? fromTransform : toTransform,
                transformOrigin: `${origin.x}px ${origin.y}px`,
                transformBox: 'view-box',
                opacity: shouldHideForFlyIn ? 0 : 1,
                transition: `transform ${durationMs}ms ease-in-out ${staggerMs}ms, opacity ${durationMs}ms ease-in-out ${staggerMs}ms`,
              }}
            >
              <rect
                x={0}
                y={0}
                width={rectWidth}
                height={rectHeight}
                fill={color}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={0.5}
                opacity={isHovered ? 0.9 : 0.8}
                onMouseEnter={() => setHoveredTx(node.data)}
                onMouseLeave={() => setHoveredTx(null)}
                onClick={() => router.push(`/interactive-tools/block-visualizer/tx/${node.data.txid}`)}
                className="cursor-pointer"
                aria-label={`Transaction ${truncateHash(node.data.txid)} - Click to view details`}
              />
              {rectWidth > 60 && rectHeight > 20 && (
                <text
                  x={rectWidth / 2}
                  y={rectHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-mono fill-gray-900 dark:fill-gray-100 pointer-events-none"
                  style={{ fontSize: Math.min(rectWidth / 10, 12) }}
                >
                  {truncateHash(node.data.txid, 4, 4)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {hoveredTx && !shouldHideForFlyIn && (
        <div
          className="absolute z-10 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg border border-gray-700 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            maxWidth: '300px',
          }}
        >
          <div className="font-semibold mb-2 text-btc">Transaction Details</div>
          <div className="space-y-1">
            <div>
              <span className="text-gray-400">TXID:</span>{' '}
              <code className="text-xs break-all">{truncateHash(hoveredTx.txid)}</code>
            </div>
            <div className={sizeMetric === 'vbytes' ? 'font-semibold text-white bg-gray-700 dark:bg-gray-600 rounded px-1.5 py-0.5' : ''}>
              <span className={sizeMetric === 'vbytes' ? 'text-gray-300' : 'text-gray-400'}>Size:</span>{' '}
              {formatNumber(hoveredTx.vsize)} vB
            </div>
            <div>
              <span className="text-gray-400">Fee Rate:</span>{' '}
              {formatNumber(hoveredTx.feeRate)} sat/vB
            </div>
            <div className={sizeMetric === 'fee' ? 'font-semibold text-white bg-gray-700 dark:bg-gray-600 rounded px-1.5 py-0.5' : ''}>
              <span className={sizeMetric === 'fee' ? 'text-gray-300' : 'text-gray-400'}>Fee:</span>{' '}
              {(hoveredTx.fee * 100000000).toFixed(0)} sats
              {btcPrice && (
                <span> ({formatPrice(hoveredTx.fee * btcPrice)})</span>
              )}
            </div>
          </div>
        </div>
      )}

      {showLegend && (!hideLegendDuringFlyIn || !shouldHideForFlyIn) && (
        <div className="mt-4 flex items-center justify-between text-sm flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {sizeMetric === 'vbytes' && (
                <div className="w-4 h-4 rounded bg-gradient-to-r from-cyan-100 via-cyan-300 to-cyan-600"></div>
              )}
              {sizeMetric === 'fee' && (
                <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-100 via-purple-300 to-purple-600"></div>
              )}
              <span className="text-secondary">Color / Size = {getColorLabel()}</span>
            </div>
            <div className="text-secondary">
              {sizeMetric === 'vbytes' && (
                <>Low: {formatNumber(metricRange[0])} vB → High: {formatNumber(metricRange[1])} vB</>
              )}
              {sizeMetric === 'fee' && (
                <>Low: {metricRange[0].toFixed(8)} BTC → High: {metricRange[1].toFixed(8)} BTC</>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

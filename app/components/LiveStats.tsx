'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import copyToClipboard from '@/app/utils/copyToClipboard'
import { bitcoinRpc } from '@/app/utils/bitcoinRpc'
import { formatNumber, formatPrice, formatDifficulty, formatBytes } from '@/app/utils/formatting'
import ExternalLink from '@/app/components/ExternalLink'

const BTC_HEX = '#f2a900'

interface BlockchainInfo {
  blocks: number
  difficulty: number
  bestblockhash: string
}

interface MempoolInfo {
  size: number
  bytes: number
}

interface StatItem {
  label: string
  value: string | null
  href?: string
  external?: boolean
  onClick?: () => void
}

export default function LiveStats() {
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [satsPerUSD, setSatsPerUSD] = useState<number>(0)
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(null)
  const [mempoolInfo, setMempoolInfo] = useState<MempoolInfo | null>(null)
  const [feeRate, setFeeRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [priceData, blockchainData, mempoolData, feeData] = await Promise.all([
          fetch('/api/btc-price').then(r => r.json()),
          bitcoinRpc('getblockchaininfo'),
          bitcoinRpc('getmempoolinfo'),
          bitcoinRpc('estimatesmartfee', [6]), // Target 6 blocks (~1 hour)
        ])

        if (priceData.price) {
          setBtcPrice(priceData.price)
          setSatsPerUSD(Math.round(100000000 / priceData.price))
        }

        if (blockchainData.result) {
          setBlockchainInfo(blockchainData.result as BlockchainInfo)
        }

        if (mempoolData.result) {
          setMempoolInfo(mempoolData.result as MempoolInfo)
        }

        // Fee is returned in BTC/kvB, convert to sat/vB
        const feerate = (feeData.result as { feerate?: number } | undefined)?.feerate
        if (feerate != null) {
          const satPerVb = Math.round(feerate * 100000) // BTC/kvB to sat/vB
          setFeeRate(satPerVb)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    // Defer fetch so first paint and first tap aren't competing with heavy effects (INP)
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(fetchData, { timeout: 2000 })
      return () => (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id)
    }
    const id = setTimeout(fetchData, 0)
    return () => clearTimeout(id)
  }, [])

  const stats: StatItem[] = [
    {
      label: 'Block Height',
      value: blockchainInfo?.blocks ? formatNumber(blockchainInfo.blocks) : null,
      href: '/docs/mining/block-construction',
    },
    {
      label: 'Fee Rate',
      value: feeRate ? `${feeRate} sat/vB` : null,
      href: '/docs/bitcoin/transaction-fees',
    },
    {
      label: 'Difficulty',
      value: blockchainInfo?.difficulty ? formatDifficulty(blockchainInfo.difficulty) : null,
      href: '/docs/mining/difficulty',
    },
    {
      label: 'Mempool Txs',
      value: mempoolInfo?.size ? formatNumber(mempoolInfo.size) : null,
      href: '/interactive-tools/block-visualizer',
    },
    {
      label: 'Mempool Size',
      value: mempoolInfo?.bytes ? formatBytes(mempoolInfo.bytes) : null,
      href: '/docs/mining/mempool',
    },
    {
      label: 'Hex',
      value: BTC_HEX,
      onClick: () => copyToClipboard(BTC_HEX, BTC_HEX),
    },
    {
      label: 'BTC/USD',
      value: btcPrice ? formatPrice(btcPrice) : null,
      href: '/docs/bitcoin-development/price-tracking',
    },
    {
      label: 'Sats/USD',
      value: satsPerUSD ? formatNumber(satsPerUSD) : null,
      href: '/interactive-tools/denominations-calculator',
    },
  ]

  const StatCard = memo(({ stat }: { stat: StatItem }) => {
    const content = (
      <>
        <span className="text-lg md:text-xl font-bold text-accent min-h-[2rem] flex items-center justify-center" aria-live="polite" aria-atomic="true">
          {loading && !stat.value ? (
            <span className="animate-pulse text-gray-400">...</span>
          ) : stat.value ? (
            stat.value
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </span>
        <span className="block text-xs text-secondary group-hover:text-accent transition-colors">
          {stat.label}
        </span>
      </>
    )

    const className = "bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow hover:no-underline group"

    if (stat.onClick) {
      return (
        <button
          onClick={stat.onClick}
          className={`${className} cursor-pointer w-full`}
          aria-label={`${stat.label}: ${stat.value || 'Click to copy'}`}
        >
          {content}
        </button>
      )
    }

    if (stat.href) {
      if (stat.external) {
        return (
          <ExternalLink
            href={stat.href}
            className={`${className} flex flex-col items-center justify-center`}
            iconClassName="mt-0.5"
            aria-label={`${stat.label}: ${stat.value || 'No data'} (opens in new tab)`}
          >
            {content}
          </ExternalLink>
        )
      }
      return (
        <Link
          href={stat.href}
          className={className}
          aria-label={`${stat.label}: ${stat.value || 'No data'}`}
        >
          {content}
        </Link>
      )
    }

    return (
      <div className={className} role="status" aria-label={`${stat.label}: ${stat.value || 'No data'}`}>
        {content}
      </div>
    )
  })

  StatCard.displayName = 'StatCard'

  return (
    <div className="container-content py-8 md:py-12">
      <h3 className="heading-section-muted text-center mb-4">
        Bitcoin Mainnet Network Stats
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-4 mb-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  )
}

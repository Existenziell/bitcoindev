'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FeeEstimatorIcon } from '@/app/components/Icons'
import { bitcoinRpc } from '@/app/utils/bitcoinRpc'
import { parseVBytes, toSatPerVb } from '@/app/utils/feeEstimator'

interface FeeRates {
  satPerVb1: number | null
  satPerVb6: number | null
  btcPrice: number | null
  loading: boolean
  error: string | null
}

export default function FeeEstimatorPage() {
  const [vbytesInput, setVbytesInput] = useState('140')
  const [feeRates, setFeeRates] = useState<FeeRates>({
    satPerVb1: null,
    satPerVb6: null,
    btcPrice: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    const fetchRates = async () => {
      try {
        const [fee1, fee6, priceRes] = await Promise.all([
          bitcoinRpc('estimatesmartfee', [1]),
          bitcoinRpc('estimatesmartfee', [6]),
          fetch('/api/btc-price').then((r) => r.json()),
        ])
        if (cancelled) return
        const result1 = fee1.result as { feerate?: number; fee_rate?: number } | undefined
        const result6 = fee6.result as { feerate?: number; fee_rate?: number } | undefined
        // Node may return fee_rate (sat/vB) or feerate (BTC/kvB). Prefer fee_rate when present and in sat/vB range.
        const satPerVb1 = toSatPerVb(result1)
        const satPerVb6 = toSatPerVb(result6)
        const btcPrice = priceRes?.price ?? null
        setFeeRates({
          satPerVb1,
          satPerVb6,
          btcPrice,
          loading: false,
          error: null,
        })
      } catch (e) {
        if (!cancelled) {
          setFeeRates((prev) => ({
            ...prev,
            loading: false,
            error: (e as Error).message,
          }))
        }
      }
    }
    fetchRates()
    return () => {
      cancelled = true
    }
  }, [])

  const vbytes = parseVBytes(vbytesInput)
  const feeSats1 = vbytes != null && feeRates.satPerVb1 != null ? vbytes * feeRates.satPerVb1 : null
  const feeSats6 = vbytes != null && feeRates.satPerVb6 != null ? vbytes * feeRates.satPerVb6 : null
  const feeUsd1 =
    feeSats1 != null && feeRates.btcPrice != null
      ? (feeSats1 / 100_000_000) * feeRates.btcPrice
      : null
  const feeUsd6 =
    feeSats6 != null && feeRates.btcPrice != null
      ? (feeSats6 / 100_000_000) * feeRates.btcPrice
      : null

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <FeeEstimatorIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Fee Estimator</h1>
        <p className="text-secondary text-center">
          Estimate transaction fee from size (vBytes) and current network fee rate. Rates are fetched from a public
          node (estimatesmartfee). A typical one-input, two-output P2WPKH spend is about 140 vBytes.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Transaction size (vBytes)</label>
          <input
            type="text"
            value={vbytesInput}
            onChange={(e) => setVbytesInput(e.target.value)}
            placeholder="140"
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 font-mono"
          />
          {vbytesInput.trim() && vbytes === null && (
            <p className="text-red-500 text-sm mt-1">Enter a number between 1 and 1,000,000</p>
          )}
        </div>

        {feeRates.loading && (
          <p className="text-secondary">Loading fee rates from node…</p>
        )}
        {feeRates.error && (
          <p className="text-red-500">{feeRates.error}</p>
        )}

        {!feeRates.loading && !feeRates.error && vbytes != null && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4">
            {(feeRates.satPerVb1 === 1 && feeRates.satPerVb6 === 1) && (
              <p className="text-amber-600 dark:text-amber-500 text-sm">
                The node returned 1 sat/vB for both targets; it may be a default when fee data is limited.
              </p>
            )}
            <div>
              <h2 className="font-semibold mb-2">Estimated fee</h2>
              <p className="text-secondary text-sm mb-2">
                Target: 1 block (~10 min) — {feeRates.satPerVb1 != null ? `${feeRates.satPerVb1} sat/vB` : '—'}
              </p>
              <p className="font-mono">
                {feeSats1 != null ? (
                  <>
                    {feeSats1.toLocaleString()} sats
                    {feeRates.satPerVb1 != null && (
                      <span className="text-secondary text-sm font-normal ml-2">
                        ({vbytes} × {feeRates.satPerVb1} sat/vB)
                      </span>
                    )}
                    {feeUsd1 != null && (
                      <span className="text-secondary ml-2">({feeUsd1 < 0.01 ? '< $0.01' : `$${feeUsd1.toFixed(2)}`})</span>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <p className="text-secondary text-sm mb-2">
                Target: 6 blocks (~1 hour) — {feeRates.satPerVb6 != null ? `${feeRates.satPerVb6} sat/vB` : '—'}
              </p>
              <p className="font-mono">
                {feeSats6 != null ? (
                  <>
                    {feeSats6.toLocaleString()} sats
                    {feeRates.satPerVb6 != null && (
                      <span className="text-secondary text-sm font-normal ml-2">
                        ({vbytes} × {feeRates.satPerVb6} sat/vB)
                      </span>
                    )}
                    {feeUsd6 != null && (
                      <span className="text-secondary ml-2">({feeUsd6 < 0.01 ? '< $0.01' : `$${feeUsd6.toFixed(2)}`})</span>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>
        )}

        <p className="text-secondary text-sm">
          See <Link href="/docs/bitcoin-development/fee-estimation" className="link">Fee Estimation</Link> and{' '}
          <Link href="/docs/bitcoin/transaction-fees" className="link">Transaction Fees</Link>. Rates are
          heuristic; confirmation time is not guaranteed.
        </p>
      </div>
    </>
  )
}

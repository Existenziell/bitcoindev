'use client'

import { useState, useEffect } from 'react'
import { bitcoinRpc } from '@/app/utils/bitcoinRpc'
import { formatNumber, formatPrice } from '@/app/utils/formatting'
import { truncateHash, formatBlockTimestamp, getTransactionFee, calculateTransactionFeeRate } from '@/app/utils/blockUtils'
import copyToClipboard from '@/app/utils/copyToClipboard'
import { CopyIcon, ChevronLeft } from '@/app/components/Icons'
import Link from 'next/link'

interface TransactionDetailProps {
  txid: string
}

interface TransactionInput {
  txid: string
  vout: number
  scriptSig?: {
    asm: string
    hex: string
  }
  sequence: number
  prevout?: {
    scriptPubKey: {
      address?: string
      type: string
      hex: string
    }
    value: number
  }
}

interface TransactionOutput {
  value: number
  n: number
  scriptPubKey: {
    address?: string
    type: string
    hex: string
    asm?: string
  }
}

interface TransactionData {
  txid: string
  hash: string
  version: number
  size: number
  vsize: number
  weight: number
  locktime: number
  vin: TransactionInput[]
  vout: TransactionOutput[]
  fee?: number
  blockhash?: string
  blockheight?: number
  blocktime?: number
  confirmations?: number
}

export default function TransactionDetail({ txid }: TransactionDetailProps) {
  const [txData, setTxData] = useState<TransactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [btcPrice, setBtcPrice] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/btc-price')
      .then((r) => r.json())
      .then((data: { price?: number }) => setBtcPrice(data?.price ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch transaction with full details (verbosity 2)
        const response = await bitcoinRpc('getrawtransaction', [txid, 2])

        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch transaction')
        }

        setTxData(response.result as TransactionData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction data'
        setError(errorMessage)
        console.error('Error fetching transaction:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [txid])

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text, label)
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-pulse text-btc text-lg mb-2">Loading transaction...</div>
          <div className="text-secondary text-sm">Fetching transaction data</div>
        </div>
      </div>
    )
  }

  if (error || !txData) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error</div>
          <div className="text-secondary text-sm mb-4">{error || 'Transaction not found'}</div>
          <Link href="/interactive-tools/block-visualizer" className="btn-primary">
            Back to Block Visualizer
          </Link>
        </div>
      </div>
    )
  }

  const totalInputValue = txData.vin.reduce((sum, input) => sum + (input.prevout?.value || 0), 0)
  const totalOutputValue = txData.vout.reduce((sum, output) => sum + output.value, 0)
  const fee = getTransactionFee(txData.vin, txData.vout, txData.fee)
  const feeRate =
    fee != null && fee >= 0 && txData.vsize > 0
      ? calculateTransactionFeeRate({ fee, vsize: txData.vsize })
      : null

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/interactive-tools/block-visualizer"
          className="p-2 text-secondary hover:text-btc hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
          aria-label="Back to block visualizer"
        >
          <ChevronLeft className="w-8 h-8" />
        </Link>
        <h1 className="heading-page mb-0">Transaction Details</h1>
      </div>

      {/* Transaction Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-btc mb-3">Overview</h2>
        <div className="flex flex-wrap justify-between gap-6 text-sm">
          <div className="md:col-span-2">
            <div className="text-secondary text-xs mb-0.5">Transaction ID</div>
            <div className="flex items-center gap-1">
              <code className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all">
                {truncateHash(txData.txid)}
              </code>
              <button
                onClick={() => handleCopy(txData.txid, 'Transaction ID')}
                className="p-0.5 text-secondary hover:text-btc transition-colors"
                aria-label="Copy transaction ID"
              >
                <CopyIcon className="w-3 h-3" />
              </button>
            </div>
          </div>

          {txData.blockhash && (
            <div className="md:col-span-2">
              <div className="text-secondary text-xs mb-0.5">Block Hash</div>
              <div className="flex items-center gap-1">
                <code className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all">
                  {truncateHash(txData.blockhash)}
                </code>
                <button
                  onClick={() => handleCopy(txData.blockhash!, 'Block hash')}
                  className="p-0.5 text-secondary hover:text-btc transition-colors"
                  aria-label="Copy block hash"
                >
                  <CopyIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {txData.blockheight !== undefined && (
            <div>
              <div className="text-secondary text-xs mb-0.5">Block Height</div>
              <div className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
                {formatNumber(txData.blockheight)}
              </div>
            </div>
          )}

          {txData.blocktime && (
            <div>
              <div className="text-secondary text-xs mb-0.5">Timestamp</div>
              <div className="text-gray-800 dark:text-gray-200 text-sm">
                {formatBlockTimestamp(txData.blocktime)}
              </div>
            </div>
          )}

          <div>
            <div className="text-secondary text-xs mb-0.5">Size</div>
            <div className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
              {formatNumber(txData.vsize)} vB
            </div>
          </div>

          <div
            title={
              fee == null
                ? 'Fee not available when block undo data is missing (e.g. pruned node).'
                : undefined
            }
          >
            <div className="text-secondary text-xs mb-0.5">Fee</div>
            <div className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
              {fee != null
                ? `${(fee * 100000000).toFixed(0)} sats${btcPrice != null ? ` (${formatPrice(fee * btcPrice)})` : ''}`
                : '—'}
            </div>
          </div>

          <div
            title={
              feeRate == null
                ? 'Fee rate not available when block undo data is missing (e.g. pruned node).'
                : undefined
            }
          >
            <div className="text-secondary text-xs mb-0.5">Fee Rate</div>
            <div className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
              {feeRate != null ? `${formatNumber(feeRate)} sat/vB` : '—'}
            </div>
          </div>

          <div>
            <div className="text-secondary text-xs mb-0.5">Confirmations</div>
            <div className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
              {txData.confirmations !== undefined ? formatNumber(txData.confirmations) : 'Unconfirmed'}
            </div>
          </div>
        </div>
      </div>

      {/* Inputs and Outputs - Two column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Inputs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-btc">
              Inputs ({txData.vin.length})
            </h2>
            <div className="text-sm text-secondary">
              {totalInputValue.toFixed(8)} BTC
            </div>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {txData.vin.map((input, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-secondary text-xs">Previous TX</div>
                    <div className="flex items-center gap-1">
                      <code className="font-mono text-xs text-gray-800 dark:text-gray-200">
                        {truncateHash(input.txid, 6, 6)}
                      </code>
                      <button
                        onClick={() => handleCopy(input.txid, 'Previous TXID')}
                        className="p-0.5 text-secondary hover:text-btc transition-colors"
                        aria-label="Copy previous transaction ID"
                      >
                        <CopyIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {input.prevout && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-secondary text-xs">Value</div>
                        <div className="text-gray-800 dark:text-gray-200 font-semibold text-xs">
                          {input.prevout.value.toFixed(8)} BTC
                        </div>
                      </div>
                      {input.prevout.scriptPubKey.address && (
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-secondary text-xs shrink-0">Address</div>
                          <div className="flex items-center gap-1 min-w-0">
                            <code className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate">
                              {input.prevout.scriptPubKey.address}
                            </code>
                            <button
                              onClick={() => handleCopy(input.prevout!.scriptPubKey.address!, 'Address')}
                              className="p-0.5 text-secondary hover:text-btc transition-colors shrink-0"
                              aria-label="Copy address"
                            >
                              <CopyIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-secondary text-xs">Type</div>
                        <div className="text-gray-800 dark:text-gray-200 text-xs">
                          {input.prevout.scriptPubKey.type}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outputs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-btc">
              Outputs ({txData.vout.length})
            </h2>
            <div className="text-sm text-secondary">
              {totalOutputValue.toFixed(8)} BTC
            </div>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {txData.vout.map((output, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-secondary text-xs">Index</div>
                    <div className="text-gray-800 dark:text-gray-200 font-semibold text-xs">
                      {output.n}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-secondary text-xs">Value</div>
                    <div className="text-gray-800 dark:text-gray-200 font-semibold text-xs">
                      {output.value.toFixed(8)} BTC
                    </div>
                  </div>
                  {output.scriptPubKey.address && (
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-secondary text-xs shrink-0">Address</div>
                      <div className="flex items-center gap-1 min-w-0">
                        <code className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate">
                          {output.scriptPubKey.address}
                        </code>
                        <button
                          onClick={() => handleCopy(output.scriptPubKey.address!, 'Address')}
                          className="p-0.5 text-secondary hover:text-btc transition-colors shrink-0"
                          aria-label="Copy address"
                        >
                          <CopyIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-secondary text-xs">Type</div>
                    <div className="text-gray-800 dark:text-gray-200 text-xs">
                      {output.scriptPubKey.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

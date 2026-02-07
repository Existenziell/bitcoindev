/**
 * Block data processing utilities for blockchain visualization.
 * Transforms Bitcoin RPC responses into formats suitable for visualization.
 */

import poolsData from '@/public/data/pools.json'

export interface ProcessedTransaction {
  txid: string
  vsize: number // Virtual size in vBytes
  fee: number // Fee in BTC
  feeRate: number // Fee rate in sat/vB
  value: number // Total input value in BTC (economic value being moved)
}

export interface ProcessedBlock {
  height: number
  hash: string
  timestamp: number
  size: number
  weight: number
  txCount: number
  /** Pool identifier (for icon lookup). */
  miner?: string
  /** Pool display name. */
  minerName?: string
  transactions: ProcessedTransaction[]
}

/** Verbose mempool entry from getrawmempool(true). */
export interface VerboseMempoolEntry {
  vsize: number
  weight?: number
  fee?: number
  fees?: { base: number }
  time?: number
}

/** Options for building a block template from the mempool. */
export interface ProcessMempoolBlockOptions {
  tipHeight: number
  maxBlockWeight?: number
}

/** Snapshot of a block for localStorage history (overview + detail). */
export interface BlockSnapshot {
  height: number
  hash: string
  timestamp: number
  size: number
  weight: number
  txCount: number
  feeSpanMin: number
  feeSpanMax: number
  medianFeeRate: number
  totalFeesBTC: number
  totalValueBTC: number
  subsidyPlusFeesBTC: number
  /** Pool identifier (for icon lookup). */
  miner?: string
  /** Pool display name. */
  minerName?: string
}

function hexToAscii(hex: string): string {
  try {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex
    let out = ''
    for (let i = 0; i < clean.length - 1; i += 2) {
      const byte = parseInt(clean.slice(i, i + 2), 16)
      // keep printable ASCII, replace others with space to preserve separators
      out += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ' '
    }
    return out
  } catch {
    return ''
  }
}

/**
 * Best-effort miner/pool attribution from coinbase script.
 * Bitcoin Core does not provide pool attribution directly; this is heuristic.
 * Returns { name, identifier } for display and icon lookup (e.g. in localStorage).
 */
function inferMinerFromCoinbase(coinbaseHex?: string): { name: string; identifier: string } | undefined {
  if (!coinbaseHex) return undefined
  const asciiRaw = hexToAscii(coinbaseHex)
  // Normalize whitespace because coinbase decoding replaces non-printables with spaces.
  const asciiNorm = asciiRaw.replace(/\s+/g, ' ').trim().toLowerCase()

  const pools = (poolsData as { pools: Array<{ identifier: string; signatures: string[]; name: string }> }).pools
  for (const pool of pools) {
    for (const sig of pool.signatures) {
      const normalizedSig = sig.replaceAll('/', '').replace(/\s+/g, ' ').trim().toLowerCase()
      if (!normalizedSig) continue
      if (asciiNorm.includes(normalizedSig)) {
        return { name: pool.name, identifier: pool.identifier }
      }
    }
  }

  // Fallback: persist a readable tag even if we don't recognize it yet.
  const cleaned = asciiRaw.replace(/\s+/g, ' ').trim()
  if (!cleaned) return undefined
  // Plausible: alphanumeric, spaces, hyphens, slashes; no backticks or control chars; 2–40 chars.
  const plausible = /^[\w\s\-/]{2,40}$/.test(cleaned) && !/`|[\x00-\x1f]/.test(cleaned)
  if (!plausible) return undefined
  const tag = cleaned.length > 40 ? `${cleaned.slice(0, 40)}…` : cleaned
  const identifier = tag.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (identifier.length < 2) return undefined
  return { name: tag, identifier }
}

/**
 * Build a BlockSnapshot from a ProcessedBlock for storage/display.
 */
export function buildBlockSnapshot(block: ProcessedBlock): BlockSnapshot {
  const { transactions } = block
  const feeRates = transactions.map(tx => tx.feeRate).filter(r => r > 0)
  const sortedRates = [...feeRates].sort((a, b) => a - b)
  const feeSpanMin = sortedRates[0] ?? 0
  const feeSpanMax = sortedRates[sortedRates.length - 1] ?? 0
  const medianFeeRate =
    sortedRates.length === 0
      ? 0
      : sortedRates[Math.floor(sortedRates.length / 2)] ?? 0
  const totalFeesBTC = transactions.reduce((sum, tx) => sum + tx.fee, 0)
  const totalValueBTC = transactions.reduce((sum, tx) => sum + tx.value, 0)
  const subsidyPlusFeesBTC = transactions[0]?.value ?? 0

  return {
    height: block.height,
    hash: block.hash,
    timestamp: block.timestamp,
    size: block.size,
    weight: block.weight,
    txCount: block.txCount,
    feeSpanMin,
    feeSpanMax,
    medianFeeRate,
    totalFeesBTC,
    totalValueBTC,
    subsidyPlusFeesBTC,
    miner: block.miner,
    minerName: block.minerName,
  }
}

/**
 * Calculate fee rate in sat/vB from transaction data.
 */
export function calculateTransactionFeeRate(tx: {
  vsize: number
  fee?: number
}): number {
  if (!tx.fee || tx.vsize === 0) {
    return 0
  }
  // Fee is in BTC, convert to sats and divide by vsize
  return Math.round((tx.fee * 100000000) / tx.vsize)
}

/**
 * Get transaction fee in BTC when it can be determined reliably.
 * Returns the RPC `fee` when present and non-negative, or (inputs - outputs) only when
 * every non-coinbase input has prevout data. Otherwise returns null (e.g. pruned node
 * where fee/prevout are omitted).
 */
export function getTransactionFee(
  vin: Array<{ prevout?: { value?: number }; coinbase?: string }> | undefined,
  vout: Array<{ value?: number }> | undefined,
  rpcFee?: number
): number | null {
  if (typeof rpcFee === 'number' && rpcFee >= 0) {
    return rpcFee
  }
  if (!vin?.length || !vout?.length) return null
  // Coinbase: no fee to show
  if (vin[0].coinbase) return null
  const totalInput = vin.reduce((sum, input) => {
    if (input.prevout && typeof input.prevout.value === 'number') return sum + input.prevout.value
    return sum
  }, 0)
  const totalOutput = vout.reduce((sum, o) => sum + (o.value ?? 0), 0)
  // Only use computed fee if we had prevout for every input (no missing data)
  const nonCoinbaseInputs = vin.filter((i) => !i.coinbase)
  const inputsWithPrevout = vin.filter((i) => i.prevout && typeof i.prevout.value === 'number')
  if (nonCoinbaseInputs.length !== inputsWithPrevout.length) return null
  const fee = totalInput - totalOutput
  return fee >= 0 ? fee : null
}

/** Max plausible BTC (supply cap). Values above this are treated as satoshis. */
const MAX_PLAUSIBLE_BTC = 21e6

/**
 * Normalize value to BTC: if value is impossibly large for BTC, assume it was in satoshis.
 */
function normalizeValueToBtc(value: number, _txid?: string): number {
  if (value <= MAX_PLAUSIBLE_BTC) {
    return value
  }
  return value / 1e8
}

/**
 * Calculate total input value from transaction inputs.
 * This represents the total economic value being moved in the transaction.
 * For coinbase transactions (which have no inputs), returns the output value.
 */
export function calculateTransactionValue(
  vin: Array<{ prevout?: { value?: number }; coinbase?: string }> | undefined,
  vout: Array<{ value?: number }> | undefined,
  fee?: number,
  txid?: string // Add txid for debugging
): number {
  // For coinbase transactions (first tx in block, has coinbase field instead of inputs)
  // Use output value (block reward + fees)
  if (vin && vin.length > 0 && vin[0].coinbase) {
    if (!vout || vout.length === 0) {
      return 0
    }
    const coinbaseValue = vout.reduce((sum, output) => sum + (output.value || 0), 0)
    return normalizeValueToBtc(coinbaseValue)
  }

  // For regular transactions, calculate from inputs (total value being moved)
  // This is more accurate than summing outputs, which includes change
  if (vin && vin.length > 0) {
    const inputValues: number[] = []
    const inputValue = vin.reduce((sum, input) => {
      if (input.prevout && input.prevout.value !== undefined) {
        inputValues.push(input.prevout.value)
        return sum + input.prevout.value
      }
      return sum
    }, 0)
    
    // If we have input values, use them (more accurate)
    if (inputValue > 0) {
      // Normalize: if value is impossibly large for BTC (e.g. > 21M), assume RPC returned satoshis
      return normalizeValueToBtc(inputValue, txid)
    }
  }

  // Fallback: if inputs aren't available (shouldn't happen with verbosity 3, but handle gracefully),
  // use the largest output value as approximation
  // Note: With verbosity 3, prevout data should be available for unpruned blocks
  if (vout && vout.length > 0) {
    const outputValues = vout.map(output => output.value || 0)
    const largestOutput = Math.max(...outputValues)
    return normalizeValueToBtc(largestOutput, txid)
  }

  return 0
}

/**
 * Process raw block data from RPC into visualization format.
 * getblock (verbosity 2/3) returns size (bytes) and weight (WU).
 */
export function processBlockData(block: {
  height: number
  hash: string
  time: number
  size: number
  weight?: number
  tx: Array<{
    txid: string
    vsize: number
    fee?: number
    vin?: Array<{ prevout?: { value?: number }; coinbase?: string }>
    vout: Array<{ value?: number }>
  }>
}): ProcessedBlock {
  const coinbaseHex = block.tx?.[0]?.vin?.[0]?.coinbase
  const minerInfo = inferMinerFromCoinbase(coinbaseHex)

  const transactions: ProcessedTransaction[] = block.tx.map((tx) => {
    const feeRate = calculateTransactionFeeRate(tx)
    const value = calculateTransactionValue(tx.vin, tx.vout, tx.fee, tx.txid)

    return {
      txid: tx.txid,
      vsize: tx.vsize,
      fee: tx.fee || 0,
      feeRate,
      value,
    }
  })

  return {
    height: block.height,
    hash: block.hash,
    timestamp: block.time,
    size: block.size,
    weight: block.weight ?? 0,
    txCount: block.tx.length,
    miner: minerInfo?.identifier,
    minerName: minerInfo?.name,
    transactions,
  }
}

const DEFAULT_MAX_BLOCK_WEIGHT = 4_000_000

/**
 * Build a block template from verbose mempool: sort by fee rate, fill up to maxBlockWeight.
 * Returns a ProcessedBlock-like object with hash "pending", no miner, and transactions with value 0.
 */
export function processMempoolBlockData(
  verboseMempool: Record<string, VerboseMempoolEntry>,
  options: ProcessMempoolBlockOptions
): ProcessedBlock {
  const { tipHeight, maxBlockWeight = DEFAULT_MAX_BLOCK_WEIGHT } = options

  const entries = Object.entries(verboseMempool).map(([txid, entry]) => {
    const feeBtc = entry.fee ?? entry.fees?.base ?? 0
    const vsize = entry.vsize || 1
    const feeRate = vsize > 0 ? Math.round((feeBtc * 100_000_000) / vsize) : 0
    const weight = entry.weight ?? vsize * 4
    return { txid, vsize, fee: feeBtc, feeRate, weight }
  })

  entries.sort((a, b) => b.feeRate - a.feeRate)

  let totalWeight = 0
  const selected: Array<{ txid: string; vsize: number; fee: number; feeRate: number }> = []
  for (const e of entries) {
    if (totalWeight + e.weight > maxBlockWeight) continue
    totalWeight += e.weight
    selected.push({ txid: e.txid, vsize: e.vsize, fee: e.fee, feeRate: e.feeRate })
  }

  const transactions: ProcessedTransaction[] = selected.map((t) => ({
    txid: t.txid,
    vsize: t.vsize,
    fee: t.fee,
    feeRate: t.feeRate,
    value: 0,
  }))

  const size = selected.reduce((s, t) => s + t.vsize, 0)

  return {
    height: tipHeight + 1,
    hash: 'pending',
    timestamp: 0,
    size,
    weight: totalWeight,
    txCount: selected.length,
    transactions,
  }
}

/**
 * Format block size for display.
 */
export function formatBlockSize(bytes: number): string {
  if (bytes >= 1e6) {
    return `${(bytes / 1e6).toFixed(2)} MB`
  }
  if (bytes >= 1e3) {
    return `${(bytes / 1e3).toFixed(0)} KB`
  }
  return `${bytes} B`
}

/**
 * Format block weight for display (WU → MWU).
 */
export function formatBlockWeight(weightWu: number): string {
  if (weightWu >= 1e6) {
    return `${(weightWu / 1e6).toFixed(2)} MWU`
  }
  if (weightWu >= 1e3) {
    return `${(weightWu / 1e3).toFixed(1)} KWU`
  }
  return `${weightWu} WU`
}

/**
 * Format timestamp to readable date string.
 */
export function formatBlockTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })
}

/**
 * Truncate hash for display (first 8...last 8 characters).
 * Returns fallback when hash is undefined/null (e.g. coinbase inputs have no txid).
 */
export function truncateHash(hash: string | undefined | null, startLength = 8, endLength = 8): string {
  if (hash == null || typeof hash !== 'string') {
    return '—'
  }
  if (hash.length <= startLength + endLength) {
    return hash
  }
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`
}

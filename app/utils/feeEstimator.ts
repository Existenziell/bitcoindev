/**
 * Helpers for the Fee Estimator tool.
 * Pure functions for parsing vBytes and converting estimatesmartfee results.
 */

/**
 * Parse vBytes from user input. Returns integer in [1, 1_000_000] or null.
 */
export function parseVBytes(input: string): number | null {
  const n = parseInt(input.trim(), 10)
  if (Number.isNaN(n) || n < 1 || n > 1_000_000) return null
  return n
}

export interface EstimatesmartfeeResult {
  feerate?: number
  fee_rate?: number
}

/**
 * Convert estimatesmartfee result to sat/vB.
 * - fee_rate (number): newer Bitcoin Core returns sat/vB directly (use if in 1–1e6 range).
 * - feerate (number): legacy BTC per kvB; sat/vB = feerate * 100_000_000 / 1000.
 */
export function toSatPerVb(result: EstimatesmartfeeResult | undefined): number | null {
  if (!result) return null
  const feeRate = result.fee_rate
  const feerate = result.feerate
  if (typeof feeRate === 'number' && feeRate >= 1 && feeRate <= 1_000_000) {
    return Math.round(feeRate)
  }
  if (typeof feerate === 'number' && feerate > 0) {
    return Math.round((feerate * 100_000_000) / 1000)
  }
  return null
}

import { describe, it, expect } from 'vitest'
import { parseVBytes, toSatPerVb } from '@/app/utils/feeEstimator'

describe('parseVBytes', () => {
  it('returns number for valid input in range', () => {
    expect(parseVBytes('140')).toBe(140)
    expect(parseVBytes('1')).toBe(1)
    expect(parseVBytes('1000000')).toBe(1_000_000)
    expect(parseVBytes('  250  ')).toBe(250)
  })

  it('returns null for empty or whitespace', () => {
    expect(parseVBytes('')).toBe(null)
    expect(parseVBytes('   ')).toBe(null)
  })

  it('returns null for out of range', () => {
    expect(parseVBytes('0')).toBe(null)
    expect(parseVBytes('-1')).toBe(null)
    expect(parseVBytes('1000001')).toBe(null)
  })

  it('returns null for non-numeric input', () => {
    expect(parseVBytes('abc')).toBe(null)
    expect(parseVBytes('14.5')).toBe(14) // parseInt truncates; 14 is in range
  })
})

describe('toSatPerVb', () => {
  it('returns null for undefined or empty result', () => {
    expect(toSatPerVb(undefined)).toBe(null)
    expect(toSatPerVb({})).toBe(null)
  })

  it('uses fee_rate when in 1–1e6 range (sat/vB)', () => {
    expect(toSatPerVb({ fee_rate: 5 })).toBe(5)
    expect(toSatPerVb({ fee_rate: 1 })).toBe(1)
    expect(toSatPerVb({ fee_rate: 1_000_000 })).toBe(1_000_000)
    expect(toSatPerVb({ fee_rate: 10.7 })).toBe(11)
  })

  it('falls back to feerate (BTC/kvB) when fee_rate missing or out of range', () => {
    // feerate in BTC/kvB: sat/vB = feerate * 100_000_000 / 1000
    // 0.00001 BTC/kvB = 1 sat/vB
    expect(toSatPerVb({ feerate: 0.00001 })).toBe(1)
    expect(toSatPerVb({ feerate: 0.00002 })).toBe(2)
    expect(toSatPerVb({ fee_rate: 0, feerate: 0.00001 })).toBe(1)
  })

  it('returns null when both fee_rate and feerate invalid', () => {
    expect(toSatPerVb({ fee_rate: 0 })).toBe(null)
    expect(toSatPerVb({ fee_rate: -1 })).toBe(null)
    expect(toSatPerVb({ feerate: 0 })).toBe(null)
    expect(toSatPerVb({ feerate: -1 })).toBe(null)
  })
})

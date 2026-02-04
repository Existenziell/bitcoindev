import { describe, it, expect } from 'vitest'
import {
  buildBlockSnapshot,
  calculateTransactionFeeRate,
  getTransactionFee,
  calculateTransactionValue,
  processBlockData,
  processMempoolBlockData,
  formatBlockSize,
  formatBlockWeight,
  formatBlockTimestamp,
  truncateHash,
  type ProcessedBlock,
  type VerboseMempoolEntry,
} from '@/app/utils/blockUtils'

describe('blockUtils', () => {
  describe('calculateTransactionFeeRate', () => {
    it('returns 0 when fee is missing', () => {
      expect(calculateTransactionFeeRate({ vsize: 100 })).toBe(0)
    })

    it('returns 0 when vsize is 0', () => {
      expect(calculateTransactionFeeRate({ vsize: 0, fee: 0.0001 })).toBe(0)
    })

    it('computes sat/vB from fee in BTC and vsize', () => {
      // 0.00001 BTC = 1000 sats, 100 vB -> 10 sat/vB
      expect(calculateTransactionFeeRate({ vsize: 100, fee: 0.00001 })).toBe(10)
    })
  })

  describe('getTransactionFee', () => {
    it('returns rpcFee when provided and non-negative', () => {
      expect(getTransactionFee(undefined, undefined, 0.00005)).toBe(0.00005)
    })

    it('returns null for coinbase transaction', () => {
      const vin = [{ coinbase: '03bebb08' }]
      const vout = [{ value: 6.25 }]
      expect(getTransactionFee(vin, vout)).toBeNull()
    })

    it('returns null when vin or vout empty', () => {
      expect(getTransactionFee([], [{ value: 1 }])).toBeNull()
      expect(getTransactionFee([{ prevout: { value: 1 } }], [])).toBeNull()
    })

    it('computes fee from inputs minus outputs when prevout present', () => {
      const vin = [
        { prevout: { value: 1 } },
        { prevout: { value: 0.5 } },
      ]
      const vout = [{ value: 1.4 }]
      expect(getTransactionFee(vin, vout)).toBeCloseTo(0.1, 10)
    })

    it('returns null when some inputs lack prevout', () => {
      const vin = [
        { prevout: { value: 1 } },
        {}, // no prevout
      ]
      const vout = [{ value: 0.9 }]
      expect(getTransactionFee(vin, vout)).toBeNull()
    })
  })

  describe('calculateTransactionValue', () => {
    it('returns coinbase output value for coinbase tx', () => {
      const vin = [{ coinbase: '03' }]
      const vout = [{ value: 6.25 }, { value: 0.001 }]
      expect(calculateTransactionValue(vin, vout)).toBe(6.251)
    })

    it('returns 0 for coinbase with no vout', () => {
      const vin = [{ coinbase: '03' }]
      expect(calculateTransactionValue(vin, [])).toBe(0)
    })

    it('returns sum of input values for normal tx', () => {
      const vin = [
        { prevout: { value: 1 } },
        { prevout: { value: 0.5 } },
      ]
      const vout = [{ value: 1.4 }]
      expect(calculateTransactionValue(vin, vout)).toBe(1.5)
    })

    it('normalizes large values as satoshis', () => {
      const vin = [{ prevout: { value: 100_000_000 } }] // 1 BTC in sats
      const vout = [{ value: 0.99 }]
      expect(calculateTransactionValue(vin, vout)).toBe(1)
    })
  })

  describe('buildBlockSnapshot', () => {
    it('computes fee span and median from transactions', () => {
      const block: ProcessedBlock = {
        height: 100,
        hash: 'abc',
        timestamp: 1700000000,
        size: 1000000,
        weight: 4000000,
        txCount: 3,
        transactions: [
          { txid: 'a', vsize: 100, fee: 0.0001, feeRate: 10, value: 1 },
          { txid: 'b', vsize: 200, fee: 0.0004, feeRate: 20, value: 2 },
          { txid: 'c', vsize: 100, fee: 0.0003, feeRate: 30, value: 0 },
        ],
      }
      const snap = buildBlockSnapshot(block)
      expect(snap.feeSpanMin).toBe(10)
      expect(snap.feeSpanMax).toBe(30)
      expect(snap.medianFeeRate).toBe(20)
      expect(snap.totalFeesBTC).toBeCloseTo(0.0008, 10)
      expect(snap.totalValueBTC).toBe(3)
      expect(snap.subsidyPlusFeesBTC).toBe(1)
    })

    it('handles empty transactions', () => {
      const block: ProcessedBlock = {
        height: 1,
        hash: 'h',
        timestamp: 0,
        size: 0,
        weight: 0,
        txCount: 0,
        transactions: [],
      }
      const snap = buildBlockSnapshot(block)
      expect(snap.feeSpanMin).toBe(0)
      expect(snap.feeSpanMax).toBe(0)
      expect(snap.medianFeeRate).toBe(0)
    })
  })

  describe('processBlockData', () => {
    it('maps raw block to ProcessedBlock with miner from coinbase', () => {
      const raw = {
        height: 100,
        hash: 'blockhash',
        time: 1700000000,
        size: 1500000,
        weight: 4000000,
        tx: [
          {
            txid: 'coinbase',
            vsize: 200,
            vin: [{ coinbase: '036b6565626208' }], // "beebb" in hex
            vout: [{ value: 6.25 }],
          },
          {
            txid: 'tx2',
            vsize: 250,
            fee: 0.00002,
            vin: [{ prevout: { value: 0.1 } }],
            vout: [{ value: 0.099 }],
          },
        ],
      }
      const processed = processBlockData(raw)
      expect(processed.height).toBe(100)
      expect(processed.hash).toBe('blockhash')
      expect(processed.txCount).toBe(2)
      expect(processed.transactions).toHaveLength(2)
      expect(processed.transactions[0].value).toBe(6.25)
      expect(processed.transactions[1].feeRate).toBe(8) // 0.00002 BTC / 250 vB -> 8 sat/vB
    })
  })

  describe('processMempoolBlockData', () => {
    it('returns pending block with transactions sorted by fee rate', () => {
      const mempool: Record<string, VerboseMempoolEntry> = {
        tx1: { vsize: 100, fee: 0.00001 },
        tx2: { vsize: 200, fee: 0.00006 },
        tx3: { vsize: 100, fee: 0.00002 },
      }
      const result = processMempoolBlockData(mempool, { tipHeight: 100 })
      expect(result.hash).toBe('pending')
      expect(result.height).toBe(101)
      expect(result.txCount).toBeGreaterThan(0)
      expect(result.transactions[0].feeRate).toBeGreaterThanOrEqual(result.transactions[1]?.feeRate ?? 0)
    })

    it('respects maxBlockWeight', () => {
      const mempool: Record<string, VerboseMempoolEntry> = {
        big: { vsize: 2_000_000, fee: 0.01 },
      }
      const result = processMempoolBlockData(mempool, {
        tipHeight: 1,
        maxBlockWeight: 1_000_000,
      })
      expect(result.txCount).toBe(0)
    })
  })

  describe('formatBlockSize', () => {
    it('formats bytes as B, KB, MB', () => {
      expect(formatBlockSize(500)).toBe('500 B')
      expect(formatBlockSize(1500)).toBe('2 KB')
      expect(formatBlockSize(1_500_000)).toBe('1.50 MB')
    })
  })

  describe('formatBlockWeight', () => {
    it('formats WU as WU, KWU, MWU', () => {
      expect(formatBlockWeight(500)).toBe('500 WU')
      expect(formatBlockWeight(1500)).toBe('1.5 KWU')
      expect(formatBlockWeight(1_500_000)).toBe('1.50 MWU')
    })
  })

  describe('formatBlockTimestamp', () => {
    it('returns locale date string', () => {
      const s = formatBlockTimestamp(1700000000)
      expect(s).toMatch(/\d/)
      expect(s.length).toBeGreaterThan(5)
    })
  })

  describe('truncateHash', () => {
    it('returns full hash when short', () => {
      expect(truncateHash('abc')).toBe('abc')
    })

    it('truncates with default 8...8', () => {
      const hash = '0000000000000000000123456789abcdef0123456789abcdef01234567'
      expect(truncateHash(hash)).toBe('00000000...01234567')
    })

    it('respects custom start and end length', () => {
      const hash = '1234567890abcdef'
      expect(truncateHash(hash, 4, 4)).toBe('1234...cdef')
    })
  })
})

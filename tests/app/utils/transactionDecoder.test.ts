import { describe, it, expect } from 'vitest'
import { decodeRawTransaction } from '@/app/utils/transactionDecoder'

describe('decodeRawTransaction', () => {
  it('empty input → error message, no inputs/outputs', () => {
    const r = decodeRawTransaction('')
    expect(r.error).toBe('Enter raw transaction hex')
    expect(r.inputs).toHaveLength(0)
    expect(r.outputs).toHaveLength(0)
    expect(r.rawHexLength).toBe(0)
  })

  it('invalid hex (odd length) → error', () => {
    const r = decodeRawTransaction('010000000') // 9 chars = odd
    expect(r.error).toMatch(/even number/)
  })

  it('invalid hex (non-hex char) → error', () => {
    const r = decodeRawTransaction('0100000000000000000g')
    expect(r.error).toMatch(/0-9 and a-f/)
  })

  it('too short (less than 10 bytes) → error', () => {
    const r = decodeRawTransaction('01000000')
    expect(r.error).toMatch(/too short/i)
  })

  it('minimal valid tx: version 1, 0 inputs, 0 outputs, locktime 0', () => {
    // 4 byte version (1 LE) + 1 byte input count (0) + 1 byte output count (0) + 4 byte locktime (0)
    const hex = '01000000000000000000'
    const r = decodeRawTransaction(hex)
    expect(r.error).toBeUndefined()
    expect(r.version).toBe(1)
    expect(r.segwit).toBe(false)
    expect(r.inputs).toHaveLength(0)
    expect(r.outputs).toHaveLength(0)
    expect(r.locktime).toBe(0)
    expect(r.rawHexLength).toBe(20)
  })

  it('minimal 1-in-1-out tx parses version, inputs, outputs, locktime', () => {
    // Real minimal 1 input 1 output tx (simplified): version(4) + segwit no + inCount=1 + prevout(36) + scriptSig len 0(1) + sequence(4) + outCount=1 + value(8) + scriptPubKey len(1) + scriptPubKey(22 for P2WPKH) + locktime(4)
    // We use a known good minimal tx hex - 1 input (coinbase-like prevout 00..00), scriptSig length 0, sequence ffffffff, 1 output value 0, scriptPubKey 16 bytes (OP_0 + 14 bytes push - minimal)
    const hex = [
      '01000000', // version 1
      '01', // 1 input
      '000000000000000000000000000000000000000000000000000000000000000000000000', // prevout 36 bytes: 32 txid + 4 vout
      '00', // scriptSig len 0
      'ffffffff', // sequence
      '01', // 1 output
      '0000000000000000', // value 0 (8 bytes LE)
      '16', // scriptPubKey length 22
      '0014' + '00'.repeat(20), // OP_0 PUSH20 (22 bytes)
      '00000000', // locktime
    ].join('')
    const r = decodeRawTransaction(hex)
    expect(r.error).toBeUndefined()
    expect(r.version).toBe(1)
    expect(r.inputs).toHaveLength(1)
    expect(r.inputs![0].vout).toBe(0)
    expect(r.inputs![0].scriptSigLength).toBe(0)
    // readU32LE returns signed int32, so 0xffffffff is -1
    expect(r.inputs![0].sequence).toBe(-1)
    expect(r.outputs).toHaveLength(1)
    expect(r.outputs![0].valueSats).toBe(0n)
    expect(r.outputs![0].scriptPubKeyLength).toBe(22)
    expect(r.locktime).toBe(0)
  })
})

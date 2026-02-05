/**
 * Decode raw Bitcoin transaction hex (client-side).
 * Used by the Transaction Decoder tool. Handles non-SegWit and SegWit (witness) txs.
 */

const HEX_RE = /^[0-9a-fA-F\s]*$/

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '')
  if (clean.length % 2 !== 0) throw new Error('Hex must have an even number of characters')
  if (!HEX_RE.test(clean)) throw new Error('Hex may only contain 0-9 and a-f')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function readU32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]! |
    (bytes[offset + 1]! << 8) |
    (bytes[offset + 2]! << 16) |
    (bytes[offset + 3]! << 24)
  )
}

function readU64LE(bytes: Uint8Array, offset: number): bigint {
  const lo = readU32LE(bytes, offset)
  const hi = readU32LE(bytes, offset + 4)
  return BigInt(lo) | (BigInt(hi) << BigInt(32))
}

function readVarInt(bytes: Uint8Array, offset: number): { value: number; next: number } {
  const v = bytes[offset]!
  if (v < 0xfd) return { value: v, next: offset + 1 }
  if (v === 0xfd) {
    const value = bytes[offset + 1]! | (bytes[offset + 2]! << 8)
    return { value, next: offset + 3 }
  }
  if (v === 0xfe) {
    const value = readU32LE(bytes, offset + 1)
    return { value, next: offset + 5 }
  }
  throw new Error('VarInt overflow (0xff)')
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface DecodedInput {
  txid: string
  vout: number
  scriptSigHex: string
  scriptSigLength: number
  sequence: number
}

export interface DecodedOutput {
  valueSats: bigint
  valueBtc: string
  scriptPubKeyHex: string
  scriptPubKeyLength: number
}

export interface TxSegment {
  label: string
  start: number
  end: number
}

export interface DecodedTx {
  version: number
  segwit: boolean
  inputs: DecodedInput[]
  outputs: DecodedOutput[]
  locktime: number
  rawHexLength: number
  segments?: TxSegment[]
  error?: string
}

export function decodeRawTransaction(hex: string): DecodedTx {
  const trimmed = hex.trim()
  if (trimmed.length === 0) {
    return {
      version: 0,
      segwit: false,
      inputs: [],
      outputs: [],
      locktime: 0,
      rawHexLength: 0,
      error: 'Enter raw transaction hex',
    }
  }
  let bytes: Uint8Array
  try {
    bytes = hexToBytes(trimmed)
  } catch (e) {
    return {
      version: 0,
      segwit: false,
      inputs: [],
      outputs: [],
      locktime: 0,
      rawHexLength: 0,
      error: (e as Error).message,
    }
  }
  if (bytes.length < 10) {
    return {
      version: 0,
      segwit: false,
      inputs: [],
      outputs: [],
      locktime: 0,
      rawHexLength: bytes.length * 2,
      error: 'Transaction too short',
    }
  }
  const version = readU32LE(bytes, 0)
  let pos = 4
  const segwit = bytes[4] === 0 && bytes[5] !== 0
  if (segwit) pos = 6

  const inCount = readVarInt(bytes, pos)
  pos = inCount.next
  const inputsStart = pos
  const inputs: DecodedInput[] = []
  for (let i = 0; i < inCount.value; i++) {
    if (pos + 36 > bytes.length) {
      return {
        version,
        segwit,
        inputs,
        outputs: [],
        locktime: 0,
        rawHexLength: bytes.length * 2,
        error: `Input ${i + 1}: not enough bytes for outpoint`,
      }
    }
    const txidBytes = bytes.slice(pos, pos + 32)
    const txidReversed = Array.from(txidBytes).reverse()
    const txid = Array.from(txidReversed)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const vout = readU32LE(bytes, pos + 32)
    pos += 36
    const scriptLen = readVarInt(bytes, pos)
    pos = scriptLen.next
    if (pos + scriptLen.value + 4 > bytes.length) {
      return {
        version,
        segwit,
        inputs,
        outputs: [],
        locktime: 0,
        rawHexLength: bytes.length * 2,
        error: `Input ${i + 1}: scriptSig extends past end`,
      }
    }
    const scriptSig = bytes.slice(pos, pos + scriptLen.value)
    pos += scriptLen.value
    const sequence = readU32LE(bytes, pos)
    pos += 4
    inputs.push({
      txid,
      vout,
      scriptSigHex: bytesToHex(scriptSig),
      scriptSigLength: scriptLen.value,
      sequence,
    })
  }
  const inputsEnd = pos

  const outCount = readVarInt(bytes, pos)
  pos = outCount.next
  const outputsStart = pos
  const outputs: DecodedOutput[] = []
  for (let j = 0; j < outCount.value; j++) {
    if (pos + 8 > bytes.length) {
      return {
        version,
        segwit,
        inputs,
        outputs,
        locktime: 0,
        rawHexLength: bytes.length * 2,
        error: `Output ${j + 1}: not enough bytes for value`,
      }
    }
    const valueSats = readU64LE(bytes, pos)
    pos += 8
    const scriptLen = readVarInt(bytes, pos)
    pos = scriptLen.next
    if (pos + scriptLen.value + 4 > bytes.length) {
      return {
        version,
        segwit,
        inputs,
        outputs,
        locktime: 0,
        rawHexLength: bytes.length * 2,
        error: `Output ${j + 1}: scriptPubKey extends past end`,
      }
    }
    const scriptPubKey = bytes.slice(pos, pos + scriptLen.value)
    pos += scriptLen.value
    const valueBtc = (Number(valueSats) / 100_000_000).toFixed(8)
    outputs.push({
      valueSats,
      valueBtc,
      scriptPubKeyHex: bytesToHex(scriptPubKey),
      scriptPubKeyLength: scriptLen.value,
    })
  }
  const outputsEnd = pos

  let locktime: number
  let witnessStart: number
  let witnessEnd: number

  if (segwit) {
    witnessStart = pos
    for (let i = 0; i < inCount.value; i++) {
      const stackCount = readVarInt(bytes, pos)
      pos = stackCount.next
      for (let k = 0; k < stackCount.value; k++) {
        const itemLen = readVarInt(bytes, pos)
        pos = itemLen.next
        if (pos + itemLen.value > bytes.length) {
          return {
            version,
            segwit,
            inputs,
            outputs,
            locktime: 0,
            rawHexLength: bytes.length * 2,
            error: 'Witness data extends past end',
          }
        }
        pos += itemLen.value
      }
    }
    witnessEnd = pos
    if (pos + 4 > bytes.length) {
      return {
        version,
        segwit,
        inputs,
        outputs,
        locktime: 0,
        rawHexLength: bytes.length * 2,
        error: 'Not enough bytes for locktime',
      }
    }
    locktime = readU32LE(bytes, bytes.length - 4)
  } else {
    if (pos + 4 > bytes.length) {
      return {
        version,
        segwit,
        inputs,
        outputs,
        locktime: 0,
        rawHexLength: bytes.length * 2,
        error: 'Not enough bytes for locktime',
      }
    }
    locktime = readU32LE(bytes, pos)
  }

  const segments: TxSegment[] = [
    { label: 'Version', start: 0, end: 4 },
    ...(segwit ? [{ label: 'SegWit marker', start: 4, end: 6 }] as TxSegment[] : []),
    { label: 'Inputs', start: inputsStart, end: inputsEnd },
    { label: 'Outputs', start: outputsStart, end: outputsEnd },
    ...(segwit ? [{ label: 'Witness', start: witnessStart!, end: witnessEnd! }] as TxSegment[] : []),
    { label: 'Locktime', start: bytes.length - 4, end: bytes.length },
  ]

  return {
    version,
    segwit,
    inputs,
    outputs,
    locktime,
    rawHexLength: bytes.length * 2,
    segments,
  }
}

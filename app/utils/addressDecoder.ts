/**
 * Decode and verify Bitcoin addresses (Base58Check and Bech32/Bech32m).
 * Used by the Address Decoder tool. No private keys or derivation.
 */

import { sha256 } from '@noble/hashes/sha2.js'

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_CONST = 1
const BECH32M_CONST = 0x2bc830a3

function base58Decode(input: string): Uint8Array {
  const trimmed = input.trim()
  if (trimmed.length === 0) return new Uint8Array(0)
  let num = BigInt(0)
  for (let i = 0; i < trimmed.length; i++) {
    const idx = BASE58_ALPHABET.indexOf(trimmed[i])
    if (idx === -1) throw new Error(`Invalid Base58 character at position ${i}`)
    num = num * BigInt(58) + BigInt(idx)
  }
  const hex = num.toString(16)
  const pad = hex.length % 2 ? '0' + hex : hex
  const bytes = new Uint8Array(pad.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(pad.slice(i * 2, i * 2 + 2), 16)
  }
  let leadingZeros = 0
  for (let i = 0; i < trimmed.length && trimmed[i] === '1'; i++) leadingZeros++
  const result = new Uint8Array(leadingZeros + bytes.length)
  result.set(bytes, leadingZeros)
  return result
}

function hash256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data))
}

export interface Base58CheckResult {
  valid: boolean
  versionByte: number
  payloadHex: string
  payloadLength: number
  checksumHex: string
  error?: string
}

export function decodeBase58Check(address: string): Base58CheckResult {
  const trimmed = address.trim()
  if (trimmed.length === 0) {
    return { valid: false, versionByte: 0, payloadHex: '', payloadLength: 0, checksumHex: '', error: 'Empty input' }
  }
  try {
    const decoded = base58Decode(trimmed)
    if (decoded.length < 5) {
      return {
        valid: false,
        versionByte: decoded[0] ?? 0,
        payloadHex: '',
        payloadLength: 0,
        checksumHex: '',
        error: 'Too short for Base58Check (need at least version + 20 bytes + 4 byte checksum)',
      }
    }
    const payload = decoded.slice(0, -4)
    const checksum = decoded.slice(-4)
    const expectedChecksum = hash256(payload).slice(0, 4)
    const valid =
      expectedChecksum[0] === checksum[0] &&
      expectedChecksum[1] === checksum[1] &&
      expectedChecksum[2] === checksum[2] &&
      expectedChecksum[3] === checksum[3]
    return {
      valid,
      versionByte: payload[0] ?? 0,
      payloadHex: Array.from(payload.slice(1))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      payloadLength: payload.length - 1,
      checksumHex: Array.from(checksum)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      error: valid ? undefined : 'Checksum mismatch',
    }
  } catch (e) {
    return {
      valid: false,
      versionByte: 0,
      payloadHex: '',
      payloadLength: 0,
      checksumHex: '',
      error: (e as Error).message,
    }
  }
}

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let chk = 1
  for (const v of values) {
    const b = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ v
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i]
    }
  }
  return chk
}

function bech32HrpExpand(hrp: string): number[] {
  const out: number[] = []
  for (let i = 0; i < hrp.length; i++) {
    out.push(hrp.charCodeAt(i) >> 5)
  }
  out.push(0)
  for (let i = 0; i < hrp.length; i++) {
    out.push(hrp.charCodeAt(i) & 31)
  }
  return out
}

export interface Bech32Result {
  valid: boolean
  encoding: 'bech32' | 'bech32m'
  hrp: string
  witnessVersion: number
  dataHex: string
  dataLength: number
  error?: string
}

export function decodeBech32(address: string): Bech32Result {
  const trimmed = address.trim().toLowerCase()
  if (trimmed.length === 0) {
    return {
      valid: false,
      encoding: 'bech32',
      hrp: '',
      witnessVersion: 0,
      dataHex: '',
      dataLength: 0,
      error: 'Empty input',
    }
  }
  const sep = trimmed.lastIndexOf('1')
  if (sep < 1 || sep + 7 > trimmed.length) {
    return {
      valid: false,
      encoding: 'bech32',
      hrp: '',
      witnessVersion: 0,
      dataHex: '',
      dataLength: 0,
      error: "Missing or invalid separator '1' (need HRP and at least 6 data chars for checksum)",
    }
  }
  const hrp = trimmed.slice(0, sep)
  const dataPart = trimmed.slice(sep + 1)
  const revMap = new Map<string, number>()
  BECH32_ALPHABET.split('').forEach((c, i) => revMap.set(c, i))
  const values: number[] = []
  for (let i = 0; i < dataPart.length; i++) {
    const v = revMap.get(dataPart[i])
    if (v === undefined) {
      return {
        valid: false,
        encoding: 'bech32',
        hrp,
        witnessVersion: 0,
        dataHex: '',
        dataLength: 0,
        error: `Invalid character "${dataPart[i]}" at position ${i}. Use Bech32 alphabet.`,
      }
    }
    values.push(v)
  }
  const polymod = bech32Polymod([...bech32HrpExpand(hrp), ...values])
  const isBech32m = polymod === BECH32M_CONST
  const isBech32 = polymod === BECH32_CONST
  if (!isBech32 && !isBech32m) {
    return {
      valid: false,
      encoding: isBech32m ? 'bech32m' : 'bech32',
      hrp,
      witnessVersion: values[0] ?? 0,
      dataHex: '',
      dataLength: 0,
      error: 'Checksum invalid',
    }
  }
  const witnessVersion = values[0] ?? 0
  const dataValues = values.slice(1, -6)
  const dataBytes: number[] = []
  let acc = 0
  let bits = 0
  for (const v of dataValues) {
    acc = (acc << 5) | v
    bits += 5
    while (bits >= 8) {
      bits -= 8
      dataBytes.push((acc >> bits) & 0xff)
    }
  }
  const dataHex = dataBytes.map((b) => b.toString(16).padStart(2, '0')).join('')
  return {
    valid: true,
    encoding: isBech32m ? 'bech32m' : 'bech32',
    hrp,
    witnessVersion,
    dataHex,
    dataLength: dataBytes.length,
    error: undefined,
  }
}

export type AddressType = 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'unknown'

export interface AddressDecoderResult {
  type: AddressType
  network: 'mainnet' | 'testnet' | 'unknown'
  valid: boolean
  scriptTemplate?: string
  error?: string
  base58?: Base58CheckResult
  bech32?: Bech32Result
}

export function decodeAddress(address: string): AddressDecoderResult {
  const trimmed = address.trim()
  if (trimmed.length === 0) {
    return { type: 'unknown', network: 'unknown', valid: false, error: 'Enter an address' }
  }
  const lower = trimmed.toLowerCase()
  if (lower.includes('1') && (lower.startsWith('bc1') || lower.startsWith('tb1'))) {
    const res = decodeBech32(trimmed)
    const network = res.hrp === 'bc' ? 'mainnet' : res.hrp === 'tb' ? 'testnet' : 'unknown'
    if (!res.valid) {
      return { type: 'unknown', network, valid: false, bech32: res, error: res.error }
    }
    let type: AddressType = 'unknown'
    let scriptTemplate: string | undefined
    if (res.witnessVersion === 0) {
      if (res.dataLength === 20) {
        type = 'p2wpkh'
        scriptTemplate = 'OP_0 <20-byte-pubkey-hash>'
      } else if (res.dataLength === 32) {
        type = 'p2wsh'
        scriptTemplate = 'OP_0 <32-byte-script-hash>'
      }
    } else if (res.witnessVersion === 1 && res.dataLength === 32) {
      type = 'p2tr'
      scriptTemplate = 'OP_1 <32-byte-x-only-pubkey>'
    }
    return { type, network, valid: true, scriptTemplate, bech32: res }
  }
  const res = decodeBase58Check(trimmed)
  const version = res.versionByte
  const isMainnet = version === 0x00 || version === 0x05
  const isTestnet = version === 0x6f || version === 0xc4
  const network = isMainnet ? 'mainnet' : isTestnet ? 'testnet' : 'unknown'
  if (!res.valid) {
    return { type: 'unknown', network, valid: false, base58: res, error: res.error }
  }
  let type: AddressType = 'unknown'
  let scriptTemplate: string | undefined
  if (version === 0x00 || version === 0x6f) {
    type = 'p2pkh'
    scriptTemplate = 'OP_DUP OP_HASH160 <20-byte-hash> OP_EQUALVERIFY OP_CHECKSIG'
  } else if (version === 0x05 || version === 0xc4) {
    type = 'p2sh'
    scriptTemplate = 'OP_HASH160 <20-byte-hash> OP_EQUAL'
  }
  return { type, network, valid: true, scriptTemplate, base58: res }
}

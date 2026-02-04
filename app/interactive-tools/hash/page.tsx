'use client'

import { useState } from 'react'
import { HashIcon } from '@/app/components/Icons'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'

const HEX_RE = /^[0-9a-fA-F\s]*$/

// Bech32 / Bech32m base32 alphabet (BIP 173 / BIP 350): qpzry9x8gf2tvdw0s3jn54khce6mua7l
const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

function bech32ToBytes(bech32: string): Uint8Array {
  const trimmed = bech32.trim().toLowerCase()
  if (trimmed.length === 0) return new Uint8Array(0)
  // If input contains "1", treat as full Bech32 (e.g. bc1q...): use only the data part after the separator.
  const dataPart = trimmed.includes('1') ? trimmed.slice(trimmed.indexOf('1') + 1) : trimmed
  if (dataPart.length === 0) return new Uint8Array(0)
  const revMap = new Map<string, number>()
  BECH32_ALPHABET.split('').forEach((c, i) => revMap.set(c, i))
  for (let i = 0; i < dataPart.length; i++) {
    if (!revMap.has(dataPart[i])) {
      throw new Error(
        `Invalid Bech32 character "${dataPart[i]}" at position ${i}. Use Bech32 alphabet: qpzry9x8gf2tvdw0s3jn54khce6mua7l`
      )
    }
  }
  // Decode: 8 chars -> 5 bytes. Remainder 1,3,6 invalid; 2,4,5,7 valid (partial block).
  const remainder = dataPart.length % 8
  if (remainder === 1 || remainder === 3 || remainder === 6) {
    throw new Error('Invalid Bech32 data length.')
  }
  const out: number[] = []
  for (let i = 0; i < dataPart.length; i += 8) {
    const block = dataPart.slice(i, i + 8)
    if (block.length < 8) {
      const n = block.length
      let acc = 0
      for (let j = 0; j < n; j++) {
        acc = (acc << 5) | (revMap.get(block[j]) ?? 0)
      }
      const bytes = Math.floor((n * 5) / 8)
      for (let k = 0; k < bytes; k++) {
        out.push((acc >> (n * 5 - 8 * (k + 1))) & 0xff)
      }
    } else {
      const v0 = revMap.get(block[0]) ?? 0
      const v1 = revMap.get(block[1]) ?? 0
      const v2 = revMap.get(block[2]) ?? 0
      const v3 = revMap.get(block[3]) ?? 0
      const v4 = revMap.get(block[4]) ?? 0
      const v5 = revMap.get(block[5]) ?? 0
      const v6 = revMap.get(block[6]) ?? 0
      const v7 = revMap.get(block[7]) ?? 0
      out.push((v0 << 3) | (v1 >> 2))
      out.push(((v1 & 3) << 6) | (v2 << 1) | (v3 >> 4))
      out.push(((v3 & 15) << 4) | (v4 >> 1))
      out.push(((v4 & 1) << 7) | (v5 << 2) | (v6 >> 3))
      out.push(((v6 & 7) << 5) | v7)
    }
  }
  return new Uint8Array(out)
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '')
  if (clean.length % 2 !== 0) {
    throw new Error('Hex must have an even number of characters (each byte is two hex digits).')
  }
  if (!HEX_RE.test(clean)) {
    throw new Error('Hex may only contain 0–9 and a–f (or A–F). Remove any other characters.')
  }
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) {
      throw new Error(`Invalid hex at position ${i * 2}: "${clean.slice(i * 2, i * 2 + 2)}" is not a valid hex byte.`)
    }
    bytes[i] = byte
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hashSHA256(input: Uint8Array): Uint8Array {
  return sha256(input)
}

function hashHASH256(input: Uint8Array): Uint8Array {
  return sha256(sha256(input))
}

function hashHASH160(input: Uint8Array): Uint8Array {
  return ripemd160(sha256(input))
}

function hashRIPEMD160(input: Uint8Array): Uint8Array {
  return ripemd160(input)
}

function getInputBytes(input: string, inputMode: 'text' | 'hex' | 'bech32'): Uint8Array {
  if (inputMode === 'hex') return hexToBytes(input.trim())
  if (inputMode === 'bech32') return bech32ToBytes(input.trim())
  return new TextEncoder().encode(input)
}

function getHashResults(input: string, inputMode: 'text' | 'hex' | 'bech32') {
  if (!input.trim()) {
    return {
      error: null,
      sha256: '',
      hash256: '',
      hash160: '',
      ripemd160: '',
      checksum: '',
    }
  }
  try {
    const bytes = getInputBytes(input, inputMode)
    const hash256Bytes = hashHASH256(bytes)
    return {
      error: null,
      sha256: bytesToHex(hashSHA256(bytes)),
      hash256: bytesToHex(hash256Bytes),
      hash160: bytesToHex(hashHASH160(bytes)),
      ripemd160: bytesToHex(hashRIPEMD160(bytes)),
      checksum: bytesToHex(hash256Bytes.slice(0, 4)),
    }
  } catch (e) {
    return {
      error: (e as Error).message,
      sha256: '',
      hash256: '',
      hash160: '',
      ripemd160: '',
      checksum: '',
    }
  }
}

export default function HashToolPage() {
  const [input, setInput] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'hex' | 'bech32'>('text')

  const {
    error,
    sha256: sha256Result,
    hash256: hash256Result,
    hash160: hash160Result,
    ripemd160: ripemd160Result,
    checksum: checksumResult,
  } = getHashResults(input, inputMode)

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <HashIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Hash Tool</h1>
        <p className="text-secondary text-center">
          Compute SHA-256, HASH256 (double SHA-256), HASH160 (RIPEMD-160 of SHA-256), raw RIPEMD-160,
          and Base58Check checksum. Used in Bitcoin for block hashes, TXIDs, addresses, and script.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Input</label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-3 py-1.5 rounded border text-sm ${
                inputMode === 'text'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-300 dark:border-gray-600 text-secondary'
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setInputMode('hex')}
              className={`px-3 py-1.5 rounded border text-sm ${
                inputMode === 'hex'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-300 dark:border-gray-600 text-secondary'
              }`}
            >
              Hex
            </button>
            <button
              type="button"
              onClick={() => setInputMode('bech32')}
              className={`px-3 py-1.5 rounded border text-sm ${
                inputMode === 'bech32'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-300 dark:border-gray-600 text-secondary'
              }`}
            >
              Bech32
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              inputMode === 'text'
                ? 'Enter text…'
                : inputMode === 'hex'
                  ? 'Enter hex (e.g. 01000000…)'
                  : 'Bech32 data or full address (e.g. bc1q…)'
            }
            className="w-full h-24 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 font-mono text-sm"
            spellCheck={false}
          />
          <div className="min-h-[1.25rem] mt-1 text-red-500 text-sm">
            {error}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-bold text-secondary mb-1">SHA-256</label>
            <output className="block font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {sha256Result || '—'}
            </output>
          </div>
          <div>
            <label className="block font-bold text-secondary mb-1">
              HASH256 (double SHA-256)
            </label>
            <output className="block font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {hash256Result || '—'}
            </output>
          </div>
          <div>
            <label className="block font-bold text-secondary mb-1">
              HASH160 (RIPEMD-160(SHA-256))
            </label>
            <output className="block font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {hash160Result || '—'}
            </output>
          </div>
          <div>
            <label className="block font-bold text-secondary mb-1">
              RIPEMD-160 (raw)
            </label>
            <output className="block font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {ripemd160Result || '—'}
            </output>
          </div>
          <div>
            <label className="block font-bold text-secondary mb-1">
              Base58Check checksum (first 4 bytes of HASH256)
            </label>
            <output className="block font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {checksumResult || '—'}
            </output>
          </div>
        </div>
      </div>
    </>
  )
}

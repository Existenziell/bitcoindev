'use client'

import { useState, useCallback } from 'react'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'
import { sha256 } from '@noble/hashes/sha2.js'
import { ripemd160 } from '@noble/hashes/legacy.js'

const HEX_RE = /^[0-9a-fA-F\s]*$/

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

export default function HashToolPage() {
  const [input, setInput] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'hex'>('text')
  const [error, setError] = useState<string | null>(null)

  const getInputBytes = useCallback((): { bytes: Uint8Array | null; error: string | null } => {
    if (!input.trim()) return { bytes: null, error: null }
    try {
      if (inputMode === 'hex') {
        return { bytes: hexToBytes(input.trim()), error: null }
      }
      return { bytes: new TextEncoder().encode(input), error: null }
    } catch (e) {
      return { bytes: null, error: (e as Error).message }
    }
  }, [input, inputMode])

  const [sha256Result, setSha256Result] = useState('')
  const [hash256Result, setHash256Result] = useState('')
  const [hash160Result, setHash160Result] = useState('')

  const compute = useCallback(() => {
    const { bytes, error: inputError } = getInputBytes()
    if (inputError) {
      setError(inputError)
      setSha256Result('')
      setHash256Result('')
      setHash160Result('')
      return
    }
    if (!bytes) {
      setError(null)
      setSha256Result('')
      setHash256Result('')
      setHash160Result('')
      return
    }
    setError(null)
    setSha256Result(bytesToHex(hashSHA256(bytes)))
    setHash256Result(bytesToHex(hashHASH256(bytes)))
    setHash160Result(bytesToHex(hashHASH160(bytes)))
  }, [getInputBytes])

  return (
    <DocsLayoutWrapper defaultSidebarCollapsed={true}>
      <div className="mb-8">
        <h1 className="heading-page text-center">Hash Tool</h1>
        <p className="text-secondary text-center max-w-2xl mx-auto">
          Compute SHA-256, HASH256 (double SHA-256), and HASH160 (RIPEMD-160 of SHA-256). Used in
          Bitcoin for block hashes, TXIDs, addresses, and script.
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
                  ? 'border-btc bg-btc/10 text-btc'
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
                  ? 'border-btc bg-btc/10 text-btc'
                  : 'border-gray-300 dark:border-gray-600 text-secondary'
              }`}
            >
              Hex
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={compute}
            placeholder={inputMode === 'text' ? 'Enter text…' : 'Enter hex (e.g. 01000000…)'}
            className="w-full h-24 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 font-mono text-sm"
            spellCheck={false}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            type="button"
            onClick={compute}
            className="mt-2 px-4 py-2 rounded bg-btc text-gray-900 font-medium text-sm hover:opacity-90"
          >
            Compute
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">SHA-256</label>
            <output className="block font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {sha256Result || '—'}
            </output>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              HASH256 (double SHA-256)
            </label>
            <output className="block font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {hash256Result || '—'}
            </output>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              HASH160 (RIPEMD-160(SHA-256))
            </label>
            <output className="block font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {hash160Result || '—'}
            </output>
          </div>
        </div>
      </div>
    </DocsLayoutWrapper>
  )
}

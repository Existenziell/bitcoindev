'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { AddressDecoderIcon } from '@/app/components/Icons'
import { decodeAddress } from '@/app/utils/addressDecoder'

const EXAMPLE_ADDRESSES = [
  '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // P2PKH
  '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
  'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', // P2WPKH
  'bc1q60yj2xn6lg876zshc30evnvryl57389m4dv850', // P2WSH
  'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr', // P2TR
]

export default function AddressDecoderPage() {
  const [input, setInput] = useState('')
  const exampleIndexRef = useRef(-1)
  const result = decodeAddress(input)

  const pasteExample = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    exampleIndexRef.current = (exampleIndexRef.current + 1) % EXAMPLE_ADDRESSES.length
    const example = EXAMPLE_ADDRESSES[exampleIndexRef.current]
    setInput(example)
    e.currentTarget.blur()
  }, [])

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <AddressDecoderIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Address Decoder</h1>
        <p className="text-secondary text-center">
          Decode and inspect Bitcoin addresses. See address type (P2PKH, P2SH, P2WPKH, P2WSH, P2TR), network, version
          byte or witness version, hash, and checksum. Supports Base58Check and Bech32/Bech32m.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-sm font-medium">Bitcoin address</label>
            <button
              type="button"
              onClick={pasteExample}
              className="text-sm text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
            >
              Paste example
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
            className="input-mono h-24"
            spellCheck={false}
          />
          <div className="min-h-[1.25rem] mt-1 text-red-500 text-sm">{input.trim() ? result.error : ''}</div>
        </div>

        {input.trim() && (
          <div className="content-box-muted space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">Type:</span>
              <span className="font-mono text-sm uppercase">{result.type}</span>
              <span className="text-secondary">|</span>
              <span className="font-semibold">Network:</span>
              <span className="font-mono text-sm">{result.network}</span>
              {result.valid && (
                <span className="md:ml-auto text-green-600 dark:text-green-400 font-medium">Checksum valid</span>
              )}
            </div>

            {(result.bech32 || result.base58) && (
              <div className="w-full">
                <h2 className="heading-section">Address structure</h2>
                {result.bech32 && (() => {
                  const trimmed = input.trim()
                  const hrpLen = result.bech32!.hrp.length
                  const segments = [
                    { label: 'HRP (human-readable part)', start: 0, end: hrpLen, className: 'bg-amber-200 dark:bg-amber-900/50' },
                    { label: 'Separator', start: hrpLen, end: hrpLen + 1, className: 'bg-stone-400 dark:bg-stone-500' },
                    { label: 'Witness version', start: hrpLen + 1, end: hrpLen + 2, className: 'bg-indigo-200 dark:bg-indigo-800/70' },
                    { label: 'Data', start: hrpLen + 2, end: Math.max(trimmed.length - 6, hrpLen + 2), className: 'bg-emerald-200 dark:bg-emerald-900/50' },
                    { label: 'Checksum', start: Math.max(trimmed.length - 6, hrpLen + 2), end: trimmed.length, className: 'bg-violet-200 dark:bg-violet-900/50' },
                  ]
                  return (
                    <div className="w-full space-y-3">
                      <div className="font-mono break-all leading-loose py-2">
                        {segments.map((seg) =>
                          seg.end > seg.start ? (
                            <span
                              key={seg.label}
                              className={`px-2.5 py-1.5 rounded ${seg.className}`}
                              title={`${seg.label}`}
                            >
                              {trimmed.slice(seg.start, seg.end)}
                            </span>
                          ) : null
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-secondary">
                        <span><span className="inline-block w-4 h-4 rounded bg-amber-200 dark:bg-amber-900/50 align-middle mr-2" /> HRP (human-readable part)</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-stone-400 dark:bg-stone-500 align-middle mr-2" /> Separator</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-indigo-200 dark:bg-indigo-800/70 align-middle mr-2" /> Witness version</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900/50 align-middle mr-2" /> Data</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-violet-200 dark:bg-violet-900/50 align-middle mr-2" /> Checksum</span>
                      </div>
                    </div>
                  )
                })()}
                {result.base58 && (() => {
                  const trimmed = input.trim()
                  // Base58Check: version (1 byte → 1 char), payload (20 bytes), checksum (4 bytes → 6 chars)
                  const versionEnd = 1
                  const checksumStart = Math.max(trimmed.length - 6, versionEnd)
                  const segments = [
                    { label: 'Version (1 byte)', start: 0, end: versionEnd, className: 'bg-amber-200 dark:bg-amber-900/50' },
                    { label: result.type === 'p2pkh' ? 'Public key hash' : result.type === 'p2sh' ? 'Redeem script hash' : 'Payload', start: versionEnd, end: checksumStart, className: 'bg-emerald-200 dark:bg-emerald-900/50' },
                    { label: 'Checksum (4 bytes)', start: checksumStart, end: trimmed.length, className: 'bg-violet-200 dark:bg-violet-900/50' },
                  ]
                  return (
                    <div className="w-full space-y-3">
                      <div className="font-mono break-all leading-loose py-2">
                        {segments.map((seg) =>
                          seg.end > seg.start ? (
                            <span
                              key={seg.label}
                              className={`px-2.5 py-1.5 rounded ${seg.className}`}
                              title={`${seg.label}`}
                            >
                              {trimmed.slice(seg.start, seg.end)}
                            </span>
                          ) : null
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-secondary">
                        <span><span className="inline-block w-4 h-4 rounded bg-amber-200 dark:bg-amber-900/50 align-middle mr-2" /> Version (1 byte)</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900/50 align-middle mr-2" /> {result.type === 'p2pkh' ? 'Public key hash' : result.type === 'p2sh' ? 'Redeem script hash' : 'Payload'} ({result.base58.payloadLength} bytes)</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-violet-200 dark:bg-violet-900/50 align-middle mr-2" /> Checksum (4 bytes)</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {result.scriptTemplate && (
              <div>
                <span className="font-semibold block mb-1">Script template</span>
                {result.type === 'p2pkh' && (
                  <p className="text-secondary text-sm mb-1">P2PKH (pay to public key hash)</p>
                )}
                {result.type === 'p2sh' && (
                  <p className="text-secondary text-sm mb-1">P2SH (pay to script hash)</p>
                )}
                {result.type === 'p2wpkh' && (
                  <p className="text-secondary text-sm mb-1">P2WPKH (pay to witness public key hash)</p>
                )}
                {result.type === 'p2wsh' && (
                  <p className="text-secondary text-sm mb-1">P2WSH (pay to witness script hash)</p>
                )}
                {result.type === 'p2tr' && (
                  <p className="text-secondary text-sm mb-1">P2TR (pay to taproot)</p>
                )}
                <code className="block text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1.5 rounded break-all">
                  {result.scriptTemplate}
                </code>
              </div>
            )}
            {result.base58 && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-secondary">Version byte:</span>{' '}
                  <code>0x{result.base58.versionByte.toString(16).toUpperCase()}</code> ({result.base58.versionByte})
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-secondary">
                      {result.type === 'p2pkh'
                        ? 'Public key hash'
                        : result.type === 'p2sh'
                          ? 'Redeem script hash'
                          : 'Payload'}
                      {' '}({result.base58.payloadLength} bytes):
                    </span>{' '}
                    <code className="break-all">{result.base58.payloadHex || '—'}</code>
                  </div>
                </div>
                <div>
                  <span className="text-secondary">Checksum (4 bytes):</span>{' '}
                  <code>{result.base58.checksumHex || '—'}</code>
                </div>
              </div>
            )}
            {result.bech32 && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-secondary">Encoding:</span> {result.bech32.encoding}
                </div>
                <div>
                  <span className="text-secondary">HRP:</span> <code>{result.bech32.hrp}</code>
                </div>
                <div>
                  <span className="text-secondary">Witness version:</span> {result.bech32.witnessVersion}
                  {' '}
                  <span className="text-secondary text-xs">(encoded as &quot;{input.trim().slice(result.bech32.hrp.length + 1, result.bech32.hrp.length + 2)}&quot; in Bech32)</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-secondary">
                      {result.type === 'p2wpkh'
                        ? 'Public key hash'
                        : result.type === 'p2wsh'
                          ? 'Script hash'
                          : result.type === 'p2tr'
                            ? 'X-only public key'
                            : 'Witness program'}
                      {' '}({result.bech32.dataLength} bytes):
                    </span>{' '}
                    <code className="break-all">{result.bech32.dataHex || '—'}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-secondary text-sm">
          See <Link href="/docs/wallets/address-types" className="link">Address Types</Link> and{' '}
          <Link href="/docs/bitcoin-development/addresses" className="link">Address Generation</Link>{' '}
          for how addresses map to scripts.
        </p>
      </div>
    </>
  )
}

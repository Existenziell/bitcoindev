'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AddressDecoderIcon } from '@/app/components/Icons'
import { decodeAddress } from '@/app/utils/addressDecoder'

export default function AddressDecoderPage() {
  const [input, setInput] = useState('')
  const result = decodeAddress(input)

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

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Bitcoin address</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
            className="w-full h-24 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 font-mono text-sm"
            spellCheck={false}
          />
          <div className="min-h-[1.25rem] mt-1 text-red-500 text-sm">{result.error}</div>
        </div>

        {input.trim() && (
          <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
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
                <h2 className="font-semibold text-lg mb-3">Address structure</h2>
                {result.bech32 && (() => {
                  const trimmed = input.trim()
                  const hrpLen = result.bech32!.hrp.length
                  const segments = [
                    { label: 'HRP (human-readable part)', start: 0, end: hrpLen, className: 'bg-amber-200 dark:bg-amber-900/50' },
                    { label: 'Separator', start: hrpLen, end: hrpLen + 1, className: 'bg-zinc-300 dark:bg-zinc-600' },
                    { label: 'Witness version', start: hrpLen + 1, end: hrpLen + 2, className: 'bg-sky-200 dark:bg-sky-900/50' },
                    { label: 'Data', start: hrpLen + 2, end: Math.max(trimmed.length - 6, hrpLen + 2), className: 'bg-emerald-200 dark:bg-emerald-900/50' },
                    { label: 'Checksum', start: Math.max(trimmed.length - 6, hrpLen + 2), end: trimmed.length, className: 'bg-violet-200 dark:bg-violet-900/50' },
                  ]
                  return (
                    <div className="w-full space-y-3">
                      <div className="font-mono text-lg break-all leading-loose py-1">
                        {segments.map((seg) =>
                          seg.end > seg.start ? (
                            <span
                              key={seg.label}
                              className={`px-1.5 py-0.5 rounded ${seg.className}`}
                              title={`${seg.label}`}
                            >
                              {trimmed.slice(seg.start, seg.end)}
                            </span>
                          ) : null
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-secondary">
                        <span><span className="inline-block w-4 h-4 rounded bg-amber-200 dark:bg-amber-900/50 align-middle mr-2" /> HRP (human-readable part)</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-zinc-300 dark:bg-zinc-600 align-middle mr-2" /> Separator</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-sky-200 dark:bg-sky-900/50 align-middle mr-2" /> Witness version</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900/50 align-middle mr-2" /> Data</span>
                        <span><span className="inline-block w-4 h-4 rounded bg-violet-200 dark:bg-violet-900/50 align-middle mr-2" /> Checksum</span>
                      </div>
                    </div>
                  )
                })()}
                {result.base58 && (
                  <div className="w-full space-y-3">
                    <div
                      className="flex w-full gap-0.5 h-12 rounded overflow-hidden"
                      role="img"
                      aria-label="Address byte structure: version, payload, checksum"
                    >
                      <div
                        className="flex-[1] min-w-0 bg-amber-200 dark:bg-amber-900/50"
                        title="Version (1 byte)"
                      />
                      <div
                        className="flex-[20] min-w-0 bg-emerald-200 dark:bg-emerald-900/50"
                        title={`Payload (${result.base58.payloadLength} bytes)`}
                      />
                      <div
                        className="flex-[4] min-w-0 bg-violet-200 dark:bg-violet-900/50"
                        title="Checksum (4 bytes)"
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-secondary">
                      <span><span className="inline-block w-4 h-4 rounded-sm bg-amber-200 dark:bg-amber-900/50 align-middle mr-2" /> Version (1 byte)</span>
                      <span><span className="inline-block w-4 h-4 rounded-sm bg-emerald-200 dark:bg-emerald-900/50 align-middle mr-2" /> Hash ({result.base58.payloadLength} bytes)</span>
                      <span><span className="inline-block w-4 h-4 rounded-sm bg-violet-200 dark:bg-violet-900/50 align-middle mr-2" /> Checksum (4 bytes)</span>
                    </div>
                  </div>
                )}
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
                    <span className="text-secondary">Payload ({result.base58.payloadLength} bytes raw):</span>{' '}
                    <code className="break-all">{result.base58.payloadHex || '—'}</code>
                  </div>
                  <div>
                    <span className="text-secondary">Hex:</span>{' '}
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
                    <span className="text-secondary">Data ({result.bech32.dataLength} bytes raw):</span>{' '}
                    <code className="break-all">{result.bech32.dataHex || '—'}</code>
                  </div>
                  <div>
                    <span className="text-secondary">Hex:</span>{' '}
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

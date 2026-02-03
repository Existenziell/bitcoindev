'use client'

import { useState } from 'react'
import Link from 'next/link'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'
import { AddressDecoderIcon } from '@/app/components/Icons'
import { decodeAddress } from '@/app/utils/addressDecoder'

export default function AddressDecoderPage() {
  const [input, setInput] = useState('')
  const result = decodeAddress(input)

  return (
    <DocsLayoutWrapper defaultSidebarCollapsed={true}>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <AddressDecoderIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Address Decoder</h1>
        <p className="text-secondary text-center max-w-2xl mx-auto">
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
            placeholder="e.g. bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq or 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
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
                <span className="ml-auto text-green-600 dark:text-green-400 font-medium">Checksum valid</span>
              )}
            </div>
            {result.scriptTemplate && (
              <div>
                <span className="font-semibold block mb-1">Script template</span>
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
                <div>
                  <span className="text-secondary">Payload ({result.base58.payloadLength} bytes):</span>{' '}
                  <code className="break-all">{result.base58.payloadHex || '—'}</code>
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
                </div>
                <div>
                  <span className="text-secondary">Data ({result.bech32.dataLength} bytes):</span>{' '}
                  <code className="break-all">{result.bech32.dataHex || '—'}</code>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-secondary text-sm">
          See <Link href="/docs/wallets/address-types" className="text-btc hover:underline">Address Types</Link> and{' '}
          <Link href="/docs/bitcoin-development/addresses" className="text-btc hover:underline">Address Generation</Link>{' '}
          for how addresses map to scripts.
        </p>
      </div>
    </DocsLayoutWrapper>
  )
}

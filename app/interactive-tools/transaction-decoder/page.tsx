'use client'

import { useState } from 'react'
import Link from 'next/link'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'
import { TransactionDecoderIcon } from '@/app/components/Icons'
import { decodeRawTransaction } from '@/app/utils/transactionDecoder'

export default function TransactionDecoderPage() {
  const [input, setInput] = useState('')
  const result = decodeRawTransaction(input)

  return (
    <DocsLayoutWrapper>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <TransactionDecoderIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Transaction Decoder</h1>
        <p className="text-secondary text-center max-w-2xl mx-auto">
          Paste raw transaction hex to decode version, inputs (outpoint, scriptSig, sequence), outputs (value,
          scriptPubKey), and locktime. Supports SegWit transactions. Get raw hex from{' '}
          <Link href="/interactive-tools/terminal" className="text-btc hover:underline">getrawtransaction</Link> or block explorers.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Raw transaction (hex)</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0100000001..."
            className="w-full h-32 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 font-mono text-sm"
            spellCheck={false}
          />
          <div className="min-h-[1.25rem] mt-1 text-red-500 text-sm">{result.error}</div>
        </div>

        {input.trim() && !result.error && (
          <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-secondary">Version:</span> <code>{result.version}</code>
              </span>
              <span>
                <span className="text-secondary">SegWit:</span> {result.segwit ? 'Yes' : 'No'}
              </span>
              <span>
                <span className="text-secondary">Locktime:</span> <code>{result.locktime}</code>
              </span>
              <span>
                <span className="text-secondary">Raw size:</span> {result.rawHexLength / 2} bytes
              </span>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Inputs ({result.inputs.length})</h2>
              <ul className="space-y-3">
                {result.inputs.map((inp, i) => (
                  <li key={i} className="text-sm border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                    <div>
                      <span className="text-secondary">Prev out:</span>{' '}
                      <code className="break-all">{inp.txid}</code>:{inp.vout}
                    </div>
                    <div>
                      <span className="text-secondary">scriptSig ({inp.scriptSigLength} bytes):</span>{' '}
                      <code className="break-all text-xs">{inp.scriptSigHex || '—'}</code>
                    </div>
                    <div>
                      <span className="text-secondary">Sequence:</span> <code>0x{inp.sequence.toString(16)}</code>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Outputs ({result.outputs.length})</h2>
              <ul className="space-y-3">
                {result.outputs.map((out, i) => (
                  <li key={i} className="text-sm border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                    <div>
                      <span className="text-secondary">Value:</span> {out.valueBtc} BTC ({out.valueSats.toString()} sats)
                    </div>
                    <div>
                      <span className="text-secondary">scriptPubKey ({out.scriptPubKeyLength} bytes):</span>{' '}
                      <code className="break-all text-xs">{out.scriptPubKeyHex}</code>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="text-secondary text-sm">
          See <Link href="/docs/bitcoin/transaction-structure" className="text-btc hover:underline">Transaction Structure</Link> and{' '}
          <Link href="/docs/bitcoin/data-encoding" className="text-btc hover:underline">Data Encoding</Link>. Use the{' '}
          <Link href="/interactive-tools/terminal" className="text-btc hover:underline">CLI Terminal</Link> to fetch raw hex with{' '}
          <code>getrawtransaction &lt;txid&gt;</code>.
        </p>
      </div>
    </DocsLayoutWrapper>
  )
}

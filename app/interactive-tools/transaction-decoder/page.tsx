'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { TransactionDecoderIcon } from '@/app/components/Icons'
import { decodeRawTransaction } from '@/app/utils/transactionDecoder'

const EXAMPLE_TX_HEX = [
  '010000000001017ffaab5f4afbd3c16dd1cf5e50c597d4a110c3bd9c95dac246f1a5c0bbd2367703000000000000000001de71b40100000000160014d3c9251a7afa0fed0a17c45f964d8327e9e89cbb024830450221009d8b221dbfb41af856ee68df3064ce71b002e4616b41660809c2de7ac12ed375022001bcbf67a605eef17735e9fa8765dd3a6fd469c677e244369e912f333cf7464801210274cc07cd10704b570e882d1fa620828d2240c39462c7a560d5e8ecfa4a840f8000000000',
  '020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff5d0301450e04600e85692f466f756e6472792055534120506f6f6c202364726f70676f6c642ffabe6d6d0d33b9353a6031988e415a3195fe450317970469c304cd9d6f2c9b05c1aa09d501000000000000004b4af2f1b816000000000000ffffffff043f0d4013000000002200207086320071974eef5e72eaa01dd9096e10c0383483855ea6b344259c244f73c20000000000000000266a24aa21a9ed2eec4e61f289d6821f6ed5efe48552b15b2dc16084b5dccd448ea616562431f900000000000000002f6a2d434f5245015b9b30813264eaab2b70817a36c94733812e591ce6d18fda214e5b9f350ffc7b6cf3058b9026e76500000000000000002b6a2952534b424c4f434b3a559a7f00cf729b0f919528acd3026cfa816d21162d1d26c5f83229190081aac70120000000000000000000000000000000000000000000000000000000000000000000000000',
  '02000000000109f3bf6c29294891a8631ad067b85114702f0032fdaf70025c7fa8b1f4532c29a11000000017160014e065b769c1569b5312370a73c0662f0612ea3849fdffffff04c91f8c87d6069eaf59aca3aacc277957f314c50f168780219f7a421173b84c0800000017160014e01be6e5f3c6c9474bae6392f5208e2d60d553b1fdffffff7c2b2a36b1777228f8feb38ccb34682fbacaf3f0f2e7294be63a8023222112bb0900000017160014769b8dfa0f351a8ddf80189d463afa6e854b2422fdffffff5428521628fc82f7ba06b4df34a5a7fa539c586f5541c2456664037dfc4349be02000000171600148e9ed90b74ce1d82db4a3aceeed57e3fc719c506fdffffff254154203ee90c7bff63ba338501c63a273fdd40269e9ccf81832323cb25a813010000001716001494963cfed3595878a668ccb4278c539552df53fdfdfffffff2a1b8c6497a76828d379a8fda310701e3155882e78cd4c645561c71a039c04a080000001716001438dcd4a64e9c259ed96cbefee06f9dd3edce632bfdffffffd828879fa2b6c35a49265c15e821ee532b98b556838594ccd1b95eddea656101040000001716001442eb2aa99bd93ab60870258c36bfc58020366326fdffffff5cda2a6134ce3228833f8786d0e0feb249e87d9729b9c3d7970463675b1ebf3a0800000017160014830e7c59f2c8f6754c6a2c5cf5c194a29d13e4f8fdffffffe17e8a854a7688f7fd0ed43f210f8e9558e8f5e388b514a2d12bce993b22dddf07000000171600143c9a64f178c1e1164c7c6cf50ee57eb35b1fc23ffdffffff0276f32a000000000017a914b359a71c06558f23e25269aab895997ca10dfc168780a1031c000000001600142119d50f40b9aa185bd8406cac62f9998e4efd8e02483045022100e2cd48dcb413eac049a0d28b93cb4dfbf562c442838f9cf634eb67c5adb47cce0220383c0b5d711c392001797d4be1eea19993a9bfcb7272457000d7e2f0014a62dd0121020dd4d1cd6193811d967a763b17e835aedfc8ca3041e27e7d258a844ad509709f0247304402203bb3c969f4cfc872ddddcadef9b1160027ab23275938d53e2b131f8abd3e6b190220269b0171e4ca64620a3744e9d91efbd23b95fd56bcdd7a1e8a03cc778cc8de9e012102bdca41f593664dfd7e30f5ccdafdc435d38a4901ccc1c8e168cc75e76f13c02f024730440220503531fed2ff09c3d90cac721e51caa80bde970416d39d2a5c98d40b9456dbc80220584eaea675faf905b352839a97d9eb4797acead4058b70c8bd5809f6961505cf012103b66b9bfd003855eb9c77859fd4339d4146a90ca6147bc4321d8e81a62b70d7e602473044022070c09a7f2f1e45a39f21bee12683e2eb43c35c5fc511471a06609b46d39ae29d022019583f58e248d9b4fe2a7159c393138c01fa0a3c2016aa4cf0e81c139e70b0ac01210287b670ccd8d28c9b27a14155f6db4eee894605df52b189912120c9de1db11c0302473044022027883de6932fb5283d83406d09d5adcce3bbb26904639f48695f5a9522c4b257022057d185b2e06db02359983c060b91c77aaa95f453500cafab8fefa837779e261501210396e25311f370ca9732b2dd3e3fcb158fdae2bbce53698b3b1bb4deb4402fbfd90247304402207a034731b0620e8cc9a0ce742e7ffb87f680f694120fece85dabe3627d241d0802202b2cef0fa647ce64b3349f5412ae0abe871a3d6ce6dbecd56aa7ec7451c46c0d012102e11c478c154ad6353c78c1fd01f281cc8883c9584553975e6553660b7ca0c35302483045022100c0d445756702af0df996c5a006809dc096f4c706ea27687cb468632ecd0bc51e0220238f70fecc75cf7418624bf173a8d78070f02dd14863d1218b35776665e859e701210221932c0644437c7eb28e77f5f15db26a520e9baf5a4d1671d76ec0e119f84ee202483045022100e51d8d55f42119cb99420df97c017efb546c11ea5c7aab899192e77e5651bfad02201f0e4254969734045aab1c232ff26e278c96f0b08b759dd0a02e2dbb8e5da0890121029c442d294f70e86ab75dc74011dda6b2c35fc552da644e9b7d28dbbdcf11d93702483045022100ee799ed345d93a7c642eccc67c9ceb9eb8351d9f9b2e203aff053f86f29ea9cf0220355ae11e87b37efdf3434129c617a174f5e983424839bb8e9ca86438a8a4f1ad012102179696114979130a2790c6781cdd8f87d8240f27dd7f8f5a39e3638874fad1aa00000000',
  '02000000011e4bb9938fb9eab2b6af4b7a881240c5d6f86d3f4e95aa74f9ee2846979b822f010000006a473044022023b6a697af540f3ccfdbc4a0b7f5963183b8c4bef70987d7c761d603af3231fa0220160c6108f0e6a95ebca06cdec12f5a21d6db3da94aaba95656aff0ac45c2ba7f012103397924022cdcf4c2e472eef18b43e73e0df58e3f48712a4f1e2608a7a30fd847ffffffff0200a5459b010000001976a9143092f1e718af0c1a681c634f10092d526606931688ac61677aa9070000001976a914ef00d064fa3970aec0dbcbdb25e04ea320eed30788ac00000000',
]

export default function TransactionDecoderPage() {
  const [input, setInput] = useState('')
  const exampleIndexRef = useRef(-1)
  const result = decodeRawTransaction(input)

  const pasteExample = useCallback(() => {
    exampleIndexRef.current = (exampleIndexRef.current + 1) % EXAMPLE_TX_HEX.length
    setInput(EXAMPLE_TX_HEX[exampleIndexRef.current])
  }, [])

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <TransactionDecoderIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Transaction Decoder</h1>
        <p className="text-secondary text-center">
          Paste raw transaction hex to decode version, inputs (outpoint, scriptSig, sequence), outputs (value,
          scriptPubKey), and locktime. Supports SegWit transactions. Get raw hex from{' '}
          <Link href="/interactive-tools/terminal" className="link">getrawtransaction</Link> or block explorers.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-sm font-medium">Raw transaction (hex)</label>
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
            placeholder="0100000001..."
            className="input-mono h-32"
            spellCheck={false}
          />
          <div className="min-h-[1.25rem] mt-1 text-red-500 text-sm">{input.trim() ? result.error : ''}</div>
        </div>

        {input.trim() && !result.error && (
          <div className="content-box-muted space-y-4">
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

            {result.segments && result.segments.length > 0 && (
              <div className="w-full">
                <h2 className="font-semibold text-lg mb-3">Transaction structure</h2>
                <div
                  className="flex w-full gap-0.5 h-12 rounded overflow-hidden min-w-0"
                  role="img"
                  aria-label="Transaction byte structure"
                >
                  {result.segments.map((seg) => {
                    const len = seg.end - seg.start
                    const colorClass =
                      seg.label === 'Version'
                        ? 'bg-amber-200 dark:bg-amber-900/50'
                        : seg.label === 'SegWit marker'
                          ? 'bg-zinc-300 dark:bg-zinc-600'
                          : seg.label === 'Inputs'
                            ? 'bg-sky-200 dark:bg-sky-900/50'
                            : seg.label === 'Outputs'
                              ? 'bg-emerald-200 dark:bg-emerald-900/50'
                              : seg.label === 'Witness'
                                ? 'bg-violet-200 dark:bg-violet-900/50'
                                : 'bg-slate-300 dark:bg-slate-600'
                    return (
                      <div
                        key={seg.label}
                        className={`min-w-[2px] ${colorClass}`}
                        style={{ flex: `${len} 1 0` }}
                        title={`${seg.label} (${len} bytes)`}
                      />
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-secondary mt-2">
                  {result.segments.map((seg) => {
                    const colorClass =
                      seg.label === 'Version'
                        ? 'bg-amber-200 dark:bg-amber-900/50'
                        : seg.label === 'SegWit marker'
                          ? 'bg-zinc-300 dark:bg-zinc-600'
                          : seg.label === 'Inputs'
                            ? 'bg-sky-200 dark:bg-sky-900/50'
                            : seg.label === 'Outputs'
                              ? 'bg-emerald-200 dark:bg-emerald-900/50'
                              : seg.label === 'Witness'
                                ? 'bg-violet-200 dark:bg-violet-900/50'
                                : 'bg-slate-300 dark:bg-slate-600'
                    return (
                      <span key={seg.label}>
                        <span
                          className={`inline-block w-4 h-4 rounded-sm align-middle mr-2 ${colorClass}`}
                          aria-hidden
                        />
                        {seg.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

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
          See <Link href="/docs/bitcoin/transaction-structure" className="link">Transaction Structure</Link> and{' '}
          <Link href="/docs/bitcoin/data-encoding" className="link">Data Encoding</Link>. Use the{' '}
          <Link href="/interactive-tools/terminal" className="link">CLI Terminal</Link> to fetch raw hex with{' '}
          <code>getrawtransaction &lt;txid&gt;</code>.
        </p>
      </div>
    </>
  )
}

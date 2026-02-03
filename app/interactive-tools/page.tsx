import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'
import { SITE_URL } from '@/app/utils/metadata'
import {
  TerminalIcon,
  StackLabIcon,
  BlockVisualizerIcon,
  HashIcon,
  CalculatorIcon,
  AddressDecoderIcon,
  TransactionDecoderIcon,
  FeeEstimatorIcon,
  ToolsIcon,
} from '@/app/components/Icons'

export const metadata: Metadata = {
  title: 'Interactive Tools | BitcoinDev',
  description:
    'Interactive Bitcoin tools: CLI terminal, Stack Lab, Block Visualizer, Hash tool, Address Decoder, Transaction Decoder, Fee Estimator, and denomination converter.',
  alternates: { canonical: `${SITE_URL}/interactive-tools` },
  openGraph: {
    title: 'Interactive Tools | BitcoinDev',
    description:
      'Interactive Bitcoin tools: CLI terminal, Stack Lab, Block Visualizer, Address Decoder, Transaction Decoder, Fee Estimator, denomination converter.',
    url: `${SITE_URL}/interactive-tools`,
  },
}

const tools = [
  {
    href: '/interactive-tools/terminal',
    title: 'CLI Terminal',
    description: 'Run Bitcoin RPC in the browser. getblock, getrawtransaction, and more.',
  },
  {
    href: '/interactive-tools/stack-lab',
    title: 'Stack Lab',
    description: 'Bitcoin Script playground. Build and run locking and unlocking scripts.',
  },
  {
    href: '/interactive-tools/block-visualizer',
    title: 'Block Visualizer',
    description: 'Explore blocks and transactions. Treemap by vBytes or fee.',
  },
  {
    href: '/interactive-tools/hash',
    title: 'Hash Tool',
    description: 'SHA-256, HASH256, HASH160. For hashes, TXIDs, and addresses.',
  },
  {
    href: '/interactive-tools/address-decoder',
    title: 'Address Decoder',
    description: 'Decode addresses. Type, version, hash, checksum. Base58Check and Bech32.',
  },
  {
    href: '/interactive-tools/transaction-decoder',
    title: 'Transaction Decoder',
    description: 'Paste raw tx hex. See version, inputs, outputs, locktime.',
  },
  {
    href: '/interactive-tools/fee-estimator',
    title: 'Fee Estimator',
    description: 'Estimate fee from vBytes and current rate. Sats and USD.',
  },
  {
    href: '/interactive-tools/denominations-calculator',
    title: 'Denomination Calculator',
    description: 'Convert between sats, BTC, and other units. Visualize the size of different units.',
  },
]

export default function ToolsPage() {
  return (
    <DocsLayoutWrapper defaultSidebarCollapsed={true}>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <ToolsIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Interactive Tools</h1>
        <p className="text-secondary text-center max-w-2xl mx-auto">
          Interactive tools for learning and working with Bitcoin. No installation required.
        </p>
      </div>

      <ul className="flex flex-wrap gap-4 justify-center max-w-5xl mx-auto">
        {tools.map((tool) => (
          <li key={tool.href} className="min-w-[260px] flex-[1_1_260px] max-w-[340px]">
            <Link
              href={tool.href}
              className="tool-card block h-full"
            >
              <div className="flex items-center gap-3 mb-2">
                {tool.href === '/interactive-tools/terminal' && <TerminalIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/interactive-tools/stack-lab' && <StackLabIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/interactive-tools/block-visualizer' && <BlockVisualizerIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/interactive-tools/hash' && <HashIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/interactive-tools/address-decoder' && <AddressDecoderIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/interactive-tools/transaction-decoder' && <TransactionDecoderIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/interactive-tools/fee-estimator' && <FeeEstimatorIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/interactive-tools/denominations-calculator' && <CalculatorIcon className="w-6 h-6 shrink-0 text-btc" />}
                <h2 className="text-lg font-semibold">{tool.title}</h2>
              </div>
              <p className="text-secondary text-sm">{tool.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </DocsLayoutWrapper>
  )
}

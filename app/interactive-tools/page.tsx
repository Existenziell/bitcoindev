import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/app/utils/constants'
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
    'Interactive Bitcoin tools: CLI terminal, Stack Lab, Block Visualizer, Hash tool, Address Decoder, Transaction Decoder, Fee Estimator, and denominations calculator.',
  alternates: { canonical: `${SITE_URL}/interactive-tools` },
  openGraph: {
    title: 'Interactive Tools | BitcoinDev',
    description:
      'Interactive Bitcoin tools: CLI terminal, Stack Lab, Block Visualizer, Address Decoder, Transaction Decoder, Fee Estimator, denominations calculator.',
    url: `${SITE_URL}/interactive-tools`,
  },
}

const tools = [
  {
    href: '/interactive-tools/terminal',
    title: 'CLI Terminal',
    description: 'Run Bitcoin RPC in the browser via the Bitcoin Core RPC interface.',
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
    description: 'Decode addresses to see version, hash, checksum, address type, ...',
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
    title: 'Denominations',
    description: 'Convert between denominations to visualize the different units.',
  },
]

export default function ToolsPage() {
  return (
    <>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <ToolsIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Interactive Tools</h1>
        <p className="text-secondary text-center">
          Interactive tools for learning and working with Bitcoin. No installation required.
        </p>
      </div>

      <ul className="flex flex-wrap gap-4 justify-center max-w-6xl mx-auto">
        {tools.map((tool) => (
          <li key={tool.href} className="w-[280px] shrink-0">
            <Link
              href={tool.href}
              className="tool-card block h-full"
            >
              <div className="flex items-center gap-3 mb-2">
                {tool.href === '/interactive-tools/terminal' && <TerminalIcon className="w-6 h-6 shrink-0 text-accent" />}
                {tool.href === '/interactive-tools/stack-lab' && <StackLabIcon className="w-6 h-6 shrink-0 text-accent" />}
                {tool.href === '/interactive-tools/block-visualizer' && <BlockVisualizerIcon className="w-6 h-6 shrink-0 text-accent" />}
                {tool.href === '/interactive-tools/hash' && <HashIcon className="w-6 h-6 shrink-0 text-accent" />}
                {tool.href === '/interactive-tools/address-decoder' && <AddressDecoderIcon className="w-6 h-6 shrink-0 text-accent" />}
                {tool.href === '/interactive-tools/transaction-decoder' && <TransactionDecoderIcon className="w-6 h-6 shrink-0 text-accent" />}
                {tool.href === '/interactive-tools/fee-estimator' && <FeeEstimatorIcon className="w-6 h-6 shrink-0 text-accent" />}
                {tool.href === '/interactive-tools/denominations-calculator' && <CalculatorIcon className="w-6 h-6 shrink-0 text-accent" />}
                <h2 className="text-lg font-semibold">{tool.title}</h2>
              </div>
              <p className="text-secondary text-sm">{tool.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

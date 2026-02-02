import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'
import { SITE_URL } from '@/app/utils/metadata'
import { TerminalIcon, StackLabIcon, BlockVisualizerIcon, HashIcon, CalculatorIcon } from '@/app/components/Icons'

export const metadata: Metadata = {
  title: 'Tools | BitcoinDev',
  description: 'Interactive Bitcoin tools: CLI terminal, Stack Lab script playground, Block Visualizer, and denomination converter.',
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    title: 'Tools | BitcoinDev',
    description: 'Interactive Bitcoin tools: CLI terminal, Stack Lab, Block Visualizer, denomination converter.',
    url: `${SITE_URL}/tools`,
  },
}

const tools = [
  {
    href: '/terminal',
    title: 'CLI Terminal',
    description: 'Run Bitcoin RPC commands in the browser. No node setup required. Query the chain, decode transactions, and try getblock, getrawtransaction, and more.',
  },
  {
    href: '/stack-lab',
    title: 'Stack Lab',
    description: 'Interactive Bitcoin Script playground. Build locking and unlocking scripts, run them step by step, and try challenges.',
  },
  {
    href: '/block-visualizer',
    title: 'Block Visualizer',
    description: 'Explore the latest Bitcoin blocks and transactions. Treemap view by vBytes or fee; click a transaction for inputs and outputs.',
  },
  {
    href: '/tools/hash',
    title: 'Hash Tool',
    description: 'Compute SHA-256, HASH256 (double SHA-256), and HASH160. Used in Bitcoin for block hashes, TXIDs, addresses, and script.',
  },
  {
    href: '/docs/fundamentals/denominations',
    title: 'Denomination Calculator',
    description: 'Convert between satoshis, BTC, and other units. The Denominations calculator helps visualize the size of different units.',
  },
]

export default function ToolsPage() {
  return (
    <DocsLayoutWrapper defaultSidebarCollapsed={true}>
      <div className="mb-8">
        <h1 className="heading-page text-center">Tools</h1>
        <p className="text-secondary text-center max-w-2xl mx-auto">
          Interactive tools for learning and working with Bitcoin. No installation required.
        </p>
      </div>

      <ul className="space-y-6 max-w-2xl mx-auto">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="tool-card"
            >
              <div className="flex items-center gap-3 mb-2">
                {tool.href === '/terminal' && <TerminalIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/stack-lab' && <StackLabIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/block-visualizer' && <BlockVisualizerIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/tools/hash' && <HashIcon className="w-6 h-6 shrink-0 text-btc" />}
                {tool.href === '/docs/fundamentals/denominations' && <CalculatorIcon className="w-6 h-6 shrink-0 text-btc" />}
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

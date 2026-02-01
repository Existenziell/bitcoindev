import type { Metadata } from 'next'
import BlockVisualizer from '@/app/components/BlockVisualizer'
import DocsLayoutWrapper from '@/app/components/DocsLayoutWrapper'
import { SITE_URL } from '@/app/utils/metadata'

export const metadata: Metadata = {
  title: 'Block Visualizer | BitcoinDev',
  description: 'Live Bitcoin blockchain visualization showing the latest block with transaction treemap. Explore transactions, fee rates, and block data in real-time.',
  alternates: { canonical: `${SITE_URL}/block-visualizer` },
  openGraph: {
    title: 'Block Visualizer | BitcoinDev',
    description: 'Live Bitcoin blockchain visualization showing the latest block with transaction treemap.',
    url: `${SITE_URL}/block-visualizer`,
  },
}

export default function MempoolPage() {
  return (
    <DocsLayoutWrapper defaultSidebarCollapsed={true}>
      <div className="mb-8">
        <h1 className="heading-page text-center">Block Visualizer (beta)</h1>
        <p className="text-secondary text-center mb-2 max-w-2xl mx-auto">
          Explore the latest Bitcoin blocks and their transactions.
          Each rectangle represents a transaction, sized by vBytes or fee.
          Click on any transaction to view its inputs and outputs.
        </p>
        <p className="text-secondary text-sm text-center max-w-2xl mx-auto">
          Observing <span className="font-semibold">Bitcoin mainnet</span> via PublicNode.
          Blocks update automatically when new blocks are found (~10 minutes).
        </p>
      </div>

      <BlockVisualizer />
    </DocsLayoutWrapper>
  )
}

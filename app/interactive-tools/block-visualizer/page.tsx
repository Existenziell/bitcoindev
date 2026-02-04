import type { Metadata } from 'next'
import BlockVisualizer from '@/app/components/block-visualizer/BlockVisualizer'
import { SITE_URL } from '@/app/utils/metadata'
import { BlockVisualizerIcon } from '@/app/components/Icons'

export const metadata: Metadata = {
  title: 'Block Visualizer | BitcoinDev',
  description: 'Live Bitcoin blockchain visualization showing the latest block with transaction treemap. Explore transactions, fee rates, and block data in real-time.',
  alternates: { canonical: `${SITE_URL}/interactive-tools/block-visualizer` },
  openGraph: {
    title: 'Block Visualizer | BitcoinDev',
    description: 'Live Bitcoin blockchain visualization showing the latest block with transaction treemap.',
    url: `${SITE_URL}/interactive-tools/block-visualizer`,
  },
}

export default function MempoolPage() {
  return (
    <>
      <div className="mb-8">
        <div className="flex justify-center mb-3">
          <BlockVisualizerIcon className="w-20 h-20" />
        </div>
        <h1 className="heading-page text-center">Block Visualizer (beta)</h1>
        <p className="text-secondary text-center mb-2">
          Explore the latest Bitcoin blocks and their transactions.
          Observing <span className="font-semibold">Bitcoin mainnet</span> via PublicNode.
          Blocks update automatically when new blocks are found (~10 minutes).
        </p>
      </div>

      <BlockVisualizer />
    </>
  )
}

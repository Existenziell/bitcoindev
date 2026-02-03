import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import TransactionDetail from '@/app/components/TransactionDetail'
import Footer from '@/app/components/Footer'
import { SITE_URL } from '@/app/utils/metadata'

interface PageProps {
  params: Promise<{ txid: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { txid } = await params
  const url = `${SITE_URL}/interactive-tools/block-visualizer/tx/${txid}`
  return {
    title: `Transaction ${txid.slice(0, 8)}... | BitcoinDev`,
    description: `Bitcoin transaction details including inputs, outputs, fees, and more.`,
    alternates: { canonical: url },
    openGraph: {
      title: `Transaction ${txid.slice(0, 8)}... | BitcoinDev`,
      description: `Bitcoin transaction details`,
      url,
    },
  }
}

export default async function TransactionPage({ params }: PageProps) {
  const { txid } = await params

  if (!txid || txid.length !== 64) {
    notFound()
  }

  return (
    <main className="flex-1 page-bg flex flex-col">
      <div className="flex-grow">
        <div className="container-content pt-8">
          <div className="max-w-7xl mx-auto">
            <TransactionDetail txid={txid} />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

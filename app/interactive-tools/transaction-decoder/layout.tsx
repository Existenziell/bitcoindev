import type { Metadata } from 'next'
import { SITE_URL } from '@/app/utils/metadata'

export const metadata: Metadata = {
  title: 'Transaction Decoder | BitcoinDev',
  description:
    'Decode raw Bitcoin transaction hex. See version, inputs (outpoint, scriptSig, sequence), outputs (value, scriptPubKey), and locktime. Supports SegWit.',
  alternates: { canonical: `${SITE_URL}/interactive-tools/transaction-decoder` },
}

export default function TransactionDecoderLayout({ children }: { children: React.ReactNode }) {
  return children
}

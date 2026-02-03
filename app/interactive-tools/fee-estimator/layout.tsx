import type { Metadata } from 'next'
import { SITE_URL } from '@/app/utils/metadata'

export const metadata: Metadata = {
  title: 'Fee Estimator | BitcoinDev',
  description:
    'Estimate Bitcoin transaction fee from size (vBytes) and current network rate. See fee in sats and USD for 1-block and 6-block targets.',
  alternates: { canonical: `${SITE_URL}/interactive-tools/fee-estimator` },
}

export default function FeeEstimatorLayout({ children }: { children: React.ReactNode }) {
  return children
}

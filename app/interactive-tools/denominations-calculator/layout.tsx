import type { Metadata } from 'next'
import { SITE_URL } from '@/app/utils/metadata'

export const metadata: Metadata = {
  title: 'Denominations Calculator | BitcoinDev',
  description:
    'Convert between Bitcoin units: satoshis (sats), BTC, bits (µBTC), millibits (mBTC), and more. Interactive calculator with live conversion.',
  alternates: { canonical: `${SITE_URL}/interactive-tools/denominations-calculator` },
}

export default function DenominationsCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from 'next'
import { SITE_URL } from '@/app/utils/metadata'

export const metadata: Metadata = {
  title: 'Hash Tool | BitcoinDev',
  description: 'Compute SHA-256, HASH256, and HASH160. Used in Bitcoin for block hashes, TXIDs, addresses, and script.',
  alternates: { canonical: `${SITE_URL}/interactive-tools/hash` },
}

export default function HashToolLayout({ children }: { children: React.ReactNode }) {
  return children
}

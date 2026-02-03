import type { Metadata } from 'next'
import { SITE_URL } from '@/app/utils/metadata'

export const metadata: Metadata = {
  title: 'Address Decoder | BitcoinDev',
  description:
    'Decode and inspect Bitcoin addresses. See type (P2PKH, P2SH, P2WPKH, P2WSH, P2TR), version, hash, and checksum. Base58Check and Bech32/Bech32m.',
  alternates: { canonical: `${SITE_URL}/interactive-tools/address-decoder` },
}

export default function AddressDecoderLayout({ children }: { children: React.ReactNode }) {
  return children
}

import { createToolLayout } from '@/app/utils/toolLayout'

const { metadata: toolMetadata, ToolLayout } = createToolLayout({
  title: 'Address Decoder',
  description:
    'Decode and inspect Bitcoin addresses. See type (P2PKH, P2SH, P2WPKH, P2WSH, P2TR), version, hash, and checksum. Base58Check and Bech32/Bech32m.',
  path: 'address-decoder',
})

export const metadata = toolMetadata
export default ToolLayout

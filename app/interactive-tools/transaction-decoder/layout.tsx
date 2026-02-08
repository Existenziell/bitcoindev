import { createToolLayout } from '@/app/utils/toolLayout'

const { metadata: toolMetadata, ToolLayout } = createToolLayout({
  title: 'Transaction Decoder',
  description:
    'Decode raw Bitcoin transaction hex. See version, inputs (outpoint, scriptSig, sequence), outputs (value, scriptPubKey), and locktime. Supports SegWit.',
  path: 'transaction-decoder',
})

export const metadata = toolMetadata
export default ToolLayout
